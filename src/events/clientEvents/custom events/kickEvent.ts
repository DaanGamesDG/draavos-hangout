import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import { modlog } from "../../../../config";
import { GuildMember, MessageEmbed, TextChannel, User } from "discord.js";

export default class warnEvent extends BaseEvent {
	constructor() {
		super("kickEvent");
	}

	async run(
		client: DiscordClient,
		member: GuildMember,
		mod: User,
		reason: string
	) {
		const channel = (member.guild.channels.cache.get(modlog) ||
			client.channels.fetch(modlog)) as TextChannel;
		const embed = new MessageEmbed()
			.setColor("#4C8CFB")
			.setAuthor(
				`Kick | Moderator: ${mod.tag}`,
				mod.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setDescription([
				`> 👤 | Offender: ${member.user.tag} - ${member.user.toString()}`,
				`> 📃 | Reason: **${reason.substr(0, 800)}**`,
			]);

		return channel.send(embed);
	}
}
