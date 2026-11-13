import http from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import mongoose from "mongoose";

const log = (...a) => console.log(...a);
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const PORT = 3100;
const HOST = "127.0.0.1";

function call(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined || body === null ? null : typeof body === "string" ? body : JSON.stringify(body);
    const headers = {};
    if (payload !== null) {
      headers["content-type"] = "application/json";
      headers["content-length"] = String(Buffer.byteLength(payload));
    }
    const req = http.request({ host: HOST, port: PORT, path, method, headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : null;
        } catch {
          json = null;
        }
        resolve({ status: res.statusCode, json, text: data });
      });
    });
    req.on("error", reject);
    req.end(payload);
  });
}

const j = (obj) => JSON.stringify(obj);
const J = (shareId) => `/api/journals/${shareId}`;

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri("mutual-journal-test");
log("mongod up:", uri);

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stderr.on("data", (d) => process.stderr.write("[next] " + d));

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await call("GET", "/");
      if (r.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

try {
  if (!(await waitForServer())) throw new Error("server did not start");

  // ---------- journals (journal is created with one starter document) ----------
  let res = await call("POST", "/api/journals", j({ title: "Us, 2026", color: "ocean" }));
  const journal = res.json.shareId;
  check("create journal", res.status === 200 && !!journal);

  res = await call("POST", "/api/journals", j({ title: "   " }));
  check("reject empty title", res.status === 400);

  res = await call("POST", "/api/journals", j({ title: "Morning" }));
  const journal2 = res.json.shareId;

  // ---------- documents ----------
  res = await call("GET", J(journal));
  let journalData = res.json;
  const starter = journalData.docs[0];
  check(
    "journal starts with one document",
    res.status === 200 && journalData.docs.length === 1 && starter.title === "Us, 2026",
    `docs=${journalData.docs.length}`
  );

  // edit the doc (the autosave path)
  res = await call("PATCH", `${J(journal)}/docs/${starter.id}`, j({ author: "alice", title: "The first morning", content: "# The first morning\n\nMade **coffee** and watched the light. #gratitude", mood: "😊", tags: ["slow"] }));
  const edited = res.json;
  check("edit doc (title/content/mood/tags)", res.status === 200 && edited.title === "The first morning" && edited.mood === "😊" && edited.updatedBy === "alice");

  res = await call("PATCH", `${J(journal)}/docs/${starter.id}`, j({ title: "hijack" }));
  check("doc edit requires author", res.status === 400);

  // create a second doc
  res = await call("POST", `${J(journal)}/docs`, j({ author: "bob", title: "Rainy tuesday" }));
  const doc2 = res.json;
  check("create second document", res.status === 200 && !!doc2.id && doc2.createdBy === "bob");

  res = await call("PATCH", `${J(journal)}/docs/${doc2.id}`, j({ author: "bob", content: "Rain all day. Linking to [[The first morning]] to test wikilinks." }));
  check("wikilink content saved", res.status === 200 && res.json.content.includes("[["));

  // ---------- version history ----------
  res = await call("PATCH", `${J(journal)}/docs/${doc2.id}`, j({ author: "bob", content: "Second draft of the rainy day." }));
  check("edit pushes a version snapshot", res.status === 200 && res.json.versions.length >= 1);
  const docWithVersions = res.json;
  const versionId = docWithVersions.versions[docWithVersions.versions.length - 1].id;
  check("version snapshot keeps old content", docWithVersions.versions.some((v) => v.content.includes("[[")));

  res = await call("POST", `${J(journal)}/docs/${doc2.id}/versions/${versionId}`, j({ author: "bob" }));
  const restored = res.json;
  check("restore version", res.status === 200 && restored.content.includes("[[") && restored.updatedBy === "bob");

  res = await call("POST", `${J(journal)}/docs/${doc2.id}/versions/65f000000000000000000000`, j({ author: "bob" }));
  check("restore unknown version → 404", res.status === 404);

  // ---------- presence ----------
  res = await call("POST", `${J(journal)}/presence`, j({ name: "alice" }));
  check("presence heartbeat", res.status === 200 && res.json.presence.some((p) => p.name === "alice"));
  res = await call("GET", J(journal));
  check("presence visible in journal payload", res.status === 200 && res.json.presence.some((p) => p.name === "alice"));

  // ---------- delete: only creator ----------
  res = await call("DELETE", `${J(journal)}/docs/${doc2.id}?author=alice`);
  check("only creator can delete doc → 403", res.status === 403);
  res = await call("DELETE", `${J(journal)}/docs/${doc2.id}?author=bob`);
  check("creator delete soft-trashes doc", res.status === 200 && res.json.trashed === true);

  // pin
  res = await call("POST", `${J(journal)}/docs/${starter.id}/pin`, j({}));
  check("star toggles on", res.status === 200 && res.json.pinned === true);
  res = await call("POST", `${J(journal)}/docs/${starter.id}/pin`, j({ pinned: false }));
  check("star toggles off", res.status === 200 && res.json.pinned === false);

  // reactions
  const react = (emoji, author) => call("POST", `${J(journal)}/docs/${starter.id}/reactions`, j({ emoji, author }));
  res = await react("❤️", "bob");
  check("react to doc", res.status === 200 && res.json.reactions[0].users.includes("bob"));
  res = await react("❤️", "bob");
  check("un-react removes it", res.status === 200 && res.json.reactions.length === 0);
  await react("❤️", "bob");
  res = await react("❤️", "alice");
  check("two users on same reaction", res.status === 200 && res.json.reactions[0].users.length === 2);

  // replies (comments)
  res = await call("POST", `${J(journal)}/docs/${starter.id}/replies`, j({ author: "bob", content: "this is lovely" }));
  const replyId = res.json.replies[0].id;
  check("comment on doc", res.status === 200 && !!replyId);
  res = await call("DELETE", `${J(journal)}/docs/${starter.id}/replies?author=alice&replyId=${replyId}`);
  check("only comment author can delete → 403", res.status === 403);
  res = await call("DELETE", `${J(journal)}/docs/${starter.id}/replies?author=bob&replyId=${replyId}`);
  check("comment author deletes comment", res.status === 200 && res.json.replies.length === 0);

  // delete: soft delete to trash by default
  res = await call("DELETE", `${J(journal)}/docs/${doc2.id}?author=bob`);
  check("delete moves doc to trash", res.status === 200 && res.json.trashed === true);

  res = await call("GET", J(journal));
  check("trashed doc leaves the document list", res.json.docs.some((d) => d.id === doc2.id) === false && res.json.trash.some((d) => d.id === doc2.id));

  res = await call("POST", `${J(journal)}/docs/${doc2.id}/trash?author=bob`);
  check("restore from trash", res.status === 200 && res.json.deleted === false);

  res = await call("GET", J(journal));
  check("restored doc returns to the list", res.json.docs.some((d) => d.id === doc2.id));

  res = await call("DELETE", `${J(journal)}/docs/${doc2.id}?author=bob&forever=1`);
  check("permanent delete", res.status === 200);
  res = await call("GET", J(journal));
  check("permanently deleted doc is gone", !res.json.docs.some((d) => d.id === doc2.id) && !res.json.trash.some((d) => d.id === doc2.id));

  // ---------- prompts ----------
  res = await call("POST", `${J(journal)}/prompts`, j({ author: "bob", question: "One small good thing this week?" }));
  const p1 = res.json.id;
  check("ask prompt", res.status === 200 && !!p1);
  res = await call("POST", `${J(journal)}/prompts/${p1}/answers`, j({ author: "alice", content: "Fresh bread." }));
  check("answer prompt", res.status === 200 && res.json.answers.length === 1);
  res = await call("POST", `${J(journal)}/prompts/${p1}/answers`, j({ author: "alice", content: "Fresh bread, twice." }));
  check("answer upserts (one per person)", res.status === 200 && res.json.answers.length === 1 && res.json.answers[0].content.includes("twice"));
  res = await call("DELETE", `${J(journal)}/prompts/${p1}?author=alice`);
  check("only prompt author can delete → 403", res.status === 403);

  // ---------- rename / delete ----------
  res = await call("PATCH", J(journal), j({ title: "Us, 2026 (renamed)" }));
  check("rename journal", res.status === 200 && res.json.title.includes("renamed"));

  // ---------- feed ----------
  res = await call("POST", `${J(journal2)}/docs`, j({ author: "alice", title: "Waters" }));
  res = await call("GET", `/api/feed?ids=${journal},${journal2}`);
  const feed = res.json;
  check(
    "feed returns docs + totals",
    res.status === 200 && feed.items.length >= 2 && feed.totals.docs >= 2 && feed.totals.journals === 2,
    `totals=${JSON.stringify(feed.totals)}`
  );
  check("feed items are docs with titles", feed.items.every((i) => typeof i.doc.title === "string"));

  // ---------- search ----------
  res = await call("GET", "/api/search?q=morning");
  check("search finds doc by content/title", res.status === 200 && res.json.hits.some((h) => h.kind === "doc"));

  // ---------- export ----------
  res = await call("GET", `${J(journal)}/export?format=md`);
  check("export markdown contains doc titles", res.status === 200 && res.text.includes("The first morning") && res.text.includes("Prompts"));
  res = await call("GET", `${J(journal)}/export?format=json`);
  check("export json parses with docs", res.status === 200 && res.json.docs.length === 1 && res.json.prompts.length === 1);

  // ---------- legacy migration: entries-only journal folds into docs ----------
  await mongoose.connect(uri);
  await mongoose.connection.collection("journals").insertOne({
    title: "Old journal",
    shareId: "legacy0001",
    color: "amber",
    entries: [
      { author: "alice", content: "# Old morning\n\nBack when we wrote entries.", mood: "😊", tags: ["memory"], pinned: false, reactions: [], replies: [], createdAt: new Date(), editedAt: null },
      { author: "bob", content: "Rain then too.", mood: null, tags: [], pinned: false, reactions: [], replies: [], createdAt: new Date(), editedAt: null },
    ],
    prompts: [],
    docs: [],
    createdAt: new Date(),
  });
  await mongoose.disconnect();

  res = await call("GET", `${J("legacy0001")}`);
  const legacy = res.json;
  check(
    "legacy entries migrate to docs on read",
    res.status === 200 && legacy.migrated === true && legacy.docs.length === 2 && legacy.docs[0].title === "Old morning",
    `docs=${legacy?.docs?.length}`
  );

  // ---------- pages ----------
  res = await call("GET", `/journal/${journal}`);
  check("journal page SSR renders title", res.status === 200 && res.text.includes("Us, 2026 (renamed)"));
  res = await call("GET", "/");
  check("dashboard renders", res.status === 200 && res.text.includes("Your journals"));
  res = await call("GET", "/journal/definitely-not-here");
  // with loading.tsx the shell streams 200 first and notFound() resolves inside the Suspense boundary
  check("unknown journal → not-found page", res.status === 200 && res.text.includes("doesn't exist"));

  const failed = results.filter((r) => !r.ok).length;
  log(`\n${results.length - failed}/${results.length} checks passed`);
  if (failed > 0) process.exitCode = 1;
} catch (err) {
  log("E2E ERROR:", err);
  process.exitCode = 1;
} finally {
  server.kill();
  await mongod.stop();
  process.exit(process.exitCode ?? 0);
}
