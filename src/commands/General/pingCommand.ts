import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import ms from "ms";

export default class PingCommand extends BaseCommand {
	constructor() {
		super("ping", {
			category: "General",
			aliases: ["pong"],
			description: "Owo, shows you the ping :D",
			ownerOnly: false,
			channelType: "both",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const msg = await message.channel.send("> 🏓 | Pinging...");

		const api = client.ws.ping;
		const uptime = ms(client.uptime, { long: true });
		const editLatency = (msg.createdTimestamp - Date.now()).toString();
		const edit = editLatency.startsWith("-")
			? editLatency.slice(1)
			: editLatency;

		return msg.edit(
			`> 🏓 | Pong! API latency: \`${api}\`ms, edit latency: \`${edit}\`ms, uptime: \`${uptime}\``
		);
	}
}
