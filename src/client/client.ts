import { Client, ClientOptions, Collection } from "discord.js";
import BaseCommand from "../utils/structures/baseCommand";
import BaseEvent from "../utils/structures/baseEvent";
import Utils from "../utils/extensions/utils/utils";
import { Options } from "./interfaces";
import { promises as fs } from "fs";
import mongoose from "mongoose";
import path from "path";

export default class DiscordClient extends Client {
	private commandsDir: string;
	private eventsDir: string;
	private dbEventsDir: string;
	private dbUrl: string;

	private _commands = new Collection<string, BaseCommand>();
	private _cs = new Collection<string, BaseCommand>();
	private _events = new Collection<string, BaseEvent>();

	public utils: Utils = new Utils(this);
	public owners: string[] = [];
	public baseDir: string;

	public constructor(options: Options, clientOptions: ClientOptions = {}) {
		super(clientOptions);

		this.commandsDir = options.commandsDir;
		this.eventsDir = options.eventsDir;
		this.baseDir = options.baseDir;

		this.dbEventsDir = options.dbEventsDir || null;
		this.dbUrl = options.dbUrl || null;
		this.owners = options.owners || null;
	}

	// public functions
	public async start(token: string): Promise<void> {
		await this.loadEvents();
		await this.loadCommands();
		this.login(token);
	}

	public async connect(): Promise<void> {
		await mongoose
			.connect(this.dbUrl, {
				useUnifiedTopology: true,
				useNewUrlParser: true,
				useCreateIndex: true,
				useFindAndModify: false,
			})
			.catch((e) => console.log(e))
			.then(() => console.log("Connected to database"));
	}

	// get functions
	get commands(): Collection<string, BaseCommand> {
		return this._commands;
	}
	get cs(): Collection<string, BaseCommand> {
		return this._cs;
	}
	get events(): Collection<string, BaseEvent> {
		return this._events;
	}
	get prefix(): string {
		return process.env.DISCORD_BOT_PREFIX;
	}

	// private functions
	private async loadCommands(dir: string = this.commandsDir): Promise<void> {
		const filePath = path.join(this.baseDir, dir);
		const files = await fs.readdir(filePath);
		for (const file of files) {
			const stat = await fs.lstat(path.join(filePath, file));
			if (stat.isDirectory()) this.loadCommands(path.join(dir, file));
			if (file.endsWith(".js") || file.endsWith(".ts")) {
				const { default: Command } = await import(path.join(filePath, file));
				const command = new Command();
				this.commands.set(command.name, command);
				this.cs.set(command.name, command);
				command.options.aliases.forEach((alias: string) => {
					this.commands.set(alias, command);
				});
			}
		}
	}

	private async loadEvents(dir: string = this.eventsDir): Promise<void> {
		const filePath = path.join(this.baseDir, dir);
		const files = await fs.readdir(filePath);
		for (const file of files) {
			const stat = await fs.lstat(path.join(filePath, file));
			if (stat.isDirectory()) this.loadEvents(path.join(dir, file));
			if (file.endsWith(".js") || file.endsWith(".ts")) {
				const { default: Event } = await import(path.join(filePath, file));
				const event = new Event();
				this.events.set(event.getName(), event);
				this.on(event.getName(), event.run.bind(event, this));
			}
		}
	}
}
