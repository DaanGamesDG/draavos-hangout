import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";

const files: string[] = [
	"https://cdn.discordapp.com/attachments/727992822036430859/734556525657587732/unknown.png",
	"https://cdn.discordapp.com/attachments/563724345478742018/728714872719671337/unknown.png",
	"https://cdn.discordapp.com/attachments/571619638182674442/728709803165351955/uwu.mp4",
];

export default class owofyCommand extends BaseCommand {
	constructor() {
		super("uwu", {
			category: "Fun",
			aliases: [],
			description: "UwU, only available in #uwu-kingdom or in DMs",
			channelType: "both",
			ownerOnly: false,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		if (
			(message.channel.type == "text" || message.channel.type == "news") &&
			message.channel.id !== "727992822036430859"
		)
			return message.channel.send(
				`> ${client.utils.EmojiFinder(
					"meow_uwu"
				)} | You can only use this command in <#727992822036430859> or in DMs.`
			);

		const file = files[Math.random() * files.length - 1];
		return message.channel.send(
			`> ${client.utils.EmojiFinder("meow_uwu")} | Uwu, ` + file
		);
	}
}
