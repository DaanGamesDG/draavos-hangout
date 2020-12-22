import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';
import { systemLog } from "../../../config";
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import fetch from "node-fetch";
import moment from 'moment';

const baseURL1 = "https://verify.eryn.io/api/user/";
const baseURL2 = "https://api.blox.link/v1/user/";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("guildMemberAdd");
  }

  async run(client: DiscordClient, member: GuildMember) {
    const channel = (member.guild.channels.cache.get(systemLog) || client.channels.fetch(systemLog)) as TextChannel;

    const acc1 = await (await fetch(baseURL1 + member.id)).json();
    const acc2 = await (await fetch(baseURL2 + member.id)).json();
    let kicked: boolean = false;

    if (
      (acc1.status === "error", acc1.errorCode === 404) 
      && (acc2.error === "This user is not linked with Bloxlink.", acc2.status == "error")
      &&  (Date.now() - member.user.createdTimestamp) < 1296000000
      && !member.user.bot
    ) {
      const reason = "User is created within 15 days, no connected roblox account to discord account - invalid user";

      await member.send(`> 👞 | **Automatic kick - Draavo's Hangout**\n> 📃 | Reason: **${reason}**\n\n> 👋 | **Want to join back?** \n Make sure to connect a roblox account to your discord using bloxlink or Rover to become a valid user! http://www.draavo.cf/discord`)
        .catch(e => null);

      member.kick("User created <15 days ago, no accounts connected to user.")
        .catch(e => console.log(e));
      kicked = true;
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

    channel.send(embed);
  }
}