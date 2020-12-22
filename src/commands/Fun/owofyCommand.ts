import { Message } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';

export default class owofyCommand extends BaseCommand {
  constructor() {
    super('owofy', {
      category: 'Fun',
      aliases: ["uwufy"],
      description: "owofy your text with this command",
      usage: "<text>",
      channelType: "both",
      ownerOnly: false,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    const array: string[] = ['pika_uwu', 'meow_uwu', 'uwu'];
    const random: string = array[Math.floor(Math.random() * array.length)]
    const randomEmoji = client.utils.EmojiFinder(random);
    return message.channel.send(`> ${randomEmoji.toString()} | ${client.utils.owowfy(args.join(' '))}`);
  }
}