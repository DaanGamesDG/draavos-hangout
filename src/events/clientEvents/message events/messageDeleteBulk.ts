import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import {
	MessageEmbed,
	Message,
	WebhookClient,
	Snowflake,
	Collection,
} from "discord.js";

const webhook = new WebhookClient(
	process.env.MSGLOGID,
	process.env.MSGLOGTOKEN
);

export default class muteEvent extends BaseEvent {
	constructor() {
		super("messageDeleteBulk");
	}

	async run(client: DiscordClient, messages: Collection<Snowflake, Message>) {
		let cachedMessages = messages.filter((m) => !m.partial);
		if (!cachedMessages.size) return;

		cachedMessages = cachedMessages.filter((m) => !m.author.bot);
		const message = cachedMessages.first();

		if (message.channel.type === "dm") return;
		await message.channel.fetch(true);

		const content = splitMessage(
			cachedMessages
				.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp)
				.map(
					(m) =>
						`**${m.author.tag}**: ${
							m.content.replace(/\\n/g, "") || "No message content"
						}`
				)
		).filter((str) => str.length > 0);

		let i: number = 0;
		const embeds: MessageEmbed[] = [];
		for (const c of content) {
			const embed = new MessageEmbed();

			if (i === 0 && content.length === 1) {
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter(
						`${cachedMessages.size} of ${messages.size} messages shown`
					)
					.setTitle(`Messages deleted in #${message.channel.name}`)
					.setDescription(c.replace(/\\n/g, "\n"));
			} else if (i === 0) {
				embed
					.setColor("#DC5E55")
					.setTitle(`Messages deleted in #${message.channel.name}`)
					.setDescription(c.replace(/\\n/g, "\n"));
			} else if (i + 1 === content.length) {
				embed
					.setTimestamp()
					.setColor("#DC5E55")
					.setFooter("Deleted at")
					.setFooter(
						`${cachedMessages.size} of ${messages.size} messages shown`
					)
					.setDescription(c.replace(/\\n/g, "\n"));
			} else {
				embed.setColor("#DC5E55").setDescription(c.replace(/\\n/g, "\n"));
			}

			i += 1;
			embeds.push(embed);

			embeds.length === 10 || i === content.length ? webhook.send(embeds) : "";
		}
	}
}

function splitMessage(text: string[]): string[] {
	const arr: string[] = [];
	const str = text.join("\\n");
	let j: number = 0;

	for (let i = 0; i < text.length; i++) {
		j += 2000;
		arr.push(str.slice(i * 2000, j));
	}

	return arr;
}
