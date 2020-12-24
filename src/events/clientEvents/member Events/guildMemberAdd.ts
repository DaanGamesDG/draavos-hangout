import BaseEvent from '../../../utils/structures/BaseEvent';
import DiscordClient from '../../../client/client';
import { systemLog } from "../../../../config";
import { ClientVoiceManager, GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import fetch from "node-fetch";
import moment from 'moment';
import { tempbanSchema } from '../../../utils/database/tempban';
import ms from 'ms';

const baseURL1 = "https://verify.eryn.io/api/user/";
const baseURL2 = "https://api.blox.link/v1/user/";
const invalidJoins = new Map<string, number>();

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("guildMemberAdd");
  }

  async run(client: DiscordClient, member: GuildMember) {
    const channel = (member.guild.channels.cache.get(systemLog) || client.channels.fetch(systemLog)) as TextChannel;

    const msg = await channel.send(`> ${client.utils.EmojiFinder("loading").toString()} | Checking **${member.user.tag}**, do **not** kick this user.`);
    const acc1 = await (await fetch(baseURL1 + member.id)).json();
    const acc2 = await (await fetch(baseURL2 + member.id)).json();
    let kicked: boolean = false;

    if (
      (acc1.status === "error", acc1.errorCode === 404) 
      && (acc2.error === "This user is not linked with Bloxlink.", acc2.status == "error")
      &&  (Date.now() - member.user.createdTimestamp) < 1296e6
      //&& !member.user.bot
    ) {
      const joins = invalidJoins.get(member.id) || invalidJoins.set(member.id, 1).get(member.id);
      if (joins > 2) {
        const reason = "Joining for the third time after 2 kicks because account is created <15 days ago.";
        const duration =  1296000000 - (Date.now() - member.user.createdTimestamp);

        const schema = await new tempbanSchema({ guildId: member.guild.id, moderator: client.user.id, id: member.id, endDate: Date.now() + duration, duration }).save()
          .catch(e => { console.log(e); return null });
        await member.guild.members.ban(member, { reason: `${client.user.id}|tempban|${reason}` })
          .catch(e => { console.log(e) });
        
        invalidJoins.delete(member.id);
        msg.delete();

        return setTimeout(() => {
          member.guild.members.unban(member, `${client.user.id}|automatic unban from tempban made ${ms(duration)} ago by ${client.user.tag}`);
          schema ? schema.delete() : null;
        }, duration);
      }

      const reason = "Apologies, however your account is too young to be in Draavo's Hangout. Please join back when your account is at least 15 days old. We kick young accounts to prevent alts - Please only use the link below after your account is at least 15 days old. Rejoining after several kicks may result in a temporary ban!";

      await member.send(`> 👞 | **Automatic kick - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 👋 | **Want to join back?** \n Make sure to connect a roblox account to your discord using bloxlink or Rover to become a valid user! http://www.draavo.cf/discord`)
        .catch(e => null);

      member.kick("User created <15 days ago, no accounts connected to user.")
        .catch(e => console.log(e));
      kicked = true;
      invalidJoins.set(member.id, joins + 1);
    };

    const creationDate = `${moment(member.user.createdTimestamp).format('LT')} ${moment(member.user.createdTimestamp).format('LL')} | ${moment(member.user.createdTimestamp).fromNow()}`;
    const bool = acc1.status !== "error" ? client.utils.EmojiFinder("greentick").toString() : acc2.status !== "error" ? client.utils.EmojiFinder("greentick").toString() : client.utils.EmojiFinder("redtick").toString();
    
    const embed = new MessageEmbed()

    if (!kicked) {
      embed
      .setColor("#58DCAE")
      .setTitle("Member joined")
      .setDescription([
        `> 👤 | **User**: ${member.toString()}`,
        `> 📆 | **Creation date**: ${creationDate}`,
        `> 🎮 | **Connected account**: ${bool}`,
        `> 📊 | **Status**: \`valid\``,
      ]);
    } else {
      embed
      .setColor("#DC5E55")
      .setTitle("Member joined & kicked")
      .setDescription([
        `> 👤 | **User**: ${member.toString()}`,
        `> 📆 | **Creation date**: ${creationDate}`,
        `> 🎮 | **Connected account**: ${bool}`,
        `> 📊 | **Status**: \`invalid - kicked\``,
      ]);
    }

    msg.edit("", embed);
  }
}