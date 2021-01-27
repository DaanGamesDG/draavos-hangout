import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import { feedback } from "../../utils/database/feedback";

export default class feedbackCommand extends BaseCommand {
	constructor() {
		super("feedback", {
			category: "Owner Only",
			aliases: [],
			usage: "<id>",
			ownerOnly: true,
			channelType: "guild",
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		await feedback.findOneAndUpdate(
			{ guildId: message.guild.id },
			{ message: typeof args[0] === "string" ? args[0] : "", guildId: message.guild.id },
			{ upsert: true }
		);
		message.react("✅");
	}
}
