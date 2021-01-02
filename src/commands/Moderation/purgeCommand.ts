import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Collection, Message, TextChannel } from "discord.js";

export default class banCommand extends BaseCommand {
	constructor() {
		super("purge", {
			category: "Moderation",
			aliases: ["clear"],
			ownerOnly: false,
			channelType: "guild",
			description: "Purge messages/clear channels with this command",
			usage: "<amount max 100>",
			userPermissions: ["MANAGE_MESSAGES"],
			clientPermissions: ["MANAGE_MESSAGES"],
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const redtick = client.utils.EmojiFinder("redtick").toString();
		const amount: number = parseInt(args[0]);

		if (isNaN(amount) || amount < 1 || amount > 100)
			return message.channel.send(
				`> ${redtick} | Invalid amount, please choose between \`2-100\` messages.`
			);

		await message.delete();
		const messages = await message.channel.messages.fetch({ limit: amount });
		if (!messages.size)
			return message.channel.send(
				`> ${redtick} | I wasn't able to find any valid messages, I can only purge messages that are less than 2 weeks old.`
			);

		const msgs = await (message.channel as TextChannel).bulkDelete(
			messages,
			true
		);
		const authors: Collection<string, number> = new Collection();

		messages
			.filter((m) => m.createdTimestamp > 12096e5)
			.forEach((m) =>
				authors.set(m.author.tag, authors.get(m.author.tag) + 1 || 1)
			);
		return message.channel
			.send(
				`> 🗑 | Successfully purged **${msgs.size}** messages!\n${authors
					.map((v, k) => `${k} - **${v}**`)
					.join("\n")}`,
				{ split: true }
			)
			.then((m) => m.forEach((msg) => msg.delete({ timeout: 5e3 })));
	}
}
