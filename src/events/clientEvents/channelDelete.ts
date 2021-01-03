import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import { DMChannel, GuildChannel, User } from "discord.js";

export default class channelDeleteEvent extends BaseEvent {
	constructor() {
		super("channelDelete");
	}

	async run(client: DiscordClient, channel: DMChannel | GuildChannel) {
		if (channel.type !== "text" || !channel.name.endsWith("-ticket")) return;

		const user: User =
			client.users.cache.get(channel.name.slice(0, -7)) ||
			(await client.users.fetch(channel.name.slice(0, -7)).catch((e) => null));
		if (!user) return;

		user
			.send(
				"> 👍 | Your ticket is now closed, thanks for getting in touch! \n> ❓ | Questions? Don't hesitate to contact us again, we are always happy to help!\n\n If you have time, please give our staff team some feedback: https://forms.gle/CbEVRuGPywjZausd9"
			)
			.catch((e) => null);
	}
}
