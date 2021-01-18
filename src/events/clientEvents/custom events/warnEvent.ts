import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import { modlog, muteRole } from "../../../../config";
import { GuildMember, MessageEmbed, TextChannel, User } from "discord.js";
import { warnSchema } from "../../../utils/database/warn";
import { muteSchema } from "../../../utils/database/mute";
import ms from "ms";

export default class warnEvent extends BaseEvent {
	constructor() {
		super("warnEvent");
	}

	async run(client: DiscordClient, member: GuildMember, mod: User, caseId: string, reason: string) {
		reason =
			reason === "No reason given"
				? `\`${client.prefix}reason ${caseId} <reason>\` to give this warning a reason`
				: reason;
		const channel = (client.channels.cache.get(modlog) ||
			client.channels.fetch(modlog)) as TextChannel;
		const embed = new MessageEmbed()
			.setTitle(`Warn | Case: ${caseId}`)
			.setColor("#FFF882")
			.setFooter(`Moderator: ${mod.tag}`, mod.displayAvatarURL({ dynamic: true, size: 4096 }))
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
			const schema = await new muteSchema({
				guildId: member.guild.id,
				moderator: client.user.id,
				id: member.id,
				endDate: Date.now() + 6e5,
				duration: 6e5,
			}).save();

			member.roles.add(muteRole);
			setTimeout(() => {
				member.roles.remove(muteRole);
				schema.delete();
				client.emit(
					"muteEvent",
					"unmute",
					member,
					client.user,
					`automatic unmute from mute made ${ms(6e5)} ago by ${client.user.tag}`
				);
			}, 6e5);

			client.emit("muteEvent", "mute", member, client.user, r, 6e5);
		}
	}
}
