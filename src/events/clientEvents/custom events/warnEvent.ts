import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import { modlog } from "../../../../config";
import { GuildMember, MessageEmbed, TextChannel, User } from "discord.js";
import { warnSchema } from "../../../utils/database/warn";

export default class warnEvent extends BaseEvent {
	constructor() {
		super("warnEvent");
	}

	async run(
		client: DiscordClient,
		member: GuildMember,
		mod: User,
		caseId: string,
		reason: string
	) {
		reason =
			reason === "No reason given"
				? `\`${client.prefix}reason ${caseId} <reason>\` to give this warning a reason`
				: reason;
		const channel = (client.channels.cache.get(modlog) ||
			client.channels.fetch(modlog)) as TextChannel;
		const embed = new MessageEmbed()
			.setTitle(`Warn | Case: ${caseId}`)
			.setColor("#FFF882")
			.setFooter(
				`Moderator: ${mod.tag}`,
				mod.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setDescription([
				`> 👤 | Offender: ${member.user.tag} - ${member.user.toString()}`,
				`> 📃 | Reason: **${reason.substr(0, 800)}**`,
			]);

		channel.send(embed);

		const warningCount = await warnSchema.find({
			id: member.id,
			guildId: member.guild.id,
		});
		if (warningCount.length % 2 === 0) {
			const r = `Automatic mute after ${warningCount.length} warnings`;

			client.emit("muteEvent", "mute", member, client.user, r, 6e5);
		}
	}
}
