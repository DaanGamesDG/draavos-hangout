import { Message, MessageEmbed, User } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import moment from "moment";
import fetch from "node-fetch";
import { KSoftClient } from "@ksoft/api";
import { DRepClient } from "@aero/drep";

const ksoft = new KSoftClient(process.env.KSOFT_TOKEN);
const drep = new DRepClient(process.env.DREP_TOKEN);

const robloxApi = "https://api.roblox.com/";
const baseURL = "https://api.blox.link/v1/user/";

export default class PingCommand extends BaseCommand {
	constructor() {
		super("info", {
			category: "General",
			aliases: ["userinfo"],
			description: "Searches on discord for information about the user.",
			usage: "[user id/username/tag/mention]",
			ownerOnly: false,
			channelType: "both",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const embed = new MessageEmbed();
		const user: User = message.guild
			? client.utils.filterMember(message, args[0] || message.author.id)
				? client.utils.filterMember(message, args[0] || message.author.id).user
				: await client.users
						.fetch(args[0] || message.author.id)
						.catch((e) => null)
			: await client.users
					.fetch(args[0] || message.author.id)
					.catch((e) => null);

		if (!user)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);

		message.channel.startTyping();

		const data = await (await fetch(baseURL + user.id)).json();
		const robloxAccount = data.primaryAccount
			? await (await fetch(robloxApi + "users/" + data.primaryAccount)).json()
			: null;
		const rep: Reputation = await drep.rep(user.id);
		const banned = await ksoft.bans.check(user.id);

		embed
			.setColor("#48B782")
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
			.addField("• Global User Statistics", [
				`> 🤔 | **Reputation**: ${
					rep.upvotes - rep.downvotes < 0 ? "bad" : "good"
				}`,
				`> 🔨 | **Globally banned**: ${
					banned ? "🔨" : client.utils.EmojiFinder("redtick").toString()
				}`,
				`> ⚖ | **Conclusion**: ${
					rep.upvotes - rep.downvotes < 0 || banned
						? "untrustable"
						: "trustable"
				}`,
			])
			.addField("• General Information", [
				`> 👤 | **User**: ${user.toString()}`,
				`> ${client.utils.EmojiFinder("idcard").toString()} | **User ID**: \`${
					user.id
				}\``,
				`> 📆 | **Created at**: \`${moment(user.createdTimestamp).format(
					"MMMM Do YYYY hh:mm:ss"
				)} | ${moment(user.createdTimestamp).fromNow()}\``,
				`> 🎮 | **Roblox Account**: \`${
					robloxAccount ? robloxAccount.Username : "none"
				}\``,
			])
			.setFooter(
				"The global stats may not be 100% correct - apis: discordrep & KSoft Ban"
			);

		const member = message.guild
			? client.utils.filterMember(message, user.id)
			: null;
		if (member) {
			const r = member.roles.cache
				.sort((a, b) => b.position - a.position)
				.map((role) => role.toString())
				.slice(0, -1);

			const roles =
				r.length < 10
					? r.map((role) => role.toString()).join(" ")
					: r.length > 10
					? client.utils.trimArray(r)
					: "none";

			embed.setColor(member.displayHexColor || "#48B782");
			embed.addField("• Member Information", [
				`> 📆 | **Joined at**: \`${moment(member.joinedTimestamp).format(
					"MMMM Do YYYY hh:mm:ss"
				)} | ${moment(member.joinedTimestamp).fromNow()}\``,
				`> 📂 | **Roles**: ${roles}`,
			]);
		}

		message.channel.send(embed);
		message.channel.stopTyping(true);
	}
}

interface Reputation {
	upvotes: number;
	downvotes: number;
	reputation: number;
	rank: string;
	xp: number;
	staff: boolean;
}
