import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message, User } from "discord.js";
import { tempbanSchema } from "../../utils/database/tempban";

export default class banCommand extends BaseCommand {
  constructor() {
    super("unban", {
      category: "Moderation", 
      aliases: [],
      ownerOnly: false,
      channelType: "guild",
      description: "unban someone in the server or outside the server permanently.",
      usage: "<user id/mention/tag/username>|[reason]",
      userPermissions: ["BAN_MEMBERS"],
      clientPermissions: ["BAN_MEMBERS"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const user: User = await client.users.fetch(args[0]).catch(e => null);
    const reason = args.slice(1).join(" ") || "No reason given";
    let banned: boolean = true;

    if (!user) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);

    await message.guild.fetchBan(user).catch(e => banned = false);
    if (!banned) return message.channel.send(`> ${redtick} | This user isn't banned in this server.`);

    const ban = await tempbanSchema.findOne({ id: user.id, guildId: message.guild.id });
    if (ban) ban.delete();

    await message.guild.members.unban(user, `${message.author.id}|${reason}`)
      .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, Discord threw an exception: \`${e}\`.`) });

    return message.channel.send(`> 🔨 | Successfully unbanned **${user.tag}**, reason: **${reason}**.`, { split: true });
  }
}