import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';
import { modlog } from "../../../config";
import { GuildMember, MessageEmbed, TextChannel, User } from 'discord.js';
import ms from "ms";

export default class muteEvent extends BaseEvent {
  constructor() {
    super("muteEvent");
  }

  async run(client: DiscordClient, type: "unmute" | "mute", member: GuildMember, moderator: User, reason: string, duration?: number) {
    const channel = (member.guild.channels.cache.get(modlog) || client.channels.fetch(modlog)) as TextChannel;
    const embed = new MessageEmbed();

    switch (type) {
      case "mute":
        embed
        .setColor("#F3884A")
        .setAuthor(`Mute | Moderator: ${moderator.tag}`, moderator.displayAvatarURL({ dynamic: true, size: 4096 }))
        .setDescription([
          `> 👤 | Offender: ${member.user.tag} - ${member.user.toString()}`,
          `> 📃 | Reason: **${reason.substr(0, 800)}**`,
          `> ⌚ | Duration: ${ms(duration, { long: true })}`,
        ]);
        break;
    
      case "unmute":
        embed
        .setColor("#4AF3AB")
        .setAuthor(`unmute | Moderator: ${moderator.tag}`, moderator.displayAvatarURL({ dynamic: true, size: 4096 }))
        .setDescription([
          `> 👤 | Offender: ${member.user.tag} - ${member.user.toString()}`,
          `> 📃 | Reason: **${reason.substr(0, 800)}**`,
        ]);
        break;
    }

    channel.send(embed);
  }
}