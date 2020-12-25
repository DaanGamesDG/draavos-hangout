import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message, GuildMember } from "discord.js";
import { muteSchema } from "../../utils/database/mute";
import { muteRole } from "../../../config";

export default class banCommand extends BaseCommand {
  constructor() {
    super("unmute", {
      category: "Moderation", 
      aliases: [],
      ownerOnly: false,
      channelType: "guild",
      description: "unmute someone in the server.",
      usage: "<user id/mention/tag/username>|[reason]",
      userPermissions: ["MANAGE_MESSAGES"],
      clientPermissions: ["MANAGE_ROLES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const member: GuildMember = client.utils.filterMember(message, args[0]);
    const reason = args.slice(1).join(" ") || "No reason given";

    if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);
    if (!member.roles.cache.has(muteRole)) return message.channel.send(`> ${redtick} | This user isn't muted in this server.`);

    const mute = await muteSchema.findOne({ id: member.id, guildId: message.guild.id });
    if (mute) mute.delete();

    await member.roles.remove(muteRole)
      .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, Discord threw an exception: \`${e}\`.`) });

    client.emit("muteEvent", "unmute", member, message.author, reason);
    return message.channel.send(`> 🔊 | Successfully unmuted **${member.user.tag}**, reason: **${reason}**.`, { split: true });
  }
}