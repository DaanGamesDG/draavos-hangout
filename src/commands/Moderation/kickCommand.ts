import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message, GuildMember } from "discord.js";

export default class banCommand extends BaseCommand {
  constructor() {
    super("kick", {
      category: "Moderation", 
      aliases: [],
      ownerOnly: false,
      channelType: "guild",
      description: "kick someone in the server.",
      usage: "<user id/mention/tag/username>|[reason]",
      userPermissions: ["KICK_MEMBERS"],
      clientPermissions: ["KICK_MEMBERS"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const member: GuildMember = client.utils.filterMember(message, args[0]);
    const reason = args.slice(1).join(" ") || "No reason given";

    if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);
    if (member.id === message.author.id) return message.channel.send("> ❓ | Why do you want to kick yourself?!");
    if (member.id === client.user.id) return message.channel.send("> 😢 | After all the hard work, you still want to kick me?");
    if (member.id === message.guild.ownerID) return message.channel.send("> 👑 | Why do you want to kick the owner? You can't do that!");

    let DMed: boolean = false;

    if (member) {
      if (member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerID !== message.author.id) 
        return message.channel.send(`> ${redtick} | You cannot kick this user due to role hierarchy.`);
      if (!member.kickable) 
        return message.channel.send(`> ${redtick} | I cannot kick this user due to role hierarchy.`);

      DMed = true;
      await member.send(`> 👞 | **Kicked - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 👋 | **Want to join back?** \n Make sure to follow the rules and listen to the staff members! http://www.draavo.cf/discord`, { split: true })
      .catch(e => DMed = false);
    };

    await member.kick(`${message.author.id}|${reason}`)
      .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, Discord threw an exception: \`${e}\`.`) });

    return message.channel.send(`> 👞 | Successfully kicked **${member.user.tag}** for **${reason}**. ${DMed ? "" : "\n > ℹ | **I couldn't DM this user**"}`, { split: true });
  }
}