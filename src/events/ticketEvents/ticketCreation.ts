import {
	Collection,
	Guild,
	GuildMember,
	Message,
	MessageEmbed,
	MessageReaction,
	NewsChannel,
	TextChannel,
	User,
} from "discord.js";
import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import moment from "moment";

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("message");
	}

	async run(client: DiscordClient, message: Message) {
		const filter = (m: Message) => {
			return m.author.id === message.author.id && m.content.length > 0;
		};
		const emojiFilter = (reaction: MessageReaction, user: User) => {
			return reaction.emoji.name === "✔" && !user.bot;
		};

		const dm = await message.author.createDM();
		const check: Message = await dm
			.send(
				`> ❓ | Why do you want to open a ticket? Please describe it with as much detail as possible.`
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
				`New ticket - ${moment(Date.now()).format("MM Do YYYY hh:mm:ss")}`
			)
			.setDescription([
				`> 👤 | **Ticket Owner**: ${message.author.toString()}`,
				`> 📋 | **Reason**: ${reason.substr(0, 2000)}`,
				"\nReact with `✔` to claim this ticket.",
			]);

		const claimMsg = await channel.send(embed);
		claimMsg.react("✔");

		const emojiCollector = await claimMsg
			.awaitReactions(emojiFilter, { max: 1, time: 864e5, errors: ["time"] })
			.catch((e) => new Collection<string, MessageReaction>());

		if (!emojiCollector.size)
			return dm.send(
				"> 😢 | No one was able to claim your ticket, please open a new one if you wish to speak to a staff member."
			);

		const first = emojiCollector.first();
		const ticketChannel = await this.createChannel(
			message.author.id,
			first.users.cache.find((u) => !u.bot).id,
			channel.guild
		);

		const ticketEmbed = new MessageEmbed()
			.setColor("#9295F8")
			.setDescription([
				`> 👤 | **Ticket Owner**: ${message.author.toString()}`,
				`> 📋 | **Reason**: ${reason.substr(0, 2000)}`,
			]);
		ticketChannel.send(ticketEmbed);
	}

	async createChannel(id: string, claimer: string, guild: Guild) {
		return await guild.channels.create(`${id}-ticket`, {
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
	}
}
