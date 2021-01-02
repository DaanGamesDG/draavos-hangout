import DiscordClient from "../../client/client";
import BaseCommand from "../../utils/structures/baseCommand";
import tictactoe from "../../utils/games/tictactoe";
import { Message } from "discord.js";

export default class tictactoeCommand extends BaseCommand {
	constructor() {
		super("tictactoe", {
			category: "Games",
			aliases: ["ttt"],
			ownerOnly: false,
			channelType: "guild",
			description: "Starts a tictactoe game, with a user from the server.",
			usage: "<user id/tag/mention/name>",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const member = await client.utils.filterMember(message, args[0]);
		if (!member || member.id === message.author.id)
			return message.channel.send(
				`> 🔎 | I didn't find a different user called "${args[0]}". `
			);
		if (member.user.presence.status === "offline")
			return message.channel.send(
				"> 💤 | Sorry, this user is offline. You can only start a game once the user is online again!"
			);
		if (member.user.bot)
			return message.channel.send(
				"> 🤖 | Sorry, you cannot start a game with a discord bot."
			);

		new tictactoe(message, [message.author.id, member.id]).start();
	}
}
