import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message } from "discord.js";

export default class banCommand extends BaseCommand {
	constructor() {
		super("message", {
			category: "Moderation",
			aliases: ["send"],
			ownerOnly: false,
			channelType: "guild",
			description:
				"Send a message via the bot to someone in the server - do not abuse!",
			usage: "<user id/mention/tag/username>|<message>",
			userPermissions: ["MANAGE_MESSAGES"],
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const member = client.utils.filterMember(message, args[0]);
		const msg = args.slice(1).join(" ");

		if (!member)
			return message.channel.send(
				`> 🔎 | I didn't find a user called "${args[0]}".`
			);

		let DMed: boolean = true;
		await member
			.send(
				`> 📢 | You received a message from **${message.author.tag}**:\n${msg}\n\nIf you think this user is abusing the system, please report it to us!`
			)
			.catch((e) => (DMed = false));

		return message.channel.send(
			DMed
				? `> ${client.utils
						.EmojiFinder("greentick")
						.toString()} | Successfully DMed **${member.user.tag}**!`
				: `> ${client.utils
						.EmojiFinder("redtick")
						.toString()} | I was unable to DM **${
						member.user.tag
				  }**, this is 9 out of 10 times because the user disabled their DMs for non-friends!`
		);
	}
}
