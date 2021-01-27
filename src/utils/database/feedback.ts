import { Schema, model } from "mongoose";

const reqString = {
	type: String,
	required: true,
};

export const feedback = model(
	"feedback",
	new Schema({
		message: reqString,
		guildId: reqString,
	})
);
