import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { warnSchema } from "../../utils/database/warn";
import { Message } from "discord.js";

export default class warnCommand extends BaseCommand {
  constructor() {
    super("removewarn", {
      category: "Moderation", 
      aliases: ["removewarnings"],
      ownerOnly: false,
      channelType: "guild",
      description: "Removes a warning from someone using the case ids.",
      usage: "<case id>",
      userPermissions: ["MANAGE_MESSAGES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const caseId = `#${args[0].startsWith("#") ? args[0].slice(1) : args[0]}`;
    
    const data = await warnSchema.findOne({ case: caseId, guildId: message.guild.id });
    if (!data) return message.channel.send(`> ${redtick} | I didn't find a case with the id "${caseId}".`);
    if (data.get("id") === message.author.id && !message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true }))
      return message.channel.send(`> ${redtick} | You can not remove your own warning unless you have the \`Manage Server\` permission!`);

    data.delete()
    .catch(e => { return message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, mongodb threw an exception: \`${e}\`.`) });

    return message.channel.send(`> ${client.utils.EmojiFinder("greentick").toString()} | Successfully removed warning "${caseId}".`);
  }
}