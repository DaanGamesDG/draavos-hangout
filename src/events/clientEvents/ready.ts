import BaseEvent from '../../utils/structures/BaseEvent';
import DiscordClient from '../../client/client';
import { tempbanSchema } from "../../utils/database/tempban";
import ms from "ms";

export default class MessageEvent extends BaseEvent {
  constructor() {
    super("ready");
  }

  async run(client: DiscordClient) {
    console.log(`${client.user.tag} has logged in!`);

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
  }
}