import { Schema, model } from "mongoose";

const reqString = { 
  type: String,
  required: true,
};

export const warnSchema = model("warn", new Schema({
  id: reqString,
  guildId: reqString,
  moderator: reqString,
  reason: reqString,
  case: reqString,
  date: { type: Number, required: true, default: Date.now() },
}));