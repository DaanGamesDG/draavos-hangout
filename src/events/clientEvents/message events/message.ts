import {
	GuildMember,
	Message,
	NewsChannel,
	TextChannel,
	User,
} from "discord.js";
import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import ms from "ms";
import { blacklisted } from "../../../utils/database/filter";
import { ignoreBlacklistWord } from "../../../../config";
import { warnSchema } from "../../../utils/database/warn";

const timeouts: Map<string, number> = new Map();

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("message");
	}

	async run(client: DiscordClient, message: Message) {
		if (message.author.bot) return;

		const prefix = process.env.DISCORD_BOT_PREFIX;
		const mentionPrefixes: string[] = [
			`<@${client.user.id}>`,
			`<@!${client.user.id}>`,
		];

		const filtered = this.filter(message.content);
		if (
			filtered &&
			message.guild &&
			!message.member.hasPermission("MANAGE_GUILD") &&
			!ignoreBlacklistWord.includes(message.channel.id)
		)
			return (
				this.warn(
					message.content,
					`Automatic warning for using a blacklisted word (${filtered})`,
					message.member,
					client
				) && message.delete()
			);

		if (message.content.startsWith(prefix)) {
			const [cmdName, ...cmdArgs] = message.content
				.slice(prefix.length)
				.trim()
				.split(/\s+/);

			return commandHandler(client, message, cmdName, cmdArgs);
		} else if (message.content.startsWith(mentionPrefixes[0])) {
			const [cmdName, ...cmdArgs] = message.content
				.slice(mentionPrefixes[0].length)
				.trim()
				.split(/\s+/);

			if (!cmdName) client.emit("ticketCreate", message, cmdArgs);
			return commandHandler(client, message, cmdName, cmdArgs);
		} else if (message.content.startsWith(mentionPrefixes[1])) {
			const [cmdName, ...cmdArgs] = message.content
				.slice(mentionPrefixes[1].length)
				.trim()
				.split(/\s+/);

			if (!cmdName) client.emit("ticketCreate", message, cmdArgs);
			return commandHandler(client, message, cmdName, cmdArgs);
		}
	}

	filter(str: string) {
		let blWord: string = null;

		str
			.split(/\s+/)
			.forEach((word) =>
				blacklisted.forEach((w) => (blWord = word.includes(w) ? w : blWord))
			);

		return blWord;
	}

	async warn(
		str: string,
		reason: string,
		user: GuildMember,
		client: DiscordClient
	) {
		const caseId = `#${
			(await warnSchema.find({ guildId: user.guild.id })).length + 1
		}`;
		await new warnSchema({
			id: user.id,
			guildId: user.guild.id,
			moderator: client.user.id,
			reason: reason,
			case: caseId,
			date: Date.now(),
		})
			.save()
			.catch((e) => console.log(e));

		user
			.send(
				`> 🧾 | **Automatic warn - Draavo's Hangout**
      \n> 📃 | Reason: **${reason}**\n\n> ❗ | **This is an automatic warning, the system may not be 100% correct. If I am wrong:** 
      \n Create a ticket with the topic: \`warn appeal - automatic warning\` and add \`${str}\` to the description.`,
				{ split: true }
			)
			.catch((e) => null);

		client.emit("warnEvent", user, client.user, caseId, reason);
	}
}

function commandHandler(
	client: DiscordClient,
	message: Message,
	cmdName: string,
	cmdArgs: string[]
): Promise<Message> {
	const ignoredChannels = [];
	const command = client.commands.get(cmdName);
	const channel: TextChannel | NewsChannel = message.channel as
		| TextChannel
		| NewsChannel;
	if (command) {
		const options = command.options;
		if (options.ownerOnly && !client.owners.includes(message.author.id))
			return message.channel.send(
				`> ❗ | Sorry this is a command intended for owners and developers of \`${client.user.tag}\` only!`
			);

		if (message.guild) {
			if (
				!message.guild.me.hasPermission("USE_EXTERNAL_EMOJIS") ||
				!channel.permissionsFor(client.user).has("USE_EXTERNAL_EMOJIS")
			)
				return message.channel.send(
					"> ‼ | I am missing the `Use External Emojis` Permission, without this permission I can not work in this server!"
				);

			if (ignoredChannels.includes(message.channel.id))
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("redtick")
						.toString()} | You can not trigger this command here, please try to do it in a different channel.`
				);

			if (
				options.clientPermissions &&
				(channel.permissionsFor(client.user).missing(options.clientPermissions)
					.length ||
					message.guild.me.permissions.missing(options.clientPermissions)
						.length)
			) {
				const missing = client.utils.missingPerms(
					message.guild.me,
					channel,
					options.clientPermissions
				);
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("redtick")
						.toString()} | Oops, It looks like I am missing a few permissions to continue: ${missing}`
				);
			}
			if (
				options.userPermissions &&
				(channel.permissionsFor(message.member).missing(options.userPermissions)
					.length ||
					message.member.permissions.missing(options.userPermissions).length)
			) {
				const missing = client.utils.missingPerms(
					message.member,
					channel,
					options.userPermissions
				);
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("redtick")
						.toString()} | Oops, It looks like you are missing a few permissions to continue: ${missing}`
				);
			}
		}

		if (options.usage) {
			const required = options.usage
				.split(/\|/g)
				.filter((str) => str.startsWith("<") && str.endsWith(">"));
			if (required.length && required.length > cmdArgs.length)
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("redtick")
						.toString()} | Sorry, you need 1 or more arguments to continue. Required args: \`${required.join(
						" "
					)}\``
				);
		}

		if (client.owners.includes(message.author.id))
			return command.run(client, message, cmdArgs);

		if (options.timeout) {
			const timeout = timeouts.get(message.author.id + `-` + command.name);
			if (timeout) {
				const l = Date.now() - timeout;
				const left = options.timeout - l;
				return message.channel.send(
					`> ⏲️ | Take a break, you are going to fast! Try again after \`${ms(
						left,
						{ long: true }
					)}\`.`
				);
			} else {
				timeouts.set(message.author.id + `-` + command.name, Date.now());
				setTimeout(
					() => timeouts.delete(message.author.id + `-` + command.name),
					options.timeout
				);
			}
		}

		return command.run(client, message, cmdArgs);
	}
}
