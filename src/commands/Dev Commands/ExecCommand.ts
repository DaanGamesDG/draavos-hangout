import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import { exec } from "child_process";

export default class ExecCommand extends BaseCommand {
	constructor() {
		super("exec", {
			category: "Owner Only",
			aliases: ["execute"],
			usage: "<query>",
			clientPermissions: ["EMBED_LINKS"],
			ownerOnly: true,
			channelType: "both",
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		return exec(args.join(" "), (err, stdout) => {
			const response = stdout || err;
			return message.channel.send(response, { split: true, code: true });
		});
	}
}
