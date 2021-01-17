import { Message, TextChannel, User } from "discord.js";
import BaseCommand from "../../utils/structures/baseCommand";
import DiscordClient from "../../client/client";
import { ticketsSchema } from "../../utils/database/ticket";

export default class PingCommand extends BaseCommand {
	constructor() {
		super("transfer", {
			category: "Tickets",
			aliases: [],
			description: "transfers a ticket to someone else.",
			usage: "<user id/tag/username/mention>",
			ownerOnly: false,
			channelType: "guild",
			timeout: 5e3,
		});
	}

	async run(client: DiscordClient, message: Message, args: Array<string>) {
		const member = await client.utils.filterMember(message, args[0]);

		//@ts-ignore
		message.channel = message.channel as TextChannel;
		if (!message.channel.name.endsWith("-ticket")) return;

		if (!member) return message.channel.send(`> 🔎 | I didn't find a user called "${args[0]}".`);

		const claimer = message.channel.topic.split(/\|/g).shift();
		if (member.id === claimer)
			return message.channel.send(
				"> ❓ | Why do you to transfer it yourself?! You are already ticket claimer."
			);
		if (
			message.author.id !== claimer &&
			!message.member.hasPermission("MANAGE_GUILD", { checkAdmin: true, checkOwner: true })
		)
			return message.channel.send(
				`>>> 👮‍♂️ | Sorry, you can not transfer someone elses ticket unless you have the "Manage Server" permissions.`
			);

		const data = await ticketsSchema.findOneAndUpdate({ claimer }, { claimer: member.id });
		message.channel.setTopic(
			`${member.id}|Do not edit this channel, doing so might result in a broken ticket!`
		);
		message.channel.updateOverwrite(member, {
			ATTACH_FILES: true,
			SEND_MESSAGES: true,
			VIEW_CHANNEL: true,
		});
		message.channel.updateOverwrite(claimer, {
			VIEW_CHANNEL: false,
		});

		const user: User =
			client.users.cache.get(data.get("id")) ||
			(await client.users.fetch(data.get("id")).catch((e) => null));
		if (user)
			user.send(`> 📨 | Your ticket is transferred to ${member.toString()}.`).catch((e) => null);
	}
}
