import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { warnSchema } from "../../utils/database/warn";
import { GuildMember, Message } from "discord.js";

export default class warnCommand extends BaseCommand {
  constructor() {
    super("reason", {
      category: "Moderation", 
      aliases: [],
      ownerOnly: false,
      channelType: "guild",
      description: "Add a reason to a warning.",
      usage: "<case id>|<reason>",
      userPermissions: ["MANAGE_MESSAGES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const caseId = `#${args[0].startsWith("#") ? args[0].slice(1) : args[0]}`;
    const reason = args.slice(1).join(" ");

    const data = await warnSchema.findOne({ case: caseId, guildId: message.guild.id });
    if (!data) return message.channel.send(`> ${redtick} | I didn't find a case with the id "${caseId}".`);

    const newWarn = new warnSchema({
      id: data.get("id"),
      guildId: message.guild.id,
      moderator: data.get("moderator"),
      reason,
      case: caseId,
      date: data.get("date") as number,
    });

    data.delete();
    newWarn.save();

    return message.channel.send(`> ${client.utils.EmojiFinder("greentick").toString()} | Successfully updated the reason for case "${caseId}"!`);
  }
}