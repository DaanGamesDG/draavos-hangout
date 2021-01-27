import { GuildMember, Message, NewsChannel, TextChannel } from "discord.js";
import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import ms from "ms";
import { blacklisted } from "../../../utils/database/filter";
import { ignoreBlacklistWord } from "../../../../config";
import { warnSchema } from "../../../utils/database/warn";
import * as nsfwjs from "nsfwjs";

const timeouts: Map<string, number> = new Map();
const spamfilter: Map<string, filterObj> = new Map();
interface filterObj {
	msgCount: number;
	lastMessage: Message;
	timer: NodeJS.Timeout;
}

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("message");
	}

	async run(client: DiscordClient, message: Message) {
		if (message.author.bot) return;
		if (message.channel.type == "dm" || message.channel.name.endsWith("-ticket"))
			return client.emit("ticketChat", message);

		const prefix = process.env.DISCORD_BOT_PREFIX;
		const mentionPrefixes: string[] = [`<@${client.user.id}>`, `<@!${client.user.id}>`];

		const filtered = this.filter(message.content.toLowerCase());
		const capAbuse = this.caps(message.content);

		if (
			message.guild &&
			!message.member.hasPermission("MANAGE_GUILD", {
				checkAdmin: true,
				checkOwner: true,
			})
		) {
			if (capAbuse && message.content.length > 10)
				return message.channel.send(`> ❗ | Hey, ${message.author.toString()}, too many caps!`);
			if (filtered && !ignoreBlacklistWord.includes(message.channel.id)) {
				message.channel.send(
					`>>> | ${message.author.toString()}, swearing is only allowed in <#723665469894164580>!`
				);
				return (
					this.warn(
						message.content,
						`Automatic warning for using a blacklisted word (${filtered})`,
						message.member,
						client
					) && message.delete()
				);
			}
			if (message.mentions.members.filter((m) => m.id !== message.author.id).size > 5)
				return (
					this.warn(
						message.content,
						`Automatic action carried out for spamming mentions (${
							message.mentions.members.filter((m) => m.id !== message.author.id).size
						} mentions)`,
						message.member,
						client
					) &&
					message.delete() &&
					message.channel.send(
						`> 🔔 | ${message.author.toString()}, you aren't allowed to mass mention people. The limit is 5 per message!`
					)
				);

			if (!["794256807337263114", "710090914776743966"].includes(message.channel.id))
				this.spamFilter(client, message);
		}

		await this.nsfwFilter(message);
		if (message.channel.id === /* "720986432176652369" */ "792005203867729921")
			return this.advertise(client, message);

		if (message.content.startsWith(prefix)) {
			const [cmdName, ...cmdArgs] = message.content.slice(prefix.length).trim().split(/\s+/);

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

	filter(str: string) {
		let blWord: string = null;

		str
			.split(/\s+/)
			.forEach((word) => blacklisted.forEach((w) => (blWord = word.includes(w) ? w : blWord)));

		return blWord;
	}

	async nsfwFilter(message: Message) {
		if (message.attachments.size === 0) return;

		const img = message.attachments.first().attachment;

		const model = await nsfwjs.load();

		const predictions = await model.classify(img);
		console.log("Predictions: ", predictions);
	}

	async warn(str: string, reason: string, user: GuildMember, client: DiscordClient) {
		const caseId = `#${(await warnSchema.find({ guildId: user.guild.id })).length + 1}`;
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
      > 📃 | Reason: **${reason}**\n\n> ❗ | **This is an automatic warning, the system may not be 100% correct. If I am wrong:** 
      Create a ticket with the topic: \`warn appeal - automatic warning\` and add \`${str}\` to the description.`,
				{ split: true }
			)
			.catch((e) => null);

		client.emit("warnEvent", user, client.user, caseId, reason);
	}

	async spamFilter(client: DiscordClient, message: Message) {
		if (spamfilter.has(message.author.id)) {
			const { lastMessage, timer, msgCount } = spamfilter.get(message.author.id);
			const difference = message.createdTimestamp - lastMessage.createdTimestamp;
			let messageCount: number = msgCount;

			if (difference > 2500) {
				clearTimeout(timer);
				spamfilter.set(message.author.id, {
					msgCount: 1,
					lastMessage: message,
					timer: setTimeout(() => spamfilter.delete(message.author.id), 5e3),
				});
			} else {
				++messageCount;
				if (messageCount === 7) {
					const reason = "Automatic action carried out for hitting the message rate limit (7/5s)";
					const caseId = `#${(await warnSchema.find({ guildId: message.guild.id })).length + 1}`;
					await new warnSchema({
						id: message.author.id,
						guildId: message.guild.id,
						moderator: client.user.id,
						reason: reason,
						case: caseId,
						date: Date.now(),
					})
						.save()
						.catch((e) => console.log(e));

					message.author
						.send(`> 🧾 | **Automatic warn - Draavo's Hangout**\n> 📃 | Reason: **${reason}**`, {
							split: true,
						})
						.catch((e) => null);

					client.emit("warnEvent", message.member, client.user, caseId, reason);

					message.channel.send(
						`>>> ❗ | ${message.author.toString()}, don't spam. You can only spam in <#710090914776743966>!`
					);
				} else {
					spamfilter.set(message.author.id, {
						lastMessage: message,
						msgCount: messageCount,
						timer,
					});
				}
			}
		} else {
			let fn = setTimeout(() => spamfilter.delete(message.author.id), 5e3);
			spamfilter.set(message.author.id, {
				msgCount: 1,
				lastMessage: message,
				timer: fn,
			});
		}
		// const count = spamfilter.get(message.author.id) || 0;

		// if (count == 0) setTimeout(() => spamfilter.delete(message.author.id), 5e3);
		// spamfilter.set(message.author.id, count + 1);

		// if (spamfilter.get(message.author.id) > 7) {
		// 	spamfilter.delete(message.author.id);

		// 	const reason = "Automatic action carried out for hitting the message rate limit (7/5s)";
		// 	const caseId = `#${(await warnSchema.find({ guildId: message.guild.id })).length + 1}`;
		// 	await new warnSchema({
		// 		id: message.author.id,
		// 		guildId: message.guild.id,
		// 		moderator: client.user.id,
		// 		reason: reason,
		// 		case: caseId,
		// 		date: Date.now(),
		// 	})
		// 		.save()
		// 		.catch((e) => console.log(e));

		// 	message.author
		// 		.send(`> 🧾 | **Automatic warn - Draavo's Hangout**\n> 📃 | Reason: **${reason}**`, {
		// 			split: true,
		// 		})
		// 		.catch((e) => null);

		// 	client.emit("warnEvent", message.member, client.user, caseId, reason);

		// 	message.channel.send(
		// 		`>>> ❗ | ${message.author.toString()}, don't spam. You can only spam in <#710090914776743966>!`
		// 	);
		// }
	}

	caps(content: string): boolean {
		let uppercase: number = 0;
		const char = content
			.trim()
			.split("")
			.filter((str) => /^[a-zA-Z]/.test(str));

		if (char.length <= 0) return false;
		if (content === content.toUpperCase()) return true;

		char.forEach((str) => (uppercase += str === str.toUpperCase() ? 1 : 0));

		if ((char.length / 100) * 75 <= uppercase) return true;
		return false;
	}

	advertise(client: DiscordClient, message: Message) {
		const content = message.content.trim().split(/\s+/);
		const links = content.filter((str) => str.match(/https?:\/\/(www.)?/g));
		const discord = content.filter((str) =>
			str.match(/((?:https?:)?\/\/)?((?:www|m)\.)?((?:discord\.gg|discordapp\.com\/invite))/g)
		);

		if (links.length + discord.length <= 1) return;

		message.channel.send(
			`>>> ${client.utils
				.EmojiFinder("checkpins")
				.toString()} | Hey, you can only add one link per message! Please check the pins for more info ${message.author.toString()}!`
		);
		message.delete();
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
	const channel: TextChannel | NewsChannel = message.channel as TextChannel | NewsChannel;
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
				(channel.permissionsFor(client.user).missing(options.clientPermissions).length ||
					message.guild.me.permissions.missing(options.clientPermissions).length)
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
				(channel.permissionsFor(message.member).missing(options.userPermissions).length ||
					message.member.permissions.missing(options.userPermissions).length)
			) {
				const missing = client.utils.missingPerms(message.member, channel, options.userPermissions);
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

		if (client.owners.includes(message.author.id)) return command.run(client, message, cmdArgs);

		if (options.timeout) {
			const timeout = timeouts.get(message.author.id + `-` + command.name);
			if (timeout) {
				const l = Date.now() - timeout;
				const left = options.timeout - l;
				return message.channel.send(
					`> ⏲️ | Take a break, you are going to fast! Try again after \`${ms(left, {
						long: true,
					})}\`.`
				);
			} else {
				timeouts.set(message.author.id + `-` + command.name, Date.now());
				setTimeout(() => timeouts.delete(message.author.id + `-` + command.name), options.timeout);
			}
		}

		return command.run(client, message, cmdArgs);
	}
}
