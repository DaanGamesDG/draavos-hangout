import BaseEvent from "../../../utils/structures/baseEvent";
import DiscordClient from "../../../client/client";
import { msgLogId, msgLogToken } from "../../../../config";
import { MessageEmbed, Message, WebhookClient } from "discord.js";

const webhook = new WebhookClient(msgLogId, msgLogToken);

export default class muteEvent extends BaseEvent {
	constructor() {
		super("messageDelete");
	}

	async run(client: DiscordClient, message: Message) {
		if (message.channel.type === "dm") return;
		await message.channel.fetch(true);

		if (message.partial || message.author.bot) return;

		const embed = new MessageEmbed()
			.setTimestamp()
			.setColor("#DC5E55")
			.setFooter("Deleted at")
			.setAuthor(
				message.author.tag,
				message.author.displayAvatarURL({ dynamic: true, size: 4096 })
			)
			.setTitle(`Message deleted in #${message.channel.name}`)
			.setDescription(
				"**content**: " +
					(message.content.length > 2000
						? message.content.substr(0, 2000) + "..."
						: message.content)
			);

		message.attachments.size
			? embed.addField(
					"• Attachments",
					client.utils
						.trimArray(client.utils.getAttachments(message.attachments))
						.join("\n")
			  )
			: "";

		webhook.send(embed);
	}
}
