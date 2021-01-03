import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message } from "discord.js";
import moment from "moment";

export default class activeCommand extends BaseCommand {
	constructor() {
		super("active", {
			category: "Moderation",
			aliases: [],
			ownerOnly: false,
			channelType: "guild",
			description: "gives you the date of the last message someone sent.",
			usage: "<user id/name/tag/mention>",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const user = await client.utils.filterMember(message, args[0]);

		if (!user)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);

		const plain = (await (await user.fetch()).lastMessage.fetch())
			.createdTimestamp;
		const date =
			moment(plain).format("MMMM Do YYYY hh:mm:ss") +
			" | " +
			moment(plain).fromNow();

		return message.channel.send(
			`> ℹ | **${user.user.username}**'s last message was sent on \`${date}\`.`
		);
	}
}
