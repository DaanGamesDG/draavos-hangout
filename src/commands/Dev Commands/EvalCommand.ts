import { Message, MessageEmbed, MessageAttachment } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import { inspect } from "util";
import { Buffer } from "buffer";

export default class EvalCommand extends BaseCommand {
	constructor() {
		super("eval", {
			category: "Owner Only",
			aliases: ["ev", "e", "evaluate"],
			usage: "<code>",
			clientPermissions: ["EMBED_LINKS"],
			ownerOnly: true,
			channelType: "both",
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const code: string = args
			.join(" ")
			.replace(/[“”]/g, '"')
			.replace(/[‘’]/g, "'");
		if (!code)
			return message.channel.send(
				`> ${client.utils
					.EmojiFinder("redtick")
					.toString()} | I can not evaluate your code without any.`
			);

		let evaled: string;
		try {
			const start = process.hrtime();
			evaled = await eval(code);
			const stop = process.hrtime(start);

			const input: string = code;
			const output: string = this.clean(
				inspect(evaled, { depth: 0 }),
				client.token
			) as string;
			const timeTaken: number = (stop[0] * 1e9 + stop[1]) / 1e6;

			if (
				input.length > 1024 ||
				output.length > 1024 ||
				timeTaken.toString().length > 1024
			) {
				const total = [input, output, timeTaken].join("\n");
				return message.channel.send(
					new MessageAttachment(Buffer.from(total), "evaluated.txt")
				);
			} else {
				const embed: MessageEmbed = new MessageEmbed()
					.setTitle(`Evaluated code | ${message.author.tag}`)
					.addField("**❯ Input**:", `\`\`\`ts\n${input}\n\`\`\``)
					.addField("**❯ Output**:", `\`\`\`ts\n${output}\n\`\`\``)
					.addField("**❯ Time Taken**:", `\`\`\`${timeTaken}ms \`\`\``)
					.setColor(message.member.displayHexColor || "BLUE");

				return message.channel.send(embed);
			}
		} catch (e) {
			return message.channel.send(
				`> ${client.utils
					.EmojiFinder("redtick")
					.toString()} | Error:  \n\`\`\`xl\n${this.clean(
					e.message,
					client.token
				)}\n\`\`\``
			);
		}
	}

	clean(text: string, token: string): string | void {
		if (typeof text === "string") {
			return text
				.replace(/`/g, `\`${String.fromCharCode(8203)}`)
				.replace(/@/g, `@${String.fromCharCode(8203)}`)
				.replace(new RegExp(token, "gi"), `****`);
		}
	}
}
