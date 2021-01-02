import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";

export default class emojifyCommand extends BaseCommand {
	constructor() {
		super("emojify", {
			category: "Fun",
			aliases: [],
			description: "emojify your text with this command.",
			usage: "<text>",
			channelType: "both",
			ownerOnly: false,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		return message.channel.send(
			`> 🔤 | ${client.utils.emojify(args.join(" "))}`
		);
	}
}
