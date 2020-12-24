import BaseEvent from '../../../utils/structures/BaseEvent';
import DiscordClient from '../../../client/client';
import { msgLogId, msgLogToken } from "../../../../config";
import { MessageEmbed, Message, WebhookClient } from 'discord.js';

const webhook = new WebhookClient(msgLogId, msgLogToken);

export default class muteEvent extends BaseEvent {
  constructor() {
    super("messageUpdate");
  }

  async run(client: DiscordClient, oldMessage: Message, newMessage: Message) {
    if (oldMessage.partial) oldMessage = await oldMessage.fetch(true);
    if (newMessage.partial) newMessage = await newMessage.fetch(true);

    const message = oldMessage;
    if (message.channel.type === "dm") return;
    await message.channel.fetch(true);

    if (message.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new MessageEmbed()
    .setTimestamp()
    .setColor("#4389F0")
    .setFooter("updated at")
    .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 4096 }))
    .setTitle(`Message updated in #${message.channel.name}`)
    .setDescription(`**Before**: ${message.content.length > 800 ? message.content.substr(0, 800) + "..." : message.content}` + "\n" + `**After**: ${newMessage.content.length > 800 ? newMessage.content.substr(0, 800) + "..." : newMessage.content}`);

    webhook.send(embed);
  }
}