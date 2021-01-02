// setup notifier
import YouTubeNotifier from "youtube-notification";
import { WebhookClient } from "discord.js";
import { channelIds, DraavoMsg, seniorTeamMsg } from "../../config";

const webhook = new WebhookClient(process.env.YTID, process.env.YTTOKEN);
const webhookS = new WebhookClient(process.env.YTIDS, process.env.YTTOKENS);

const notifier = new YouTubeNotifier({
	hubCallback: "https://draavos-hangout.herokuapp.com/yt",
	secret: "very_cool_secret",
});

notifier.on("notified", (data) => {
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

notifier.unsubscribe(channelIds);

// setup web server for callback
import express from "express";
import fetch from "node-fetch";
const app = express();

app.use("/yt", notifier.listener());
app.get("/", (req, res) => res.sendStatus(200));

app.listen(process.env.PORT, () =>
	console.log("api online and listening to port " + process.env.PORT)
);

setTimeout(() => notifier.subscribe(channelIds), 7e3);
setInterval(() => fetch("https://draavos-hangout.herokuapp.com/"), 6e5 * 10);

function send(message, id) {
	id === "UCkMrp3dJhWz2FcGTzywQGWg"
		? webhook.send(message).catch((e) => console.log(e))
		: webhookS.send(message).catch((e) => console.log(e));
}
