import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import { MessageReaction, User } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { feedback } from "../../utils/database/feedback";

export default class messageReactionAddEvent extends BaseEvent {
	constructor() {
		super("messageReactionAdd");
	}

	async run(client: DiscordClient, reaction: MessageReaction, user: User) {
		if (reaction.partial) reaction = await reaction.fetch();
		if (reaction.message.partial) reaction.message = await reaction.message.fetch();
		if (user.partial) user = await user.fetch();
		if (!reaction.message.guild) return;

		// @ts-ignore
		const id = (await feedback.findOne({ guildId: reaction.message.guild.id })).toObject().message;
		if (reaction.message.id !== id || reaction.emoji.name !== "📋") return;
		// return console.log(
		// 	"wrong emoji",
		// 	//@ts-ignore
		// 	await (await feedback.findOne({ guildId: reaction.message.guild.id })).toObject().message,
		// 	reaction.emoji.name === "📋"
		// );

		try {
			const msg = await user.send(`> ⏳ | Searching for your feedback... please wait.`);
			const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
			doc.useApiKey(process.env.API_KEY);

			await doc.loadInfo();
			const sheet = doc.sheetsByIndex[0];
			const rows = await sheet.getRows();
			const data = rows.find((r) => r.discordID == user.id);
			const state = rows.find((r) => r.discordID == user.id);
			const feedback = data
				? `> 📋 | You **${state.passed}** this application session, here is your feedback: \`\`\`${
						(data.feedback as string).length > 850
							? (data.feedback as string).substr(0, 850 - 3) + "..."
							: (data.feedback as string)
				  }\`\`\` ❓ | Questions about the feedback? Open a ticket with the topic \`feedback question\` and a staff member will help you as soon as possible.`
				: "> 👤 | Sorry I didn't find your user id in the database, if you think I am wrong, please open a ticket and the staff team is happy to help!";

			return msg.edit(feedback);
		} catch (e) {
			return console.log(e);
		}
	}
}
