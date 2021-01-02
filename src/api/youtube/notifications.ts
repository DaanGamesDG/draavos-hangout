import { channelIds, DraavoMsg, seniorTeamMsg } from "../../../config";

// // setup notifier
// import YouTubeNotifier from "youtube-notification";
// const domain: string = "https://draavos-hangout.herokuapp.com";
// const notifier = new YouTubeNotifier({
// 	middleware: true,
// 	hubCallback: `${domain}/yt`,
// 	secret: "very_cool_secret",
// });

// notifier.on("notified", (data: Data) => {
// 	data.channel.id === "UCkMrp3dJhWz2FcGTzywQGWg"
// 		? send(
// 				DraavoMsg.replace(/{channelName}/g, data.channel.name).replace(
// 					/{link}/g,
// 					data.video.link
// 				),
// 				data.channel.id
// 		  )
// 		: send(
// 				seniorTeamMsg
// 					.replace(/{channelName}/g, data.channel.name)
// 					.replace(/{link}/g, data.video.link),
// 				data.channel.id
// 		  );
// });

// notifier.subscribe(channelIds);

// // setup web server for callback
// import https from "https";
// import express from "express";
// import { WebhookClient } from "discord.js";

// const webhook = new WebhookClient(ytId, ytToken);
// const webhookS = new WebhookClient(ytIdS, ytTokenS);
// const app = express();

// const server = https.createServer(app);

// app.use("/yt", notifier.listener());
// app.get("/", (req, res) => res.sendStatus(200));

// server.listen(process.env.PORT, () =>
// 	console.log("api online and listening to port " + process.env.PORT)
// );

// // interfaces
// interface Data {
// 	video: {
// 		id: string;
// 		title: string;
// 		link: string;
// 	};
// 	channel: {
// 		id: string;
// 		name: string;
// 		link: string;
// 	};
// 	published: Date;
// 	updated: Date;
// }

// // functions
// function send(message: string, id: string) {
// 	id === "UCkMrp3dJhWz2FcGTzywQGWg"
// 		? webhook.send(message).catch((e) => console.log(e))
// 		: webhookS.send(message).catch((e) => console.log(e));
// }

// setInterval(() => fetch(domain), 1e4);

import { WebhookClient } from "discord.js";
import Parser from "rss-parser";

const webhook = new WebhookClient(process.env.YTID, process.env.YTTOKEN);
const webhookS = new WebhookClient(process.env.YTIDS, process.env.YTTOKENS);
const parser = new Parser();
const links: string[] = [];

setInterval(() => {
	const time = Date.now();
	channelIds.forEach(async (id) => {
		const data = await parser.parseURL(
			`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`
		);
		const items = data.items.sort((a, b) => {
			let aPubDate = new Date(a.pubDate || 0).getTime();
			let bPubDate = new Date(b.pubDate || 0).getTime();
			return bPubDate - aPubDate;
		});

		if (
			links.includes(items[0].link) ||
			time - new Date(items[0].pubDate).getTime() > 6e5
		)
			return;

		links.push(items[0].link);
		data.title === "Draavo"
			? send(
					DraavoMsg.replace(/{channelName}/g, data.title).replace(
						/{link}/g,
						items[0].link
					),
					data.title
			  )
			: send(
					seniorTeamMsg
						.replace(/{channelName}/g, data.title)
						.replace(/{link}/g, items[0].link),
					data.title
			  );
	});
}, 6e4);

function send(message: string, id: string) {
	id === "Draavo"
		? webhook.send(message).catch((e) => console.log(e))
		: webhookS.send(message).catch((e) => console.log(e));
}
