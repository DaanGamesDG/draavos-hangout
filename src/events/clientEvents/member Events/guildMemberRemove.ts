import BaseEvent from '../../../utils/structures/BaseEvent';
import DiscordClient from '../../../client/client';
import { systemLog } from "../../../../config";
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import moment from 'moment';


export default class MessageEvent extends BaseEvent {
  constructor() {
    super("guildMemberRemove");
  }

  async run(client: DiscordClient, member: GuildMember) {
    const channel = (member.guild.channels.cache.get(systemLog) || client.channels.fetch(systemLog)) as TextChannel;
    const joinDate = moment(member.joinedTimestamp).fromNow();
    
    const embed = new MessageEmbed()
    .setColor("#FFF4B4")
    .setTitle("Member left")
    .setDescription([
      `> 👤 | **User**: ${member.toString()}`,
      `> 📅 | **Joined at**: ${joinDate}`,
      `> 🏷 | **roles**: ${client.utils.trimArray(member.roles.cache.map(r => r.toString())).join(", ")}`
    ]);

    channel.send(embed);
  }
}