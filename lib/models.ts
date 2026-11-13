import { Schema, model, models } from "mongoose";

const ReactionSchema = new Schema(
  { emoji: { type: String, required: true }, users: { type: [String], default: [] } },
  { _id: false }
);

const ReplySchema = new Schema(
  { author: { type: String, required: true }, content: { type: String, required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const VersionSchema = new Schema(
  {
    author: { type: String, default: "" },
    title: { type: String, default: "Untitled" },
    content: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const DocSchema = new Schema(
  {
    title: { type: String, default: "Untitled" },
    content: { type: String, default: "" },
    mood: { type: String, default: null },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    reactions: { type: [ReactionSchema], default: [] },
    replies: { type: [ReplySchema], default: [] },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
    versions: { type: [VersionSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const EntrySchema = new Schema(
  {
    author: { type: String },
    content: { type: String },
    mood: { type: String, default: null },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    reactions: { type: [ReactionSchema], default: [] },
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AnswerSchema = new Schema(
  { author: { type: String, required: true }, content: { type: String, required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PromptSchema = new Schema(
  {
    question: { type: String, required: true },
    author: { type: String, required: true },
    answers: { type: [AnswerSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PresenceSchema = new Schema(
  { name: { type: String, required: true }, at: { type: Date, default: Date.now } },
  { _id: false }
);

const JournalSchema = new Schema(
  {
    title: { type: String, required: true },
    shareId: { type: String, required: true, unique: true, index: true },
    color: { type: String, default: "amber" },
    docs: { type: [DocSchema], default: [] },
    // legacy: pre-document journals stored append-only entries; migrated on read
    entries: { type: [EntrySchema], default: [] },
    prompts: { type: [PromptSchema], default: [] },
    presence: { type: [PresenceSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Journal = models.Journal ?? model("Journal", JournalSchema);
