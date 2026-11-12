import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import mongoose from "mongoose";

const log = (...a) => console.log(...a);

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri("mj-preview");
log("mongod:", uri);

const server = spawn("npx", ["next", "start", "-p", "3200"], {
  env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stderr.on("data", (d) => process.stderr.write("[next] " + d));

const BASE = "http://127.0.0.1:3200";
async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE + "/")).ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const j = (o) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });

try {
  if (!(await waitForServer())) throw new Error("server did not start");

  const mk = async (title, color) => {
    const r = await fetch(BASE + "/api/journals", j({ title, color }));
    return (await r.json()).shareId;
  };

  const a = await mk("Us, 2026", "amber");
  const b = await mk("Morning pages", "sage");
  const c = "legacy001";

  // journal A: starter doc + linked docs
  const aData = await (await fetch(`${BASE}/api/journals/${a}`)).json();
  const doc1 = aData.docs[0];

  await fetch(`${BASE}/api/journals/${a}/docs/${doc1.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: "alice",
      title: "The first morning",
      mood: "😊",
      tags: ["gratitude"],
      content: `# The first morning

Woke before the alarm. Made **coffee** and watched the light come in over the rooftops.

- oatmeal with honey
- a long walk, no podcast

> Today, be gentle with the afternoon me.

Related: [[Rainy tuesday]] · #slow`,
    }),
  });

  const doc2 = await (await fetch(`${BASE}/api/journals/${a}/docs`, j({ author: "bob", title: "Rainy tuesday" }))).json();
  await fetch(`${BASE}/api/journals/${a}/docs/${doc2.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: "bob",
      mood: "🌧",
      content: `Rain all day. Read two chapters of *The Overstory* and felt quietly jealous of trees.

\`\`\`js
const rain = 'soft';
console.log(rain);
\`\`\`

| day | mood |
| --- | ---- |
| mon | calm |
| tue | busy |

See also [[The first morning]]. #weather`,
    }),
  });

  const doc3 = await (await fetch(`${BASE}/api/journals/${a}/docs`, j({ author: "alice", title: "Things we keep forgetting" }))).json();
  await fetch(`${BASE}/api/journals/${a}/docs/${doc3.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "alice", content: "- water the plants\n- call mum\n- re-read [[The first morning]] on bad days\n\n#lists #life" }),
  });
  await fetch(`${BASE}/api/journals/${a}/docs/${doc3.id}/pin`, j({ pinned: true }));
  await fetch(`${BASE}/api/journals/${a}/docs/${doc1.id}/reactions`, j({ emoji: "❤️", author: "bob" }));
  await fetch(`${BASE}/api/journals/${a}/docs/${doc1.id}/reactions`, j({ emoji: "😂", author: "bob" }));
  await fetch(`${BASE}/api/journals/${a}/docs/${doc1.id}/replies`, j({ author: "bob", content: "the light was unreal — I saw it too" }));

  const prompt = await (await fetch(`${BASE}/api/journals/${a}/prompts`, j({ author: "bob", question: "What's one small thing that made you smile this week?" }))).json();
  await fetch(`${BASE}/api/journals/${a}/prompts/${prompt.id}/answers`, j({ author: "bob", content: "Fresh bread from the corner bakery, still warm." }));
  await fetch(`${BASE}/api/journals/${a}/prompts/${prompt.id}/answers`, j({ author: "alice", content: "A stranger's dog fell asleep on my foot on the train." }));

  // more history for the heatmap
  for (let i = 0; i < 5; i++) {
    const d = await (await fetch(`${BASE}/api/journals/${a}/docs`, j({ author: i % 2 ? "bob" : "alice", title: `Scratch note ${i + 1}` }))).json();
    await fetch(`${BASE}/api/journals/${a}/docs/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: i % 2 ? "bob" : "alice", content: `Steady, small joys on day ${i + 1}. #journal` }),
    });
  }

  // journal B
  await fetch(`${BASE}/api/journals/${b}/docs`, j({ author: "alice", title: "Just testing the waters" }));
  await fetch(`${BASE}/api/journals/${b}/docs`, j({ author: "bob", title: "First sip" }));

  // journal C: legacy entries journal (shows migration badge)
  await mongoose.connect(uri);
  await mongoose.connection.collection("journals").insertOne({
    title: "Old travel log",
    shareId: c,
    color: "clay",
    entries: [
      { author: "alice", content: "# Lisbon\n\nTiles, custard tarts, uphill both ways. #travel", mood: "✨", tags: ["travel"], pinned: false, reactions: [], replies: [], createdAt: new Date(), editedAt: null },
      { author: "bob", content: "The train to Porto — best four hours of the year.", mood: "🥰", tags: [], pinned: false, reactions: [], replies: [], createdAt: new Date(), editedAt: null },
    ],
    prompts: [],
    docs: [],
    createdAt: new Date(),
  });
  await mongoose.disconnect();

  log("SEEDED");
  log("HOME", BASE + "/");
  log("JOURNAL_A", `${BASE}/journal/${a}`);
  log("JOURNAL_B", `${BASE}/journal/${b}`);
  log("JOURNAL_C_LEGACY", `${BASE}/journal/${c}`);
  log("JOURNAL_ID", a);
  log("DOC2", doc2.id);
  log("SEARCH", `${BASE}/search?q=morning`);
  log("PREVIEW_READY");
} catch (err) {
  log("SEED ERROR:", err);
  process.exitCode = 1;
}

process.on("SIGINT", async () => { server.kill(); await mongod.stop(); process.exit(0); });
process.on("SIGTERM", async () => { server.kill(); await mongod.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
