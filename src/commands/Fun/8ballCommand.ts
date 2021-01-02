import { Message } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";

const ball: Array<string> = [
	"🎱 | As I see it, yes,",
	"🎱 | Better not tell you now,",
	"🎱 | Cannot predict now,",
	"🎱 | Concentrate and ask again,",
	"🎱 | Don’t count on it,",
	"🎱 | It is certain,",
	"🎱 | It is decidedly so,",
	"🎱 | Most likely,",
	"🎱 | My reply is no,",
	"🎱 | My sources say no,",
	"🎱 | Outlook not so good,",
	"🎱 | Outlook good,",
	"🎱 | Reply hazy, try again,",
	"🎱 | Signs point to yes,",
	"🎱 | Very doubtful,",
	"🎱 | Without a doubt,",
	"🎱 | You may rely on it,",
	"🎱 | Yes,",
	"🎱 | Yes – definitely,",
];

export default class eightballCommand extends BaseCommand {
	constructor() {
		super("eightball", {
			category: "Fun",
			aliases: ["8ball"],
			description: "8ball will answer all your questions",
			usage: "<question including ?>",
			channelType: "both",
			ownerOnly: false,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		if (
			!args
				.map((a) => a)
				.join(" ")
				.toString()
				.endsWith("?")
		)
			return message.channel.send(
				"> ⁉ | I can not answer your question without one (add a ? to your question)"
			);

		const choice = ball[Math.floor(Math.random() * ball.length)];
		return message.channel.send(`> ${choice} **${message.author.username}**.`);
	}
}
