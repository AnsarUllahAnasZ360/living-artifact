#!/usr/bin/env node
// Build the book page.
//   node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]
// Reads <book-dir>/book.json, checks it, writes <book-dir>/index.html from assets/book.html,
// and prints the Artifact `files` map (published path -> absolute source path) as JSON on stdout.
// Errors and warnings go to stderr. Exit 1 on any error.
//   --demo     embed sample live state (shown only when the db is not available, labelled as sample)
//   --preview  also write <book-dir>/preview.html, wrapped in the skeleton the Artifact tool adds,
//              for opening locally in a browser. Never publish preview.html.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(here, "../assets/book.html");

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v ?? ""; };
const demoPath = flag("--demo");
const previewIdx = args.indexOf("--preview");
const preview = previewIdx >= 0; if (preview) args.splice(previewIdx, 1);
const dir = args[0] ? path.resolve(args[0]) : null;
if (!dir) { console.error("Usage: node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]"); process.exit(1); }

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let book;
const bookPath = path.join(dir, "book.json");
try { book = JSON.parse(fs.readFileSync(bookPath, "utf8")); }
catch (e) { console.error(`error: cannot read ${bookPath}: ${e.message}`); process.exit(1); }

// ---------- helpers ----------
const isStr = (v) => typeof v === "string";
const isArr = Array.isArray;
const isObj = (v) => v && typeof v === "object" && !isArr(v);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const STAGES = ["explore", "plan", "build", "verify", "report", "done"];
const PROFILES = ["feature", "audit", "large"];
const SIZES = ["S", "M", "L", "XL"];
const RISKS = ["low", "medium", "high"];
const IMPACTS = ["low", "medium", "high"];
const VERDICTS = ["verified", "not verified", "not-verified", "inconclusive"];

function need(obj, key, where, test = (v) => v !== undefined && v !== null && v !== "", what = "a value") {
  if (!isObj(obj) || !test(obj[key])) { err(`${where}.${key}: missing or not ${what}`); return false; }
  return true;
}
const nonEmptyStr = (v) => isStr(v) && v.trim() !== "";
const arr = (v) => isArr(v);
const nonEmptyArr = (v) => isArr(v) && v.length > 0;

function ids(list, where) {
  const seen = new Set();
  (list || []).forEach((x, i) => {
    if (!isObj(x)) { err(`${where}[${i}]: not an object`); return; }
    if (!nonEmptyStr(x.id)) { err(`${where}[${i}].id: missing`); return; }
    if (!KEBAB.test(x.id)) err(`${where}[${i}].id "${x.id}": ids are kebab-case`);
    if (seen.has(x.id)) err(`${where}: duplicate id "${x.id}"`);
    seen.add(x.id);
  });
  return seen;
}

// ---------- required top level ----------
for (const k of ["id", "title", "tagline", "updated"]) need(book, k, "book", nonEmptyStr, "a string");
if (isStr(book.id) && !KEBAB.test(book.id)) err(`book.id "${book.id}": ids are kebab-case`);
if (need(book, "owner", "book", isObj, "an object")) need(book.owner, "name", "book.owner", nonEmptyStr, "a string");
need(book, "profile", "book", (v) => PROFILES.includes(v), `one of ${PROFILES.join(", ")}`);
if (need(book, "round", "book", isObj, "an object")) {
  need(book.round, "n", "book.round", (v) => Number.isInteger(v) && v >= 1, "a whole number");
  need(book.round, "title", "book.round", nonEmptyStr, "a string");
  need(book.round, "stage", "book.round", (v) => STAGES.includes(v), `one of ${STAGES.join(", ")}`);
}
if (book.updated && isNaN(Date.parse(book.updated))) err(`book.updated: not a date`);
if (need(book, "problem", "book", isObj, "an object")) need(book.problem, "statement", "book.problem", nonEmptyStr, "a string");
need(book, "outcomes", "book", nonEmptyArr, "a non-empty list");
for (const k of ["links", "findings", "research", "prototypes", "decisions", "history", "files"]) {
  if (book[k] !== undefined && !isArr(book[k])) err(`book.${k}: must be a list`);
}
const profile = book.profile;
const stageIdx = STAGES.indexOf(book.round?.stage);

// ---------- outcomes ----------
const outcomeIds = ids(book.outcomes, "outcomes");
(book.outcomes || []).forEach((o, i) => {
  need(o, "claim", `outcomes[${i}]`, nonEmptyStr, "a string");
  if (!nonEmptyArr(o?.done_when)) warn(`outcomes[${i}] "${o?.id}": no done_when, so nothing can prove it`);
});
const nOut = (book.outcomes || []).length;
if (nOut && (nOut < 3 || nOut > 5) && profile !== "feature") warn(`outcomes: ${nOut} claims; aim for 3 to 5`);

// ---------- findings, research, prototypes ----------
const findingIds = ids(book.findings, "findings");
(book.findings || []).forEach((f, i) => {
  need(f, "finding", `findings[${i}]`, nonEmptyStr, "a string");
  if (f?.impact && !IMPACTS.includes(f.impact)) err(`findings[${i}].impact: one of ${IMPACTS.join(", ")}`);
});
ids(book.research, "research");
(book.research || []).forEach((r, i) => { need(r, "question", `research[${i}]`, nonEmptyStr, "a string"); });
ids(book.prototypes, "prototypes");

// ---------- architecture ----------
const arch = book.architecture;
if (arch !== undefined) {
  if (!isObj(arch)) err("architecture: must be an object");
  else (arch.frames || []).forEach((fr, i) => {
    const nodeIds = new Set((fr.nodes || []).map((n) => n.id));
    (fr.nodes || []).forEach((n, j) => {
      if (!nonEmptyStr(n.id) || !nonEmptyStr(n.label)) err(`architecture.frames[${i}].nodes[${j}]: needs id and label`);
      if (typeof n.x !== "number" || typeof n.y !== "number") err(`architecture.frames[${i}].nodes[${j}] "${n.id}": needs numeric x and y`);
    });
    (fr.edges || []).forEach((e, j) => {
      if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) err(`architecture.frames[${i}].edges[${j}]: ${e.from} to ${e.to} names a node not in this frame`);
    });
    (fr.new || []).forEach((id) => { if (!nodeIds.has(id)) err(`architecture.frames[${i}].new: "${id}" is not a node in this frame`); });
    if ((fr.nodes || []).length > 12) warn(`architecture.frames[${i}]: ${fr.nodes.length} nodes; over 12 is hard to read`);
  });
}

// ---------- plan ----------
const plan = book.plan;
const milestoneIds = new Set();
const ticketIds = new Set();
const tickets = [];
const waveByN = new Map();
if (profile !== "audit" && stageIdx >= 1) {
  if (need(book, "plan", "book", isObj, "an object")) {
    need(plan, "milestones", "plan", nonEmptyArr, "a non-empty list");
    need(plan, "tickets", "plan", arr, "a list");
  }
}
if (isObj(plan)) {
  ids(plan.milestones, "plan.milestones").forEach((x) => milestoneIds.add(x));
  (plan.milestones || []).forEach((m, i) => need(m, "title", `plan.milestones[${i}]`, nonEmptyStr, "a string"));
  ids(plan.tickets, "plan.tickets").forEach((x) => ticketIds.add(x));
  (plan.waves || []).forEach((w, i) => {
    if (!Number.isInteger(w?.n)) { err(`plan.waves[${i}].n: missing`); return; }
    if (waveByN.has(w.n)) err(`plan.waves: duplicate wave ${w.n}`);
    waveByN.set(w.n, w);
  });
  const tById = new Map();
  (plan.tickets || []).forEach((t) => { if (isObj(t)) { tickets.push(t); tById.set(t.id, t); } });
  // Build order inside one agent's lane: `order` when set, else the position in the wave's agent list.
  var agentRank = (t) => {
    if (typeof t.order === "number") return t.order;
    const ag = (waveByN.get(t.wave)?.agents || []).find((a) => a.name === t.agent);
    const i = ag ? (ag.tickets || []).indexOf(t.id) : -1;
    return i < 0 ? 0 : i + 1;
  };

  tickets.forEach((t, i) => {
    const w = `plan.tickets[${i}] "${t.id}"`;
    for (const k of ["title", "goal"]) need(t, k, w, nonEmptyStr, "a string");
    need(t, "done_when", w, nonEmptyArr, "a non-empty list");
    if (!milestoneIds.has(t.milestone)) err(`${w}: unknown milestone "${t.milestone}"`);
    if (t.size && !SIZES.includes(t.size)) err(`${w}: size must be one of ${SIZES.join(", ")}`);
    if (t.size === "S") warn(`${w}: size S; fold it into a goal-sized ticket`);
    if (t.risk && !RISKS.includes(t.risk)) err(`${w}: risk must be one of ${RISKS.join(", ")}`);
    const wave = waveByN.get(t.wave);
    if (!wave) err(`${w}: unknown wave ${JSON.stringify(t.wave)}`);
    else {
      const ag = (wave.agents || []).find((a) => a.name === t.agent);
      if (!ag) err(`${w}: agent "${t.agent}" is not listed in wave ${t.wave}`);
      else if (!(ag.tickets || []).includes(t.id)) err(`${w}: wave ${t.wave} agent "${t.agent}" does not list this ticket`);
    }
    if (t.order !== undefined && (typeof t.order !== "number" || !isFinite(t.order))) err(`${w}: order must be a number`);
    if (t.short !== undefined) { if (!nonEmptyStr(t.short)) err(`${w}: short must be a string`); else if (words(t.short) > 5) warn(`${w}: short is ${words(t.short)} words; 5 at most`); }
    (t.depends_on || []).forEach((d) => {
      const dep = tById.get(d);
      if (!dep) { err(`${w}: depends on unknown ticket "${d}"`); return; }
      if (d === t.id) { err(`${w}: depends on itself`); return; }
      if (!Number.isInteger(dep.wave) || !Number.isInteger(t.wave)) return;
      if (dep.wave > t.wave) err(`${w}: depends on "${d}" in later wave ${dep.wave}; a dependency must come first`);
      else if (dep.wave === t.wave) {
        if (dep.agent !== t.agent) err(`${w}: depends on "${d}" in the same wave with a different agent ("${dep.agent}"); move it to an earlier wave or give both to one agent`);
        else if (agentRank(dep) >= agentRank(t)) err(`${w}: depends on "${d}", which agent "${t.agent}" builds at the same point or later; give "${d}" a lower order`);
      }
    });
  });

  // waves list only known tickets, each once, and agents stay small
  const listed = new Map();
  (plan.waves || []).forEach((wv) => {
    (wv.agents || []).forEach((a) => {
      if (!nonEmptyStr(a.name)) err(`plan.waves wave ${wv.n}: an agent has no name`);
      const ts = a.tickets || [];
      const orders = ts.map((id) => tById.get(id)?.order);
      const chained = orders.every((o) => typeof o === "number") && new Set(orders).size === orders.length;
      if (ts.length > 2 && !(a.name === "lead" && chained)) warn(`wave ${wv.n} agent "${a.name}": ${ts.length} tickets; two at most`);
      ts.forEach((id) => {
        const t = tById.get(id);
        if (!t) err(`wave ${wv.n} agent "${a.name}": unknown ticket "${id}"`);
        else if (t.wave !== wv.n || t.agent !== a.name) err(`wave ${wv.n} agent "${a.name}" lists "${id}", but the ticket says wave ${t.wave}, agent "${t.agent}"`);
        if (listed.has(id)) err(`ticket "${id}" is listed by two agents`);
        listed.set(id, true);
      });
    });
  });
  if (tickets.length > 24) warn(`plan.tickets: ${tickets.length} tickets; over 24 usually means they are too small`);

  // two agents in one wave touching the same files (path prefixes, case-insensitive)
  (plan.waves || []).forEach((wv) => {
    const owned = [];
    (wv.agents || []).forEach((a) => (a.tickets || []).forEach((id) => (tById.get(id)?.files || []).forEach((f) => owned.push({ agent: a.name, id, f: String(f).toLowerCase().replace(/\/+$/, "") }))));
    const seen = new Set();
    for (let i = 0; i < owned.length; i++) for (let j = i + 1; j < owned.length; j++) {
      const x = owned[i], y = owned[j];
      if (x.agent === y.agent) continue;
      const under = (p, q) => p === q || q.startsWith(p + "/");
      if (!under(x.f, y.f) && !under(y.f, x.f)) continue;
      const key = [x.id, y.id].sort().join("|");
      if (seen.has(key)) continue; seen.add(key);
      warn(`wave ${wv.n}: agents "${x.agent}" and "${y.agent}" both touch "${x.f.length <= y.f.length ? x.f : y.f}" (${x.id}, ${y.id}); they will collide`);
    }
  });

  // gate and stop rules
  if (plan.gate !== undefined) {
    if (!isObj(plan.gate)) err("plan.gate: must be an object { steps, baseline }");
    else for (const k of ["steps", "baseline"]) if (plan.gate[k] !== undefined && !(isArr(plan.gate[k]) && plan.gate[k].every(isStr))) err(`plan.gate.${k}: must be a list of strings`);
  }
  if (plan.stop_rules !== undefined && !(isArr(plan.stop_rules) && plan.stop_rules.every(isStr))) err("plan.stop_rules: must be a list of strings");
}

// ---------- decisions ----------
(book.decisions || []).forEach((d, i) => {
  const w = `decisions[${i}] "${d?.id}"`;
  need(d, "question", w, nonEmptyStr, "a string");
  if (!isArr(d?.options) || d.options.length < 2) { err(`${w}: needs at least two options`); return; }
  ids(d.options, `${w}.options`);
  if (!d.options.some((o) => o.id === d.recommended)) err(`${w}: recommended "${d.recommended}" is not one of its options`);
  if (d.attach) {
    const [kind, id] = String(d.attach).split(":");
    const pool = { ticket: ticketIds, milestone: milestoneIds, outcome: outcomeIds, finding: findingIds }[kind];
    if (!pool) err(`${w}: attach "${d.attach}" must start with ticket:, milestone:, outcome: or finding:`);
    else if (!pool.has(id)) err(`${w}: attach names unknown ${kind} "${id}"`);
  }
  (d.blocks || []).forEach((t) => { if (!ticketIds.has(t)) err(`${w}: blocks unknown ticket "${t}"`); });
});
ids(book.decisions, "decisions");

// ---------- report ----------
const rep = book.report;
if (rep !== undefined && isObj(rep)) {
  (rep.proof || []).forEach((p, i) => {
    if (p.verdict && !VERDICTS.includes(p.verdict)) err(`report.proof[${i}].verdict: one of ${VERDICTS.join(", ")}`);
    if (p.ticket && !ticketIds.has(p.ticket)) err(`report.proof[${i}]: unknown ticket "${p.ticket}"`);
  });
  if (rep.ready && stageIdx < STAGES.indexOf("report")) warn("report.ready is true but the stage is before report");
}

// ---------- needs ----------
if (book.needs !== undefined) {
  if (!isArr(book.needs)) err("book.needs: must be a list");
  else book.needs.forEach((n, i) => {
    if (!nonEmptyStr(n?.text)) err(`needs[${i}].text: missing`);
    if (!["action", "blocked", "info"].includes(n?.kind)) err(`needs[${i}].kind: one of action, blocked, info`);
    if (n?.link !== undefined && !isStr(n.link)) err(`needs[${i}].link: must be a string`);
  });
}

// ---------- word budgets (references/design.md) ----------
function words(t) { return String(t || "").trim().split(/\s+/).filter(Boolean).length; }
function budget(text, max, where) { if (isStr(text) && words(text) > max) warn(`${where}: ${words(text)} words; budget is ${max}`); }
budget(book.tagline, 15, "tagline");
budget(book.problem?.statement, 50, "problem.statement");
(book.outcomes || []).forEach((o, i) => budget(o.claim, 30, `outcomes[${i}].claim`));
(book.findings || []).forEach((f, i) => { budget(f.finding, 25, `findings[${i}].finding`); budget(f.solution, 25, `findings[${i}].solution`); });
(book.research || []).forEach((r, i) => { budget(r.answer, 40, `research[${i}].answer`); (r.recommendations || []).forEach((x, j) => budget(x, 15, `research[${i}].recommendations[${j}]`)); });
(book.architecture?.frames || []).forEach((f, i) => budget(f.caption, 20, `architecture.frames[${i}].caption`));
tickets.forEach((t, i) => { budget(t.goal, 50, `plan.tickets[${i}].goal`); (t.done_when || []).forEach((d, j) => budget(d, 20, `plan.tickets[${i}].done_when[${j}]`)); });
(book.outcomes || []).forEach((o, i) => (o.done_when || []).forEach((d, j) => budget(d, 20, `outcomes[${i}].done_when[${j}]`)));
(plan?.milestones || []).forEach((m, i) => (m.done_when || []).forEach((d, j) => budget(d, 20, `plan.milestones[${i}].done_when[${j}]`)));
(book.decisions || []).forEach((d, i) => { budget(d.question, 15, `decisions[${i}].question`); budget(d.why, 30, `decisions[${i}].why`); (d.options || []).forEach((o, j) => budget(o.effect, 12, `decisions[${i}].options[${j}].effect`)); });
if (isObj(rep)) for (const k of ["blocked_on_you", "changed", "found", "attention"]) (rep[k] || []).forEach((x, j) => budget(x, 25, `report.${k}[${j}]`));

// ---------- one ask file ----------
const asks = (book.files || []).filter((f) => /(^|\/)ask[^/]*\.md$/i.test(f?.path || ""));
if (asks.length > 1) warn(`files: ${asks.length} ASK files (${asks.map((f) => f.path).join(", ")}); keep one agent/ASK.md, newest round first`);

// ---------- dashes in human-facing text ----------
const SKIP_KEYS = new Set(["url", "ref", "path", "file", "files", "sha", "code", "evidence"]);
function scan(v, where, key) {
  if (isStr(v)) {
    if (SKIP_KEYS.has(key)) return;
    const m = v.match(/[\u2013\u2014]/);
    if (m) err(`${where}: has ${m[0] === "\u2014" ? "an em" : "an en"} dash; use plain words or a comma`);
  } else if (isArr(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`, key));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) scan(x, where ? `${where}.${k}` : k, k);
}
scan(book, "", "");

// ---------- files ----------
const filesMap = {};
filesMap["agent/book.json"] = bookPath;
(book.files || []).forEach((f, i) => {
  if (!nonEmptyStr(f?.path)) { err(`files[${i}]: missing path`); return; }
  if (f.path.startsWith("/") || f.path.includes("..")) { err(`files[${i}] "${f.path}": must be relative inside the book`); return; }
  const abs = path.join(dir, f.path);
  if (!fs.existsSync(abs)) err(`files[${i}] "${f.path}": file does not exist`);
  else filesMap[f.path] = abs;
});
const IMG = /\.(png|jpe?g|gif|webp|svg)$/i;
function walk(rel, test) {
  const abs = path.join(dir, rel);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) walk(r, test);
    else if (test(e.name)) filesMap[r] = path.join(dir, r);
  }
}
walk("agent/proof", (n) => IMG.test(n));
if (fs.existsSync(path.join(dir, "proto")))
  for (const n of fs.readdirSync(path.join(dir, "proto"))) if (/\.html$/i.test(n)) filesMap[`proto/${n}`] = path.join(dir, "proto", n);

// referenced but not published
const published = new Set(Object.keys(filesMap));
const refd = [];
(book.research || []).forEach((r) => r.file && refd.push([r.file, `research "${r.id}"`]));
(book.prototypes || []).forEach((p) => p.file && refd.push([p.file, `prototype "${p.id}"`]));
(book.history || []).forEach((h) => h.file && refd.push([h.file, `history round ${h.round}`]));
(rep?.proof || []).forEach((p) => (p.evidence || []).forEach((e) => e.kind === "img" && e.ref && refd.push([e.ref, "report proof"])));
refd.forEach(([p, who]) => { if (!published.has(p)) warn(`${who} points at "${p}", which is not published (add it to files)`); });

// ---------- secrets fence ----------
const SECRET = /(^|\/)(\.env[^/]*|id_rsa[^/]*|[^/]*\.(pem|key|p12))$/i;
for (const p of Object.keys(filesMap)) if (SECRET.test(p)) err(`files: "${p}" looks like a secret; never publish it`);

// ---------- write ----------
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  for (const w of warnings) console.error(`warning: ${w}`);
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s). index.html not written.`);
  process.exit(1);
}

const safeJSON = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const escHTML = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const home = os.homedir();
const tilde = (p) => (p.startsWith(home) ? "~" + p.slice(home.length) : p);

let demo = null;
if (demoPath) {
  try { demo = JSON.parse(fs.readFileSync(path.resolve(demoPath), "utf8")); }
  catch (e) { console.error(`error: cannot read demo file ${demoPath}: ${e.message}`); process.exit(1); }
}
const build = { source: path.basename(dir) + "/index.html", built: new Date().toISOString(), published: Object.keys(filesMap).sort() };

let tpl;
try { tpl = fs.readFileSync(TEMPLATE, "utf8"); }
catch (e) { console.error(`error: cannot read template ${TEMPLATE}: ${e.message}`); process.exit(1); }
const fill = (t, token, value) => { if (!t.includes(token)) { console.error(`error: template is missing ${token}`); process.exit(1); } return t.split(token).join(value); };
let html = tpl;
html = fill(html, "__TITLE__", escHTML(book.title));
html = fill(html, "/*BOOK_JSON*/", safeJSON(book));
html = fill(html, "/*BUILD_JSON*/", safeJSON(build));
html = fill(html, "/*DEMO_JSON*/", demo ? safeJSON(demo) : "");

const out = path.join(dir, "index.html");
fs.writeFileSync(out, html);
const kb = Buffer.byteLength(html) / 1024;
if (kb > 400) warn(`index.html is ${kb.toFixed(0)} KB; keep it under 400 KB (move long text into agent files)`);

if (preview) {
  const skel = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>`;
  fs.writeFileSync(path.join(dir, "preview.html"), skel + html + "</body></html>");
}

for (const w of warnings) console.error(`warning: ${w}`);
console.error(`wrote ${tilde(out)} (${kb.toFixed(0)} KB), ${Object.keys(filesMap).length} published file(s), ${warnings.length} warning(s)${preview ? ", preview.html" : ""}${demo ? ", with sample live data" : ""}`);
process.stdout.write(JSON.stringify(filesMap, null, 2) + "\n");
