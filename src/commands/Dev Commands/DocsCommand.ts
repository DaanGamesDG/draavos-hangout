import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import fetch from "node-fetch";

export default class DocsCommand extends BaseCommand {
	constructor() {
		super("docs", {
			category: "Owner Only",
			aliases: [],
			usage: "<search query>",
			clientPermissions: ["EMBED_LINKS"],
			ownerOnly: true,
			channelType: "both",
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const url = `https://djsdocs.sorta.moe/v2/embed?src=stable&q=${encodeURIComponent(
			args.join(" ")
		)}`;

		try {
			const data = await fetch(url);
			const embed = await data.json();

			if (!embed || embed.error)
				return message.channel.send(
					`> ${client.utils
						.EmojiFinder("djslogo")
						.toString()} | Sorry, "${args.join(
						" "
					)}" couldn't be located within the Discord.js documentation. (https://discord.js.org/)`
				);

			return message.channel.send({ embed });
		} catch (e) {
			return message.channel.send(e, { split: true, code: true });
		}
	}
}
