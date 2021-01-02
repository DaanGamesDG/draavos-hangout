import { Schema, model } from "mongoose";

const reqString = {
	type: String,
	required: true,
};

export const ticketsSchema = model(
	"tickets",
	new Schema({
		id: reqString,
		claimer: reqString,
		channel: reqString,
	})
);
