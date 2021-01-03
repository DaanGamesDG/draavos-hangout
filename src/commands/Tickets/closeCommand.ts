import { Message, TextChannel } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import { ticketsSchema } from "../../utils/database/ticket";

export default class PingCommand extends BaseCommand {
	constructor() {
		super("close", {
			category: "Tickets",
			aliases: [],
			description: "Closes a ticket, really simple.",
			ownerOnly: false,
			channelType: "guild",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		message.channel = message.channel as TextChannel;
		if (!message.channel.name.endsWith("-ticket"))
			return message.channel.send(
				"> ❗ | You can only do that in a ticket channel"
			);

		if (
			!message.channel.topic.includes(message.author.id) &&
			message.member.permissions.missing("MANAGE_GUILD")
		)
			return message.channel.send(
				"> 👮‍♂️ | This is not your ticket, you can only close your own tickets unless you have the `Manage Server` permissions."
			);

		ticketsSchema.findOneAndDelete({ channel: message.channel.id }, {}, (e) => {
			if (e) return message.channel.send(e);
		});

		message.channel.delete();
	}
}
