import { Message, NewsChannel, TextChannel } from "discord.js";
import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import { ticketsSchema } from "../../utils/database/ticket";
import ms from "ms";

const timeouts: Map<string, number> = new Map();

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("ticketChat");
	}

	async run(client: DiscordClient, message: Message) {
		// @ts-ignore
		message.channel = await message.channel.fetch();

		switch (message.channel.type) {
			case "dm":
				const data1 = await ticketsSchema.findOne({ id: message.author.id });
				if (!data1) return this.handleCommands(client, message);

				const channel1 =
					(client.channels.cache.get(data1.get("channel")) as TextChannel) ||
					((await client.channels.fetch(data1.get("channel"))) as TextChannel);

				channel1.send(
					`> 💬 | Reply from **${message.author.tag}**:\n\`\`\`${(
						message.content || "No message content"
					).replace(/`/g, "")}\`\`\``,
					{ files: client.utils.getAttachments(message.attachments) }
				);
				message.react("✅");
				break;
			case "text":
				const data2 = await ticketsSchema.findOne({
					channel: message.channel.id,
				});

				if (message.content.startsWith(client.prefix))
					return this.handleCommands(client, message);

				if (!data2 || data2.get("claimer") !== message.author.id) return;
				const channel2 = await (
					client.users.cache.get(data2.get("id")) ||
					(await client.users.fetch(data2.get("id")))
				).createDM();

				channel2.send(
					`> 💬 | Reply from **${message.author.tag}**:\n\`\`\`${(
						message.content || "No message content"
					).replace(/`/g, "")}\`\`\``,
					{ files: client.utils.getAttachments(message.attachments) }
				);
				message.react("✅");
				break;
		}
	}

	handleCommands(client: DiscordClient, message: Message) {
		const prefix = process.env.DISCORD_BOT_PREFIX;
		const mentionPrefixes: string[] = [
			`<@${client.user.id}>`,
			`<@!${client.user.id}>`,
		];

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

			if (!cmdName) return client.emit("ticketCreate", message);
			return commandHandler(client, message, cmdName, cmdArgs);
		} else if (message.content.startsWith(mentionPrefixes[1])) {
			const [cmdName, ...cmdArgs] = message.content
				.slice(mentionPrefixes[1].length)
				.trim()
				.split(/\s+/);

			if (!cmdName) return client.emit("ticketCreate", message);
			return commandHandler(client, message, cmdName, cmdArgs);
		}
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
		if (message.channel.type === "dm" && options.channelType == "guild") return;

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
