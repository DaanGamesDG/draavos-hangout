import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message, TextChannel } from "discord.js";

export default class echoCommand extends BaseCommand {
	constructor() {
		super("echo", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description: "Send a message to a channel via the bot.",
			usage: "<channel id/mention>|<message>",
			timeout: 1e3,
			userPermissions: ["MANAGE_GUILD"],
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const channel = (message.mentions.channels.first() ||
			message.guild.channels.cache.get(args[0])) as TextChannel;

		if (!channel)
			return message.channel.send(`>>> ❓ | I was unable to find a channel called "${args[0]}"!`);
		const msg = args.slice(1).join(" ");

		let reply: string = "✅";
		try {
			await channel.send(msg);
		} catch (e) {
			reply = "❌";
		}

		return message.react(reply);
	}
}
