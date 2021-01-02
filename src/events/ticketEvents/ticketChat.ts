import {
	GuildMember,
	Message,
	NewsChannel,
	TextChannel,
	User,
} from "discord.js";
import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";

const timeouts: Map<string, number> = new Map();

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("message");
	}

	async run(client: DiscordClient, message: Message) {}
}
