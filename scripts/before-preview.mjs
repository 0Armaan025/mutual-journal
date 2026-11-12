import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";

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

try {
  if (!(await waitForServer())) throw new Error("server did not start");

  const mk = async (title) => {
    const r = await fetch(BASE + "/api/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    return (await r.json()).shareId;
  };

  const a = await mk("Us, 2026");
  await fetch(`${BASE}/api/journals/${a}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: "alice",
      content: "# Morning\n\nWoke before the alarm. Made **coffee**, watched the light come in.\n\n> Today: be gentle with the afternoon me.",
    }),
  });
  await fetch(`${BASE}/api/journals/${a}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "bob", content: "Rain all day. Read two chapters." }),
  });

  log("SEEDED");
  log("HOME", BASE + "/");
  log("JOURNAL", `${BASE}/journal/${a}`);
  log("JOURNAL_ID", a);
  log("PREVIEW_READY");
} catch (err) {
  log("SEED ERROR:", err);
  process.exitCode = 1;
}

process.on("SIGINT", async () => { server.kill(); await mongod.stop(); process.exit(0); });
process.on("SIGTERM", async () => { server.kill(); await mongod.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
