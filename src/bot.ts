import { config } from "dotenv";
config();

import DiscordClient from "./client/client";
import "./api/youtube/notifications";

const client = new DiscordClient(
  {
    dbUrl: process.env.DB_URL,
    baseDir: __dirname,
    commandsDir: "./commands",
    eventsDir: "./events/clientEvents",
    owners: ["304986851310043136"],
  },
  {
    disableMentions: "everyone",
    messageCacheLifetime: 864e5 * 7,
  },
);

(async () => {
  client.connect();
  client.start(process.env.DISCORD_BOT_TOKEN);
})()