import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import { Message } from "discord.js";

export default class Command extends BaseCommand {
	constructor() {
		super("amessage", {
			category: "Moderation",
			aliases: ["asend"],
			ownerOnly: false,
			channelType: "guild",
			description: "Send an anonymous message via the bot to someone in the server - do not abuse!",
			usage: "<user id/mention/tag/username>|<message>",
			userPermissions: ["MANAGE_GUILD"],
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const member = await client.utils.filterMember(message, args[0]);
		const msg = args.slice(1).join(" ");

		if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);

		let DMed: boolean = true;
		await member
			.send(`> 📢 | You received a message from the **Senior Staff Team**:\n${msg}`)
			.catch((e) => (DMed = false));

		return message.channel.send(
			DMed
				? `> ${client.utils.EmojiFinder("greentick").toString()} | Successfully DMed **${
						member.user.tag
				  }**!`
				: `> ${client.utils.EmojiFinder("redtick").toString()} | I was unable to DM **${
						member.user.tag
				  }**, this is 9 out of 10 times because the user disabled their DMs for non-friends!`
		);
	}
}
