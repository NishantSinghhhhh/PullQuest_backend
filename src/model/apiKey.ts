// src/models/ApiKey.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IApiKey extends Document {
  userId: Types.ObjectId;      // reference back to your User
  secretKey: string;           // the actual API key
  context: string;             // any prompt or context string
  githubUsername: string;      // associated GitHub user/org
  position?: string;           // arbitrary “position” metadata
  repoLinks: string[];         // array of GitHub repo URLs
  orgName?: string;            // associated organization name
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
      unique: true,
    },
    context: {
      type: String,
      default: "",
    },
    githubUsername: {
      type: String,
      required: true,
    },
    position: {
      type: String,
    },
    repoLinks: {
      type: [String],
      default: [],
    },
    orgName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IApiKey>("ApiKey", apiKeySchema);