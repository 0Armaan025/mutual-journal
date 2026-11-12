export type JournalRef = { shareId: string; title: string; color: string };

export type Reply = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type Reaction = {
  emoji: string;
  users: string[];
};

export type Version = {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Doc = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  pinned: boolean;
  reactions: Reaction[];
  replies: Reply[];
  versions: Version[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Answer = {
  author: string;
  content: string;
  createdAt: string;
};

export type Prompt = {
  id: string;
  question: string;
  author: string;
  answers: Answer[];
  createdAt: string;
};

export type JournalData = {
  shareId: string;
  title: string;
  color: string;
  createdAt: string;
  docs: Doc[];
  prompts: Prompt[];
  presence: { name: string; at: string }[];
  migrated?: boolean;
};

export type FeedItem = {
  journal: { shareId: string; title: string; color: string };
  doc: Doc;
};

export type SearchHit = {
  kind: "journal" | "doc" | "prompt";
  journal: { shareId: string; title: string; color: string };
  author: string;
  text: string;
  createdAt: string;
  id: string;
};
