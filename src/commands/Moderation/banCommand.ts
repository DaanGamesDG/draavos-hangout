import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { GuildMember, Message, User } from "discord.js";

export default class banCommand extends BaseCommand {
	constructor() {
		super("ban", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description:
				"Ban someone in the server or outside the server permanently.",
			usage: "<user id/mention/tag/username>|[reason]",
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
		const reason = args.slice(1).join(" ") || "No reason given";

		if (!user)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);
		if (user.id === message.author.id)
			return message.channel.send("> ❓ | Why do you want to ban yourself?!");
		if (user.id === client.user.id)
			return message.channel.send(
				"> 😢 | After all the hard work, you still want to ban me?"
			);
		if (user.id === message.guild.ownerID)
			return message.channel.send(
				"> 👑 | Why do you want to ban the owner? You can't do that!"
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
					`> ${redtick} | You cannot ban this user due to role hierarchy.`
				);
			if (!member.bannable)
				return message.channel.send(
					`> ${redtick} | I cannot ban this user due to role hierarchy.`
				);

			DMed = true;
			await member
				.send(
					`> 🔨 | **Permanent Banned - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 🙏 | **Want to appeal?** \n Click on this link to appeal: https://forms.gle/RMT5X7gcYh6iuPqM6`,
					{ split: true }
				)
				.catch((e) => (DMed = false));
		}

		await message.guild.members
			.ban(user, { reason: `${message.author.id}|${reason}` })
			.catch((e) => {
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("warning")
						.toString()} | Oops, Discord threw an exception: \`${e}\`.`
				);
			});

		return message.channel.send(
			`> 🔨 | Successfully banned **${user.tag}** for **${reason}**. ${
				DMed ? "" : "\n > ℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
