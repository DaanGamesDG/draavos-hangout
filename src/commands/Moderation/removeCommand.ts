import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message, TextChannel } from "discord.js";

export default class removeCommand extends BaseCommand {
	constructor() {
		super("remove", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description: "Deletes a message and notifies the author.",
			usage: "<channel mention/id>|<message id>|[reason]",
			timeout: 2e3,
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const channel = (message.mentions.channels.first() ||
			message.guild.channels.cache.get(args[0])) as TextChannel;
		if (!channel)
			return message.channel.send(`>>> ❓ | I was unable to find a channel called "${args[0]}"!`);

		const msg: Message = await channel.messages.fetch(args[1]).catch((e) => null);
		const reason = args.slice(2).join(" ") || "No reason given";

		if (!msg)
			return message.channel.send(`> 🔎 | I didn't find a message with the id "${args[1]}".`);

		let DMed: boolean = false;
		DMed = true;
		await msg.author
			.send(`> 🧾 | **Message Deleted - Draavo's Hangout**\n> 📃 | Reason: **${reason}**`, {
				split: true,
			})
			.catch((e) => (DMed = false));

		msg.delete().catch((e) => {
			return message.channel.send(`Error: ${e}`);
		});

		return message.channel.send(
			`> 🧾 | Successfully removed the message of **${msg.author.tag}** for **${reason}**. ${
				DMed ? "" : "\n > ℹ | **I couldn't DM this user**"
			}`,
			{ split: true }
		);
	}
}
