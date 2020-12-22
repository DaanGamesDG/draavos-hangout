import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import hangMan from "../../utils/games/hangMan";
import { Message } from "discord.js";

export default class hangmanCommand extends BaseCommand {
  constructor() {
    super('hangman', {
      category: 'Games', 
      aliases: [],
      ownerOnly: false,
      channelType: "both",
      description: "Starts a hangman game, with a random word found via an api.",
      timeout: 5e3,
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
    new hangMan(message).start();
  }
}