import { Message, MessageEmbed } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";
import DiscordClient from "../../client/client";

export default class PingCommand extends BaseCommand {
	constructor() {
		super("avatar", {
			category: "General",
			aliases: ["pfp"],
			description: "Shows you the profile picture of someone.",
			usage: "[user id/username/tag/mention]",
			ownerOnly: false,
			channelType: "both",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		let member = client.utils.filterMember(message, args[0] || "");
		if (!member) member = message.member;

		const png = member.user.displayAvatarURL({
			dynamic: true,
			size: 4096,
			format: "png",
		});
		const jpg = member.user.displayAvatarURL({
			dynamic: true,
			size: 4096,
			format: "jpg",
		});
		const webp = member.user.displayAvatarURL({
			dynamic: true,
			size: 4096,
			format: "webp",
		});
		const gif = member.user.displayAvatarURL({
			dynamic: true,
			size: 4096,
			format: "gif",
		});

		const normal = member.user
			.displayAvatarURL({ dynamic: true, size: 4096 })
			.includes(".gif")
			? gif
			: png;

		const embed = new MessageEmbed()
			.setTitle(`Avatar of ${member.user.tag}`)
			.setColor("#728BD7")
			.setDescription(
				`Links: [default](${normal}) | [jpg](${jpg}) | [webp](${webp})`
			)
			.setImage(normal);

		return message.channel.send(embed);
	}
}
