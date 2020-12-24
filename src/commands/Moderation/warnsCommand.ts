import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { warnSchema } from "../../utils/database/warn";
import moment from "moment";
import { 
  Message, 
  GuildMember, 
  MessageEmbed, 
  MessageReaction, 
  User, 
  TextChannel,
  EmbedField,
  Collection
} from "discord.js";
import { Document } from "mongoose";
import { tempbanSchema } from "../../utils/database/tempban";

export default class warnCommand extends BaseCommand {
  constructor() {
    super("warns", {
      category: "Moderation", 
      aliases: ["warnings"],
      ownerOnly: false,
      channelType: "guild",
      description: "Shows the list of users with warnings or shows you the warnings of a specific user.",
      usage: "[user id/mention/tag/username]",
      userPermissions: ["MANAGE_MESSAGES"],
      timeout: 1e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const redtick = client.utils.EmojiFinder("redtick").toString();
    const member: GuildMember = client.utils.filterMember(message, args[0]|| "");
    const embed = new MessageEmbed().setColor("#728BD7");

    if (member)  {
      const data = await warnSchema.find({ guildId: message.guild.id, id: member.id })
        .catch(e => { message.channel.send(`> ${client.utils.EmojiFinder("warning").toString()} | Oops, mongodb threw an exception: \`${e}\`.`); return [new Document<any>(null)]; });

      if (!data.length) return message.channel.send(`> ${redtick} | I didn't find any cases for **${member.user.tag}**.`);
      embed.setTitle(`${data.length} warnings found for ${member.user.tag}`);

      const embeds = this.generateEmbeds(data, embed);
      if (embeds.length === 1) return message.channel.send(embeds[0]);

      const msg = await message.channel.send(embeds[0]);
      return this.pagination(msg, embeds);
    }
    
    const data = await warnSchema.find({ guildId: message.guild.id });
    if (!data.length) return message.channel.send(`> 🥳 | No warnings for this server found, yay!`);

    const tempCache = new Collection<string, number>();

    data.forEach(w => tempCache.set(w.get("id"), tempCache.get(w.get("id")) ? tempCache.get(w.get("id")) + 1 : 1));
    const warns: { id: string, warns: number }[] = tempCache.sort((a, b) => b - a).map((v, k) => { return { id: k, warns: data.filter(v => v.get("id") === k).length } });

    embed
    .setTitle("Users with warnings in this server")
    .setDescription(warns.map(w => `<@${w.id}> - **${w.warns}**`).join("\n").substr(0, 2000));

    return message.channel.send(embed);
  }

  generateEmbeds(items: Document<Warn>[], base: MessageEmbed): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];
    let count: number = 25;

    for (let i = 0; i < items.length; i += 25) {
      const current = items.slice(i, count);

      const map: EmbedField[] = current.map((data) => { 
        return {
          name: `${data.get("case")} | Warn | ${moment(data.get("date") as number).format("MMMM Do YYYY")}`, 
          value: `Moderator: <@${data.get("moderator")}>\nReason: ${(data.get("reason") as string).substr(0, 500)}`,
          inline: true,
        };
      });
      count += 25;
    
      embeds.push(new MessageEmbed(base).addFields(...map));
    }

    return embeds;
  }

  async pagination(message: Message, pages: MessageEmbed[], emojiList: string[] = ["◀", "🗑", "▶"], timeout = 12e4, pageNumber: number = 1) {
    let page = pageNumber;
    const currentPage = message;

    emojiList.forEach(emoji => currentPage.react(emoji));

    const filter = (reaction: MessageReaction, user: User) => {
      return emojiList.includes(reaction.emoji.name) && !user.bot;
    };
    const collector = currentPage.createReactionCollector(filter, { time: timeout });

    collector.on("collect", (reaction: MessageReaction, user: User) => {
      switch (reaction.emoji.name) {
        case emojiList[0]: page = page === 1 ? pages.length : page - 1; break;
        case emojiList[2]: page = page === pages.length ? 1 : page + 1; break;
        case emojiList[1]: return currentPage.delete();
			  default: break;
      };

      if ((message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) reaction.users.remove(user);
      currentPage.edit(pages[page - 1].setFooter(`Page ${page} of ${pages.length}`));
    });

    collector.on("end", () => { 
      if (!currentPage.deleted && (message.channel as TextChannel).permissionsFor(message.guild.me).has("MANAGE_MESSAGES")) 
        currentPage.reactions.removeAll();
    });
  }
}

interface Warn {
  id: string,
  guildId: string,
  moderator: string,
  reason: string,
  case: string,
  date: number,
}