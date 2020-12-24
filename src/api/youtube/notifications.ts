import { 
  channelIds, 
  DraavoMsg, 
  seniorTeamMsg, 
  ytId, ytToken, 
  ytIdS , 
  ytTokenS 
} from "../../../config";

// setup notifier
import YouTubeNotifier from "youtube-notification";
const domain: string = "";
const notifier = new YouTubeNotifier({
  hubCallback: `http://${domain}/yt`,
  secret: "very_cool_secret"
});


notifier.on('notified', (data: Data) => {
  data.channel.id === "UCkMrp3dJhWz2FcGTzywQGWg"
  ? send(DraavoMsg.replace(/{channelName}/g, data.channel.name).replace(/{link}/g, data.video.link), data.channel.id)
  : send(seniorTeamMsg.replace(/{channelName}/g, data.channel.name).replace(/{link}/g, data.video.link), data.channel.id);
});
 
notifier.subscribe(channelIds);

// setup web server for callback
import http from"https";
import express from"express";
import { WebhookClient } from "discord.js";

const webhook = new WebhookClient(ytId, ytToken);
const webhookS = new WebhookClient(ytIdS, ytTokenS);
const app = express();

const server = http.createServer(app);

app.use("/yt", notifier.listener());
server.listen(process.env.PORT, () =>
  console.log("api online and listening to port " + process.env.PORT)
);

// interfaces
interface Data {
  video: {
    id: string,
  	title: string,
    link: string,
  },
  channel: {
    id: string,
    name: string,
    link: string,
  },
  published: Date,
  updated: Date,
}

// functions
function send(message: string, id: string) {
  id === "UCkMrp3dJhWz2FcGTzywQGWg"
  ? webhook.send(message)
    .catch(e => console.log(e))
  : webhookS.send(message)
    .catch(e => console.log(e));
}