import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { warnSchema } from "../../utils/database/warn";
import { GuildMember, Message } from "discord.js";
import { muteRole } from "../../../config";
import ms from "ms";

export default class warnCommand extends BaseCommand {
  constructor() {
    super("warn", {
      category: "Moderation", 
      aliases: [],
      ownerOnly: false,
      channelType: "guild",
      description: "warn someone, really simple I think.",
      usage: "<user id/mention/tag/username>|[reason]",
      userPermissions: ["MANAGE_MESSAGES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const member: GuildMember = client.utils.filterMember(message, args[0]);
    const reason = args.slice(1).join(" ") || "No reason given";

    if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);
    if (member.id === message.author.id) return message.channel.send("> ❓ | Why do you want to warn yourself?!");
    if (member.id === client.user.id) return message.channel.send("> 😢 | After all the hard work, you still want to warn me?");
    if (member.id === message.guild.ownerID) return message.channel.send("> 👑 | Why do you want to warn the owner? You can't do that!");

    let DMed: boolean = false;

    if (member) {
      if (member.roles.highest.position >= message.member.roles.highest.position && message.guild.ownerID !== message.author.id) 
        return message.channel.send(`> ${redtick} | You cannot warn this user due to role hierarchy.`);

      DMed = true;
      await member.send(`> 🧾 | **Warned - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 🙏 | **Want to appeal?** \n Create a ticket with the topic: \`warn appeal\`.`, { split: true })
      .catch(e => DMed = false);
    };
    
    const caseId = `#${(await warnSchema.find({ guildId: message.guild.id })).length + 1}`;
    await new warnSchema({   
      id: member.id,
      guildId: message.guild.id,
      moderator: message.author.id,
      reason,
      case: caseId,
      date: Date.now(),
    }).save()
      .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, mongodb threw an exception: \`${e}\`.`) });

    await member.roles.add(muteRole, `${message.author.id}|${reason}`)
      .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, Discord threw an exception: \`${e}\`.`) });
    
    client.emit("warnEvent", member, message.author, reason);
    return message.channel.send(`> 🧾 | Successfully warned **${member.user.tag}** for **${reason}**. Case id: \`${caseId}\`. ${DMed ? "" : "\n > ℹ | **I couldn't DM this user**"}`, { split: true });
  }
}