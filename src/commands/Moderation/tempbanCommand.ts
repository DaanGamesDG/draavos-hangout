import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { GuildMember, Message, User } from "discord.js";
import { tempbanSchema } from "../../utils/database/tempban";
import ms from "ms";

export default class tempbanCommand extends BaseCommand {
	constructor() {
		super("tempban", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description: "tempban someone in the server or outside the server.",
			usage: "<user id/mention/tag/username>|<duration ex. 1m/2d/4w>|[reason]",
			userPermissions: ["BAN_MEMBERS"],
			clientPermissions: ["BAN_MEMBERS"],
			timeout: 1e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const redtick = client.utils.EmojiFinder("redtick").toString();
		const user: User = client.utils.filterMember(message, args[0])
			? client.utils.filterMember(message, args[0]).user
			: await client.users.fetch(args[0]).catch((e) => null);
		const duration = ms(args[1]);
		const reason = args.slice(2).join(" ") || "No reason given";

		if (isNaN(duration))
			return message.channel.send(
				`> ${redtick} | "${args[1]}" is not a valid duration.`
			);
		if (!user)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);
		if (user.id === message.author.id)
			return message.channel.send(
				"> ❓ | Why do you want to tempban yourself?!"
			);
		if (user.id === client.user.id)
			return message.channel.send(
				"> 😢 | After all the hard work, you still want to tempban me?"
			);
		if (user.id === message.guild.ownerID)
			return message.channel.send(
				"> 👑 | Why do you want to tempban the owner? You can't do that!"
			);

		const member: GuildMember =
			message.guild.members.cache.get(user.id) ||
			(await message.guild.members.fetch(user.id).catch((e) => undefined));
		let DMed: boolean = false;

		if (member) {
			if (
				member.roles.highest.position >=
					message.member.roles.highest.position &&
				message.guild.ownerID !== message.author.id
			)
				return message.channel.send(
					`> ${redtick} | You cannot tempban this user due to role hierarchy.`
				);
			if (!member.bannable)
				return message.channel.send(
					`> ${redtick} | I cannot tempban this user due to role hierarchy.`
				);

			DMed = true;
			await member
				.send(
					`> 🔨 | **Temporarily Banned - Draavo's Hangout**\n> ⌚ | Duration: \`${ms(
						duration
					)}\`\n> 📃 | Reason: **${reason}**\n\n> 🙏 | **Want to appeal?** \n Click on this link to appeal: https://forms.gle/RMT5X7gcYh6iuPqM6`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		const schema = await new tempbanSchema({
			guildId: message.guild.id,
			moderator: message.author.id,
			id: user.id,
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
		await message.guild.members
			.ban(user, { reason: `${message.author.id}|tempban|${reason}` })
			.catch((e) => {
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("warning")
						.toString()} | Oops, Discord threw an exception: \`${e}\`.`
				);
			});

		setTimeout(() => {
			message.guild.members.unban(
				user,
				`${message.author.id}|automatic unban from tempban made ${ms(
					duration
				)} ago by ${message.author.tag}`
			);
			schema.delete();
		}, duration);

		return message.channel.send(
			`> 🔨 | Successfully temp banned **${
				user.tag
			}** for **${reason}**, duration of ban: \`${ms(duration)}\`. ${
				DMed ? "" : "\n > ℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
