import {
	Collection,
	Guild,
	Message,
	MessageEmbed,
	MessageReaction,
	TextChannel,
	User,
} from "discord.js";
import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import moment from "moment";
import { ticketsSchema } from "../../utils/database/ticket";

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("ticketCreate");
	}

	async run(client: DiscordClient, message: Message) {
		if (await ticketsSchema.findOne({ id: message.author.id })) return;

		const filter = (m: Message) => {
			return m.author.id === message.author.id && m.content.length > 0;
		};
		const emojiFilter = (reaction: MessageReaction, user: User) => {
			return reaction.emoji.name === "✔" && !user.bot;
		};
		const dm = await message.author.createDM();
		const check: Message = await dm
			.send(
				"> 👋 Hello! What is the reason behind your ticket today? Please provide as much detail as possible so that we can help you as best as we can!"
			)
			.catch((e) => null);
		if (!check)
			return message.channel.send(
				"> ❗ | Your DMs aren't open, open them to create a ticket.\n > 🤔 | If you think I am wrong, ping **DaanGamesDG#7621** and he will help."
			);
		const collector = await check.channel
			.awaitMessages(filter, { max: 1, time: 6e4, errors: ["time"] })
			.catch((e) => new Collection<string, Message>());
		if (!collector.size) check.delete();
		const reason = collector.first().content;
		const channel =
			(client.channels.cache.get(process.env.TICKET_LOGS) as TextChannel) ||
			((await client.channels.fetch(process.env.TICKET_LOGS)) as TextChannel);

		const embed = new MessageEmbed()
			.setColor("#9295F8")
			.setTitle(
				`New ticket - ${moment(Date.now()).format("MMMM Do YYYY hh:mm:ss")}`
			)
			.setDescription([
				`> 👤 | **Ticket Owner**: ${message.author.toString()}`,
				`> 📋 | **Reason**: ${reason.substr(0, 2000)}`,
				"\nReact with `✔` to claim this ticket.",
			]);
		const claimMsg = await channel.send(embed);
		claimMsg.react("✔");
		dm.send("> 🎫 | Ticket created! Support will be with you shortly.");

		const emojiCollector = await claimMsg
			.awaitReactions(emojiFilter, { max: 1, time: 864e5, errors: ["time"] })
			.catch((e) => new Collection<string, MessageReaction>());

		claimMsg.delete();
		if (!emojiCollector.size)
			return dm.send(
				"> 😢 | No one was able to claim your ticket, please open a new one if you wish to speak to a staff member."
			);
		const first = emojiCollector.first();
		const claimer = first.users.cache.find((u) => !u.bot);
		const ticketChannel = await this.createChannel(
			message.author.id,
			claimer.id,
			channel.guild
		);
		const ticketEmbed = new MessageEmbed()
			.setColor("#9295F8")
			.setTitle(`Ticket claimer: ${claimer.tag}`)
			.setDescription([
				`> 👤 | **Ticket Owner**: ${message.author.toString()}`,
				`> 📋 | **Reason**: ${reason.substr(0, 2000)}`,
			]);
		ticketChannel.send(ticketEmbed);
		dm.send(
			`> 🔔 | **${claimer.tag}** claimed your ticket, you should receive a response shortly.`
		).catch((e) => null);
	}

	async createChannel(id: string, claimer: string, guild: Guild) {
		const channel = await guild.channels.create(`${id}-ticket`, {
			type: "text",
			topic: `${claimer}|Do not edit this channel, doing so might result in a broken ticket!`,
			permissionOverwrites: [
				{
					id: claimer,
					allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
				},
				{
					id: guild.id,
					deny: ["VIEW_CHANNEL"],
				},
			],
		});

		await new ticketsSchema({
			id,
			claimer,
			channel: channel.id,
		}).save();

		return channel;
	}
}
