import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';
import { tempbanSchema } from "../../utils/database/tempban";
import { muteSchema } from "../../utils/database/mute";
import Parser from "rss-parser";
import ms from "ms";
import { muteRole } from '../../../config';

const parser = new Parser();

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("ready");
  }

  async run(client: DiscordClient) {
    console.log(`${client.user.tag} has logged in!`);
    //this.videoAnnouncement(client);

    (await tempbanSchema.find()).forEach(b => {
      const duration = (b.get("endDate") as number) - Date.now();
      const guild = client.guilds.cache.get(b.get("guildId"));

      if (duration <= 0) {
        guild.members.unban(b.get("id"));
        b.delete();
      } else {
        setTimeout(async () => {
          const moderator = client.users.cache.get(b.get("moderator")) || await client.users.fetch(b.get("moderator"));
          guild.members.unban(b.get("id"), `${b.get("moderator")}|automatic unban from tempban made ${ms(b.get("duration") as number)} ago by ${moderator.tag}`);
          b.delete();
        }, duration);
      };
    });

    (await muteSchema.find()).forEach(async m => {
      const duration = (m.get("endDate") as number) - Date.now();
      const guild = client.guilds.cache.get(m.get("guildId"));

      if (duration <= 0) {
        const moderator = client.users.cache.get(m.get("moderator")) || await client.users.fetch(m.get("moderator"));
        const member = await (guild.members.cache.get(m.get("id")) || await guild.members.fetch(m.get("id")))
          .roles.remove(muteRole, `${m.get("moderator")}|automatic unmute from mute made ${ms(m.get("duration") as number)} ago by ${moderator.tag}`);

        client.emit("muteEvent", "unmute", member, moderator, `automatic unmute from made ${ms(m.get("duration") as number)} ago by ${moderator.tag}`);
        m.delete();
      } else {
        setTimeout(async () => {
          const moderator = client.users.cache.get(m.get("moderator")) || await client.users.fetch(m.get("moderator"));
          const member = await (guild.members.cache.get(m.get("id")) || await guild.members.fetch(m.get("id")))
            .roles.remove(muteRole, `${m.get("moderator")}|automatic unmute from mute made ${ms(m.get("duration") as number)} ago by ${moderator.tag}`);

          client.emit("muteEvent", "unmute", member, moderator, `automatic unmute from mute made ${ms(m.get("duration") as number)} ago by ${moderator.tag}`);
          m.delete();
        }, duration);
      };
    });
  }

  async videoAnnouncement(client: DiscordClient) {
    const url: string = "https://www.youtube.com/feeds/videos.xml?channel_id=UCkMrp3dJhWz2FcGTzywQGWg";
    console.log(await parser.parseURL(url));
  }
}