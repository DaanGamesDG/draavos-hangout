import {
	channelIds,
	DraavoMsg,
	seniorTeamMsg,
	ytId,
	ytToken,
	ytIdS,
	ytTokenS,
} from "../../../config";
import fetch from "node-fetch";

// setup notifier
import YouTubeNotifier from "youtube-notification";
const domain: string = "https://draavos-hangout.herokuapp.com";
const notifier = new YouTubeNotifier({
	hubCallback: `${domain}/yt`,
	secret: "very_cool_secret",
});

notifier.on("notified", (data: Data) => {
	data.channel.id === "UCkMrp3dJhWz2FcGTzywQGWg"
		? send(
				DraavoMsg.replace(/{channelName}/g, data.channel.name).replace(
					/{link}/g,
					data.video.link
				),
				data.channel.id
		  )
		: send(
				seniorTeamMsg
					.replace(/{channelName}/g, data.channel.name)
					.replace(/{link}/g, data.video.link),
				data.channel.id
		  );
});

notifier.subscribe(channelIds);

// setup web server for callback
import https from "https";
import express from "express";
import { WebhookClient } from "discord.js";

const webhook = new WebhookClient(ytId, ytToken);
const webhookS = new WebhookClient(ytIdS, ytTokenS);
const app = express();

const server = https.createServer(app);

app.use("/yt", notifier.listener());
app.get("/", (req, res) => res.sendStatus(200));

server.listen(process.env.PORT, () =>
	console.log("api online and listening to port " + process.env.PORT)
);

// interfaces
interface Data {
	video: {
		id: string;
		title: string;
		link: string;
	};
	channel: {
		id: string;
		name: string;
		link: string;
	};
	published: Date;
	updated: Date;
}

// functions
function send(message: string, id: string) {
	id === "UCkMrp3dJhWz2FcGTzywQGWg"
		? webhook.send(message).catch((e) => console.log(e))
		: webhookS.send(message).catch((e) => console.log(e));
}

setInterval(() => fetch(domain), 1e4);
