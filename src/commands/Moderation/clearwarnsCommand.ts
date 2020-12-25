import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { warnSchema } from "../../utils/database/warn";
import { Message, GuildMember } from "discord.js";

export default class warnCommand extends BaseCommand {
  constructor() {
    super("clearwarns", {
      category: "Moderation", 
      aliases: ["clearwarnings"],
      ownerOnly: false,
      channelType: "guild",
      description: "Removes all the warns of someone.",
      usage: "<user id/mention/tag/username>",
      userPermissions: ["MANAGE_MESSAGES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const member: GuildMember = client.utils.filterMember(message, args[0]);

    if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);
    
    const data = await warnSchema.find({ guildId: message.guild.id, id: member.id });
    if (!data) return message.channel.send(`> ${redtick} | I didn't find any cases for **${member.user.tag}**.`);

    if (data[0].get("id") === message.author.id && !message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }))
      return message.channel.send(`> ${redtick} | You can not remove your own warning unless you have the \`Manage Server\` permission!`);

    let error: any;
    data.forEach(async d => await d.delete().catch(e => error = e))
     
    if (error) return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, mongodb threw an exception: \`${error}\`.`);

    return message.channel.send(`> ${client.utils.EmojiFinder("greentick").toString()} | Successfully removed all the warnings of **${member.user.tag}**.`);
  }
}