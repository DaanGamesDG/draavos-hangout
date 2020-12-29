import {
	GuildMember,
	Message,
	NewsChannel,
	TextChannel,
	User,
} from "discord.js";
import BaseEvent from "../../utils/structures/BaseEvent";
import DiscordClient from "../../client/client";

export default class MessageEvent extends BaseEvent {
	constructor() {
		super("message");
	}

	async run(client: DiscordClient, message: Message, args: string[]) {}
}
