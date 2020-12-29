import BaseEvent from "../../../utils/structures/BaseEvent";
import DiscordClient from "../../../client/client";
import { modlog } from "../../../../config";
import { Guild, MessageEmbed, TextChannel, User } from "discord.js";
import { tempbanSchema } from "../../../utils/database/tempban";
export default class MessageEvent extends BaseEvent {
	constructor() {
		super("guildBanRemove");
	}

	async run(client: DiscordClient, guild: Guild, user: User) {
		const unban = (
			await guild.fetchAuditLogs({
				type: "MEMBER_BAN_REMOVE",
				limit: 50,
			})
		).entries.find((v) => v.target === user && v.target.id === user.id);

		let { reason, executor } = unban;

		let moderator: User;

		if (executor.id === client.user.id) {
			moderator =
				client.users.cache.get(reason.split(/\|/g)[0]) ||
				(await client.users.fetch(reason.split(/\|/g)[0]));
			reason = reason.split(/\|/g)[1];
		} else moderator = executor;

		const channel =
			(guild.channels.cache.get(modlog) as TextChannel) ||
			((await client.channels.fetch(modlog)) as TextChannel);
		if (!channel) return;

		const embed = new MessageEmbed()
			.setAuthor(
				`Unban | Moderator: ${moderator.tag}`,
				moderator.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setColor("#4AF3AB")
			.setDescription([
				`> 👤 | Offender: ${user.tag} - ${user.toString()}`,
				`> 📃 | Reason: **${reason.substr(0, 800)}**`,
			]);

		channel.send(embed);

		const ban = await tempbanSchema.findOne({ id: user.id });
		if (ban) ban.delete();
	}
}
