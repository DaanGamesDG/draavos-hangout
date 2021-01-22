import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import { tempbanSchema } from "../../utils/database/tempban";
import { modlog, systemLogPublic } from "../../../config";
import { Guild, MessageEmbed, TextChannel, User } from "discord.js";
import ms from "ms";

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("guildBanAdd");
	}

	async run(client: DiscordClient, guild: Guild, user: User) {
		const ban = (
			await guild.fetchAuditLogs({
				type: "MEMBER_BAN_ADD",
				limit: 50,
			})
		).entries.find((v) => v.target === user && v.target.id === user.id);

		let type: "Tempban" | "Ban";
		let { reason, executor } = ban;

		if (executor.id === client.user.id) {
			reason.split(/\|/g)[1].toLowerCase() === "tempban" ? (type = "Tempban") : (type = "Ban");
			const moderator =
				client.users.cache.get(reason.split(/\|/g)[0]) ||
				(await client.users.fetch(reason.split(/\|/g)[0]));
			reason =
				type === "Tempban"
					? reason.split(/\|/g).slice(2).join(" ")
					: reason.split(/\|/g).slice(1).join(" ");

			const data = await tempbanSchema.findOne({ id: user.id });
			let duration: number = 0;
			if (data) duration = data.get("duration") as number;

			const channel =
				(guild.channels.cache.get(modlog) as TextChannel) ||
				((await client.channels.fetch(modlog)) as TextChannel);
			if (!channel) return;

			const embed = new MessageEmbed()
				.setAuthor(
					`${type} | Moderator: ${moderator.tag}`,
					moderator.displayAvatarURL({ dynamic: true, size: 4096 })
				)
				.setColor(type === "Tempban" ? "#FD6CE1" : "#DC5E55")
				.setDescription([
					`> 👤 | Offender: ${user.tag} - ${user.toString()}`,
					`> 📃 | Reason: **${reason.substr(0, 800)}**`,
					type === "Tempban" ? `> ⌚ | Duration: ${ms(duration, { long: true })}` : "",
				]);

			channel.send(embed);
		} else {
			const channel =
				(guild.channels.cache.get(modlog) as TextChannel) ||
				((await client.channels.fetch(modlog)) as TextChannel);
			if (!channel) return;

			const embed = new MessageEmbed()
				.setAuthor(
					`Ban | Moderator: ${executor.tag}`,
					executor.displayAvatarURL({ dynamic: true, size: 4096 })
				)
				.setColor("#DC5E55")
				.setDescription([
					`> 👤 | Offender: ${user.tag} - ${user.toString()}`,
					`> 📃 | Reason: **${reason.substr(0, 800)}**`,
				]);

			channel.send(embed);
		}

		const channel = (client.channels.cache.get(systemLogPublic) ||
			(await client.channels.fetch(systemLogPublic))) as TextChannel;
		channel.send(
			new MessageEmbed()
				.setAuthor("The ban hammer has come down!")
				.setTitle(`${user.tag} has been banned!`)
				.setDescription(`That is one big oof there, don't you think? 🔨`)
				.setFooter(`There are now ${guild.memberCount} members in this server.`)
				.setColor("BLACK")
		);
	}
}
