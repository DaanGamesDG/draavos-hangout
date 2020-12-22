import { Schema, model } from "mongoose";

const reqString = { 
  type: String,
  required: true,
};

export const tempbanSchema = model("tempban", new Schema({
  id: reqString,
  guildId: reqString,
  moderator: reqString,
  duration: { type: Number, required: true },
  endDate: { type: Number, required: true },
}))