import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import { systemLog, systemLogPublic } from "../../../../config";
import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import moment from "moment";

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("guildMemberRemove");
	}

	async run(client: DiscordClient, member: GuildMember) {
		const channel = (member.guild.channels.cache.get(systemLog) ||
			client.channels.fetch(systemLog)) as TextChannel;
		const joinDate = moment(member.joinedTimestamp).fromNow();

		if (!member.user.bot) this.bye(client, member);

		const embed = new MessageEmbed()
			.setColor("#FFF4B4")
			.setTitle("Member left")
			.setDescription([
				`> 👤 | **User**: ${member.toString()}`,
				`> 📅 | **Joined at**: ${joinDate}`,
				`> 🏷 | **roles**: ${client.utils
					.trimArray(member.roles.cache.map((r) => r.toString()))
					.join(", ")}`,
			]);

		channel.send(embed);
	}

	async bye(client: DiscordClient, member: GuildMember) {
		const channel = (client.channels.cache.get(systemLogPublic) ||
			(await client.channels.fetch(systemLogPublic))) as TextChannel;
		const embed = new MessageEmbed()
			.setColor("#DC5E55")
			.setAuthor("Goodbye!")
			.setTitle(`${member.user.tag} left the server!`)
			.setDescription(`Bye bye 😢`)
			.setFooter(
				`There are now ${member.guild.memberCount} members in this server.`
			);

		channel.send(embed);
	}
}
