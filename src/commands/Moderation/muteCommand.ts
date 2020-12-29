import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/BaseCommand";
import { muteSchema } from "../../utils/database/mute";
import { GuildMember, Message } from "discord.js";
import { muteRole } from "../../../config";
import ms from "ms";

export default class muteCommand extends BaseCommand {
	constructor() {
		super("mute", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description: "Mute someone for ... seconds/minutes/hours etc.",
			usage:
				"<user id/mention/tag/username>|<duration ex: 1w/30m/60s>|[reason]",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_ROLES"],
			timeout: 1e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const redtick = client.utils.EmojiFinder("redtick").toString();
		const member: GuildMember = client.utils.filterMember(message, args[0]);
		const duration = ms(args[1]);
		const reason = args.slice(2).join(" ") || "No reason given";

		if (!member)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);
		if (member.id === message.author.id)
			return message.channel.send("> ❓ | Why do you want to mute yourself?!");
		if (member.id === client.user.id)
			return message.channel.send(
				"> 😢 | After all the hard work, you still want to mute me?"
			);
		if (member.id === message.guild.ownerID)
			return message.channel.send(
				"> 👑 | Why do you want to mute the owner? You can't do that!"
			);

		let DMed: boolean = false;

		if (member) {
			if (
				member.roles.highest.position >=
					message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.channel.send(
					`> ${redtick} | You cannot mute this user due to role hierarchy.`
				);
			if (!member.manageable)
				return message.channel.send(
					`> ${redtick} | I cannot mute this user due to role hierarchy.`
				);

			DMed = true;
			await member
				.send(
					`> 🔇 | **Muted - Draavo's Hangout**\n> ⌚ | Duration: \`${ms(
						duration
					)}\`\n> 📃 | Reason: **${reason}**\n\n> 🙏 | **Want to appeal?** \n Create a ticket with the topic: \`mute appeal\`.`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		const schema = await new muteSchema({
			guildId: message.guild.id,
			moderator: message.author.id,
			id: member.id,
			endDate: Date.now() + duration,
			duration,
		})
			.save()
			.catch((e) => {
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("warning")
						.toString()} | Oops, mongodb threw an exception: \`${e}\`.`
				);
			});

		await member.roles
			.add(muteRole, `${message.author.id}|${reason}`)
			.catch((e) => {
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("warning")
						.toString()} | Oops, Discord threw an exception: \`${e}\`.`
				);
			});

		client.emit("muteEvent", "mute", member, message.author, reason, duration);

		setTimeout(async () => {
			if (member)
				member.roles
					.remove(
						muteRole,
						`${message.author.id}|automatic unmute from mute made ${ms(
							duration
						)} ago by ${message.author.tag}`
					)
					.catch((e) => {
						return message.channel.send(
							`> ${client.utils
								.EmojiFinder("warning")
								.toString()} | Oops, Discord threw an exception: \`${e}\`.`
						);
					});

			const mute = await muteSchema.findOne({
				guildId: message.guild.id,
				id: member.id,
			});
			if (mute) {
				mute.delete();
				client.emit(
					"muteEvent",
					"unmute",
					member,
					message.author,
					`automatic unmute from mute made ${ms(duration)} ago by ${
						message.author.tag
					}`
				);
			}
		}, duration);

		return message.channel.send(
			`> 🔇 | Successfully muted **${
				member.user.tag
			}** for **${reason}**, duration of mute: \`${ms(duration)}\`. ${
				DMed ? "" : "\n > ℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
