import BaseEvent from "../../utils/structures/baseEvent";
import DiscordClient from "../../client/client";
import { muteRole, systemLog, systemLogPublic } from "../../../config";
import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import fetch from "node-fetch";
import moment from "moment";
import { tempbanSchema } from "../../utils/database/tempban";
import { muteSchema } from "../../utils/database/mute";
import ms from "ms";

const baseURL1 = "https://verify.eryn.io/api/user/";
const baseURL2 = "https://api.blox.link/v1/user/";
const invalidJoins = new Map<string, number>();

export default class guildMemberAddEvent extends BaseEvent {
	constructor() {
		super("guildMemberAdd");
	}

	async run(client: DiscordClient, member: GuildMember) {
		const channel = (member.guild.channels.cache.get(systemLog) ||
			client.channels.fetch(systemLog)) as TextChannel;

		const msg = await channel.send(
			`> ${client.utils.EmojiFinder("loading").toString()} | Checking **${
				member.user.tag
			}**, do **not** kick this user.`
		);

		//const acc1 = await (await fetch(baseURL1 + member.id)).json();
		const acc2 = await (await fetch(baseURL2 + member.id)).json();
		let kicked: boolean = false;

		if (
			//(acc1.status === "error", acc1.errorCode === 404) &&
			acc2.error &&
			acc2.status == "error" &&
			Date.now() - member.user.createdTimestamp < 1296e6 &&
			!member.user.bot &&
			(!member.user.displayAvatarURL().includes(".gif") ||
				!member.user.tag.includes("0001") ||
				!member.user.tag.includes("9999") ||
				!member.user.tag.includes("6666") ||
				!member.user.tag.includes("0003"))
		) {
			const joins =
				invalidJoins.get(member.id) ||
				invalidJoins.set(member.id, 1).get(member.id);
			if (joins > 2) {
				const reason =
					"Joining for the third time after 2 kicks because account is created <15 days ago.";
				const duration =
					1296000000 - (Date.now() - member.user.createdTimestamp);

				const schema = await new tempbanSchema({
					guildId: member.guild.id,
					moderator: client.user.id,
					id: member.id,
					endDate: Date.now() + duration,
					duration,
				})
					.save()
					.catch((e) => {
						console.log(e);
						return null;
					});
				await member.guild.members
					.ban(member, { reason: `${client.user.id}|tempban|${reason}` })
					.catch((e) => {
						console.log(e);
					});

				invalidJoins.delete(member.id);
				msg.delete();

				return setTimeout(() => {
					member.guild.members.unban(
						member,
						`${client.user.id}|automatic unban from tempban made ${ms(
							duration
						)} ago by ${client.user.tag}`
					);
					schema ? schema.delete() : null;
				}, duration);
			}

			const reason =
				"Apologies, however your account is too young to be in Draavo's Hangout. Please join back when your account is at least 15 days old. We kick young accounts to prevent alts - Please only use the link below after your account is at least 15 days old. Rejoining after several kicks may result in a temporary ban!";

			await member
				.send(
					`> 👞 | **Automatic kick - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 👋 | **Want to join back?** \n Make sure to connect a roblox account to your discord using bloxlink or Rover to become a valid user! http://www.draavo.cf/discord`
				)
				.catch((e) => null);

			member
				.kick("User created <15 days ago, no accounts connected to user.")
				.catch((e) => console.log(e));
			kicked = true;
			invalidJoins.set(member.id, joins + 1);
		}

		const creationDate = `${moment(member.user.createdTimestamp).format(
			"LT"
		)} ${moment(member.user.createdTimestamp).format("LL")} | ${moment(
			member.user.createdTimestamp
		).fromNow()}`;
		const bool =
			acc2.status !== "error"
				? client.utils.EmojiFinder("greentick").toString()
				: client.utils.EmojiFinder("redtick").toString();

		const embed = new MessageEmbed().setFooter(`ID: ${member.id}`);

		if (!kicked) {
			embed
				.setColor("#58DCAE")
				.setTitle("Member joined: " + member.user.tag)
				.setDescription([
					`> 👤 | **User**: ${member.toString()}`,
					`> 📆 | **Creation date**: ${creationDate}`,
					`> 🎮 | **Connected account**: ${bool}`,
					`> 📊 | **Status**: \`valid\``,
				]);
		} else {
			embed
				.setColor("#DC5E55")
				.setTitle("Member joined & kicked: " + member.user.tag)
				.setDescription([
					`> 👤 | **User**: ${member.toString()}`,
					`> 📆 | **Creation date**: ${creationDate}`,
					`> 🎮 | **Connected account**: ${bool}`,
					`> 📊 | **Status**: \`invalid - kicked\``,
				]);
		}

		msg.edit("", embed);

		if (!member.user.bot) this.welcome(client, member);

		const data = await muteSchema.findOne({
			id: member.id,
			guildId: member.guild.id,
		});
		if (!data) return;

		const duration = (data.get("endDate") as number) - Date.now();
		const guild = client.guilds.cache.get(data.get("guildId"));

		if (duration <= 0) {
			const moderator =
				client.users.cache.get(data.get("moderator")) ||
				(await client.users.fetch(data.get("moderator")));
			const member = await (
				guild.members.cache.get(data.get("id")) ||
				(await guild.members.fetch(data.get("id")))
			).roles.remove(
				muteRole,
				`${data.get("moderator")}|automatic unmute from mute made ${ms(
					data.get("duration") as number
				)} ago by ${moderator.tag}`
			);

			client.emit(
				"muteEvent",
				"unmute",
				member,
				moderator,
				`automatic unmute from made ${ms(
					data.get("duration") as number
				)} ago by ${moderator.tag}`
			);
			data.delete();
		} else {
			setTimeout(async () => {
				data.delete();
				const moderator =
					client.users.cache.get(data.get("moderator")) ||
					(await client.users.fetch(data.get("moderator")));
				const member =
					guild.members.cache.get(data.get("id")) ||
					(await guild.members.fetch(data.get("id")));
				if (member)
					member.roles.remove(
						muteRole,
						`${data.get("moderator")}|automatic unmute from mute made ${ms(
							data.get("duration") as number
						)} ago by ${moderator.tag}`
					);

				client.emit(
					"muteEvent",
					"unmute",
					member ? member : data.get("id"),
					moderator,
					`automatic unmute from mute made ${ms(
						data.get("duration") as number
					)} ago by ${moderator.tag}`
				);
			}, duration);
		}
	}

	async welcome(client: DiscordClient, member: GuildMember) {
		const channel = (client.channels.cache.get(systemLogPublic) ||
			(await client.channels.fetch(systemLogPublic))) as TextChannel;
		const embed = new MessageEmbed()
			.setColor("#58DCAE")
			.setTitle(`Welcome to Draavo's Hangout, ${member.user.tag}`)
			.setDescription(
				`There are now **${member.guild.memberCount}** members in this server. Don't forget to say hi!`
			)
			.setFooter(
				"The APT has left a message for you: say Hi!",
				"https://cdn.discordapp.com/avatars/418223863047127050/a_d5eeb432a39f983872ab941f4be958f0.gif?size=4096"
			);

		channel.send(embed);
	}
}
