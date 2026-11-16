#!/usr/bin/env node
// Build the book page.
//   node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]
// Reads <book-dir>/book.json (version 2), checks it, computes the plan counts, writes <book-dir>/index.html
// from assets/book.html, and prints the Artifact `files` map (published path -> absolute source path) as JSON
// on stdout. Errors and warnings go to stderr. Exit 1 on any error.
//   --demo     embed sample live state (status, run, log), shown only when the db is not available, labelled as sample
//   --preview  also write <book-dir>/preview.html wrapped in the skeleton the Artifact tool adds. Never publish it.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(here, "../assets/book.html");

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v ?? ""; };
const demoPath = flag("--demo");
const pi = args.indexOf("--preview");
const preview = pi >= 0; if (preview) args.splice(pi, 1);
const dir = args[0] ? path.resolve(args[0]) : null;
if (!dir) { console.error("Usage: node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]"); process.exit(1); }

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

const bookPath = path.join(dir, "book.json");
let book;
try { book = JSON.parse(fs.readFileSync(bookPath, "utf8")); }
catch (e) { console.error(`error: cannot read ${bookPath}: ${e.message}`); process.exit(1); }

const isStr = (v) => typeof v === "string";
const isArr = Array.isArray;
const isObj = (v) => v && typeof v === "object" && !isArr(v);
const str = (v) => isStr(v) && v.trim() !== "";
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const budget = (t, max, where) => { if (isStr(t) && words(t) > max) warn(`${where}: ${words(t)} words; keep it to ${max}`); };
const need = (o, k, where, test = str, what = "a string") => { if (!isObj(o) || !test(o[k])) { err(`${where}.${k}: missing or not ${what}`); return false; } return true; };
const list = (o, k, where) => { if (o?.[k] === undefined) return []; if (isArr(o[k])) return o[k]; err(`${where}.${k}: must be a list`); return []; };
function ids(items, where) {
  const seen = new Set();
  items.forEach((x, i) => {
    if (!isObj(x)) { err(`${where}[${i}]: not an object`); return; }
    if (!str(x.id)) { err(`${where}[${i}].id: missing`); return; }
    if (!KEBAB.test(x.id)) err(`${where}[${i}].id "${x.id}": ids are kebab-case`);
    if (seen.has(x.id)) err(`${where}: duplicate id "${x.id}"`);
    seen.add(x.id);
  });
  return seen;
}

// ---------- version and removed parts ----------
if (book.version !== 2) err(`book.version: must be 2 (this checker reads version 2 books; see references/data-model.md)`);
const REMOVED = {
  needs: "the summary has no Needs you; ask the user in chat", decisions: "ask the user in chat; anything still open goes in agent/CHECKPOINT.md",
  kickoff: "keep the kickoff as an agent file, agent/prompts/kickoff.md", prompts: "keep prompts as agent files under agent/prompts/",
  history: "earlier rounds stay as agent files under agent/rounds/", round: "use stage", profile: "dropped", outcomes: "each problem carries its outcome",
  problem: "use problems", findings: "findings live inside each problem as found", research: "research lives inside each problem as found",
  architecture: "diagrams live inside each problem's fix as visuals", prototypes: "prototypes live inside each problem's fix as visuals",
  report: "use proof", files: "every file under agent/, shots/ and proto/ is published by itself",
};
for (const [k, why] of Object.entries(REMOVED)) if (book[k] !== undefined) err(`book.${k}: removed in version 2; ${why}`);

// ---------- top level ----------
for (const k of ["id", "title", "tagline", "updated"]) need(book, k, "book");
if (str(book.id) && !KEBAB.test(book.id)) err(`book.id "${book.id}": ids are kebab-case`);
if (str(book.updated) && isNaN(Date.parse(book.updated))) err("book.updated: not a date");
if (book.owner !== undefined && !(isObj(book.owner) && str(book.owner.name))) err("book.owner: { name, role }");
const STAGES = ["plan", "build", "verify", "done"];
need(book, "stage", "book", (v) => STAGES.includes(v), `one of ${STAGES.join(", ")}`);
list(book, "links", "book").forEach((l, i) => { if (!str(l?.label)) err(`links[${i}].label: missing`); if (l?.url !== undefined && !isStr(l.url)) err(`links[${i}].url: must be a string`); });
budget(book.tagline, 15, "tagline");

// ---------- summary ----------
if (need(book, "summary", "book", isObj, "an object")) {
  const S = book.summary;
  need(S, "headline", "summary"); budget(S.headline, 25, "summary.headline");
  const paras = list(S, "paragraphs", "summary");
  if (paras.length < 1 || paras.length > 3) warn(`summary.paragraphs: ${paras.length}; write two or three short ones`);
  paras.forEach((p, i) => { if (!str(p)) err(`summary.paragraphs[${i}]: must be text`); budget(p, 70, `summary.paragraphs[${i}]`); });
  const kpis = list(S, "kpis", "summary");
  if (kpis.length < 3 || kpis.length > 6) warn(`summary.kpis: ${kpis.length}; show 3 to 6 real numbers`);
  kpis.forEach((k, i) => {
    if (!str(k?.label) || !(str(k?.value) || typeof k?.value === "number")) err(`summary.kpis[${i}]: needs label and value`);
    budget(k?.label, 6, `summary.kpis[${i}].label`); budget(k?.note, 14, `summary.kpis[${i}].note`);
  });
  for (const k of Object.keys(S)) if (!["headline", "paragraphs", "kpis"].includes(k)) err(`summary.${k}: the summary holds only headline, paragraphs and kpis`);
}

// ---------- problems ----------
const SEV = ["high", "medium", "low"];
const VLABEL = ["Today", "Proposed", "Diagram"], VKIND = ["shot", "proto", "diagram"];
const problems = list(book, "problems", "book");
if (!problems.length) warn("problems: none yet");
const problemIds = ids(problems, "problems");
const srcRefs = [];
problems.forEach((p, i) => {
  if (!isObj(p)) return;
  const w = `problems[${i}] "${p.id}"`;
  for (const k of ["title", "area", "problem", "why"]) need(p, k, w);
  need(p, "severity", w, (v) => SEV.includes(v), `one of ${SEV.join(", ")}`);
  budget(p.title, 12, `${w}.title`); budget(p.problem, 70, `${w}.problem`); budget(p.why, 70, `${w}.why`); budget(p.asked, 40, `${w}.asked`);
  const found = list(p, "found", w);
  if (!found.length) warn(`${w}: nothing in found; say what we found, each line with its evidence`);
  found.forEach((f, j) => { if (!str(f?.text)) err(`${w}.found[${j}].text: missing`); else budget(f.text, 35, `${w}.found[${j}]`); if (!str(f?.evidence)) warn(`${w}.found[${j}]: no evidence (a file and line, a screenshot, a number or the user's words)`); });
  if (need(p, "solution", w, isObj, "an object")) {
    const s = p.solution;
    need(s, "summary", `${w}.solution`); budget(s.summary, 60, `${w}.solution.summary`);
    list(s, "points", `${w}.solution`).forEach((x, j) => budget(x, 25, `${w}.solution.points[${j}]`));
    list(s, "not_doing", `${w}.solution`).forEach((x, j) => budget(x, 25, `${w}.solution.not_doing[${j}]`));
    if (s.reference !== undefined && !str(s.reference)) err(`${w}.solution.reference: must be text, how a named product does it`);
    budget(s.reference, 40, `${w}.solution.reference`);
  }
  list(p, "visuals", w).forEach((v, j) => {
    const vw = `${w}.visuals[${j}]`;
    if (!VLABEL.includes(v?.label)) err(`${vw}.label: one of ${VLABEL.join(", ")}`);
    if (!VKIND.includes(v?.kind)) err(`${vw}.kind: one of ${VKIND.join(", ")}`);
    if (!str(v?.src)) err(`${vw}.src: missing`); else srcRefs.push([v.src, vw, v.kind === "proto"]);
    budget(v?.caption, 25, `${vw}.caption`);
  });
  const out = list(p, "outcome", w);
  if (!out.length) err(`${w}.outcome: say the outcome we want, one line each`);
  out.forEach((x, j) => budget(x, 25, `${w}.outcome[${j}]`));
});

// ---------- plan ----------
const P = book.plan;
const counts = { tickets: 0, waves: 0, prs: 0, commits: 0, reviews: 0, browser: 0 };
const JUNC = ["code-review", "critical-review", "browser-check", "merge"], BY = ["Fable", "Opus", "Founder"];
const PROOF = ["test", "browser", "measure"], CHECK = ["browser", "test", "measure", "review"];
if (book.stage !== "plan" || P !== undefined) need(book, "plan", "book", isObj, "an object");
if (isObj(P)) {
  need(P, "goal", "plan"); budget(P.goal, 30, "plan.goal");
  const tickets = list(P, "tickets", "plan").filter(isObj), waves = list(P, "waves", "plan").filter(isObj), prs = list(P, "prs", "plan").filter(isObj);
  const tIds = ids(tickets, "plan.tickets"), wIds = ids(waves, "plan.waves"), pIds = ids(prs, "plan.prs");
  const T = new Map(tickets.map((t) => [t.id, t]));
  const waveAt = new Map(waves.map((w, i) => [w.id, i]));
  const norm = (f) => String(f).trim().replace(/^\.\//, "").replace(/\/+$/, "").toLowerCase();

  tickets.forEach((t, i) => {
    const w = `plan.tickets[${i}] "${t.id}"`;
    for (const k of ["title", "does"]) need(t, k, w);
    if (need(t, "problem", w) && !problemIds.has(t.problem)) err(`${w}: problem "${t.problem}" is not one of problems`);
    if (t.also_serves !== undefined) {
      if (!isArr(t.also_serves)) err(`${w}.also_serves: must be a list of problem ids`);
      else t.also_serves.forEach((id) => { if (!problemIds.has(id)) err(`${w}.also_serves: "${id}" is not one of problems`); else if (id === t.problem) warn(`${w}.also_serves: "${id}" is already its main problem`); });
    }
    if (!isArr(t.how) || !t.how.length || !t.how.every(str)) err(`${w}.how: list the steps the agent will take`);
    if (!isArr(t.files) || !t.files.length || !t.files.every(str)) err(`${w}.files: name every file it edits, so two tickets in a wave never share one`);
    if (isArr(t.depends_on)) t.depends_on.forEach((d) => { if (d === t.id) err(`${w}: depends on itself`); else if (!tIds.has(d)) err(`${w}: depends on unknown ticket "${d}"`); });
    else if (t.depends_on !== undefined) err(`${w}.depends_on: must be a list`);
    if (!waveAt.has(t.wave)) err(`${w}: wave "${t.wave}" is not one of plan.waves`);
    if (!pIds.has(t.pr)) err(`${w}: pr "${t.pr}" is not one of plan.prs`);
    if (!isObj(t.proof) || !PROOF.includes(t.proof.kind) || !str(t.proof.text)) err(`${w}.proof: { kind: ${PROOF.join(" | ")}, text } says how this ticket is proven`);
    if (/^(pr|run)-/.test(t.id)) err(`${w}: a ticket id may not start with pr- or run-; those name live status documents`);
    budget(t.title, 12, `${w}.title`); budget(t.does, 60, `${w}.does`);
    (t.how || []).forEach((x, j) => budget(x, 30, `${w}.how[${j}]`));
    budget(t.proof?.text, 35, `${w}.proof.text`);
  });

  problems.forEach((p) => { if (isObj(p) && str(p.id) && !tickets.some((t) => t.problem === p.id || (isArr(t.also_serves) && t.also_serves.includes(p.id)))) warn(`problem "${p.id}" has no ticket; name it in a ticket's problem or also_serves`); });

  // waves list exactly their tickets; dependencies sit in earlier waves; no shared file inside a wave
  waves.forEach((wv, i) => {
    const w = `plan.waves[${i}] "${wv.id}"`;
    need(wv, "title", w); budget(wv.title, 8, `${w}.title`); budget(wv.why, 30, `${w}.why`);
    if (wv.gives !== undefined && !str(wv.gives)) err(`${w}.gives: one sentence, what he has when this wave is done`);
    budget(wv.gives, 25, `${w}.gives`);
    const listed = list(wv, "tickets", w);
    if (!listed.length) err(`${w}: holds no tickets`);
    listed.forEach((id) => { if (!tIds.has(id)) err(`${w}: unknown ticket "${id}"`); else if (T.get(id).wave !== wv.id) err(`${w} lists "${id}", but the ticket says wave "${T.get(id).wave}"`); });
    tickets.filter((t) => t.wave === wv.id && !listed.includes(t.id)).forEach((t) => err(`ticket "${t.id}" says wave "${wv.id}", but that wave does not list it`));
    list(wv, "then", w).forEach((j, k) => {
      const jw = `${w}.then[${k}]`;
      if (!JUNC.includes(j?.kind)) err(`${jw}.kind: one of ${JUNC.join(", ")}`);
      if (!BY.includes(j?.by)) err(`${jw}.by: one of ${BY.join(", ")}`);
      if (!str(j?.what)) err(`${jw}.what: say what it covers`);
      if (j?.by === "Fable" && j?.kind === "browser-check") err(`${jw}: Fable never drives a browser; an Opus agent does the browser check`);
      if ((j?.kind === "code-review" || j?.kind === "critical-review") && j?.by !== "Fable") warn(`${jw}: a Fable agent reviews; this says ${j?.by}`);
      budget(j?.what, 30, `${jw}.what`);
    });
  });
  tickets.forEach((t) => {
    const a = waveAt.get(t.wave);
    if (a === undefined) return;
    (t.depends_on || []).forEach((d) => { const b = waveAt.get(T.get(d)?.wave); if (b !== undefined && b >= a) err(`ticket "${t.id}" (wave "${t.wave}") depends on "${d}" in ${b === a ? "the same wave" : `later wave "${T.get(d).wave}"`}; a dependency is always in an earlier wave`); });
  });
  const filesOf = (t) => new Set((t.files || []).map(norm));
  waves.forEach((wv) => {
    const mine = tickets.filter((t) => t.wave === wv.id);
    for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) {
      const shared = [...filesOf(mine[i])].filter((f) => filesOf(mine[j]).has(f));
      if (shared.length) err(`wave "${wv.id}": tickets "${mine[i].id}" and "${mine[j].id}" both edit ${shared.join(", ")}; two tickets that edit the same file never share a wave`);
    }
  });
  // the earliest-wave rule: a ticket that could run sooner is a lost chance to run in parallel
  tickets.forEach((t) => {
    const a = waveAt.get(t.wave);
    if (!a) return;
    const deps = (t.depends_on || []).map((d) => waveAt.get(T.get(d)?.wave)).filter((x) => x !== undefined);
    const floor = deps.length ? Math.max(...deps) + 1 : 0;
    for (let k = floor; k < a; k++) {
      const clash = tickets.some((o) => o !== t && waveAt.get(o.wave) === k && [...filesOf(o)].some((f) => filesOf(t).has(f)));
      if (!clash) { warn(`ticket "${t.id}" could run in wave "${waves[k].id}": what it needs is done by then and no ticket there edits its files`); break; }
    }
  });

  // pull requests: each ticket is one commit in exactly one
  const owner = new Map();
  prs.forEach((pr, i) => {
    const w = `plan.prs[${i}] "${pr.id}"`;
    need(pr, "title", w); need(pr, "branch", w); budget(pr.title, 10, `${w}.title`);
    if (pr.base !== undefined && !str(pr.base)) err(`${w}.base: must be a branch name`);
    const pt = list(pr, "tickets", w);
    if (!pt.length) err(`${w}: holds no tickets`);
    pt.forEach((id) => {
      if (!tIds.has(id)) { err(`${w}: unknown ticket "${id}"`); return; }
      if (owner.has(id)) { err(`ticket "${id}" is in two pull requests ("${owner.get(id)}" and "${pr.id}")`); return; }
      owner.set(id, pr.id);
      if (T.get(id).pr !== pr.id) err(`${w} lists "${id}", but the ticket says pr "${T.get(id).pr}"`);
    });
  });
  tickets.forEach((t) => { if (pIds.has(t.pr) && !owner.has(t.id)) err(`ticket "${t.id}" says pr "${t.pr}", but that pull request does not list it`); });

  // how we prove it
  const V = P.verification;
  if (V === undefined) warn("plan.verification: missing; say how the work is proven");
  else if (!isObj(V)) err("plan.verification: must be an object { strategy, checks }");
  else {
    need(V, "strategy", "plan.verification"); budget(V.strategy, 80, "plan.verification.strategy");
    const checks = list(V, "checks", "plan.verification");
    ids(checks, "plan.verification.checks");
    const covered = new Set();
    checks.forEach((c, i) => {
      const w = `plan.verification.checks[${i}] "${c?.id}"`;
      if (!CHECK.includes(c?.kind)) err(`${w}.kind: one of ${CHECK.join(", ")}`);
      for (const k of ["by", "what", "pass"]) if (!str(c?.[k])) err(`${w}.${k}: missing`);
      if (/fable/i.test(c?.by || "") && c?.kind === "browser") err(`${w}: Fable never drives a browser; an Opus agent runs browser checks`);
      (c?.tickets || []).forEach((t) => { if (!tIds.has(t)) err(`${w}: unknown ticket "${t}"`); covered.add(t); });
      if (!isArr(c?.tickets) || !c.tickets.length) err(`${w}: names no tickets`);
      budget(c?.what, 30, `${w}.what`); budget(c?.pass, 30, `${w}.pass`);
    });
    if (checks.length) tickets.forEach((t) => { if (!covered.has(t.id)) warn(`ticket "${t.id}" is in no check under How we prove it`); });
  }

  // no time estimates in the plan
  const TIME = /\b(tonight|tomorrow|this week|next week|by (mon|tue|wed|thu|fri|sat|sun)[a-z]*|\d+(\.\d+)?\s?(hrs?|hours?|days?|weeks?|mins?|minutes?))\b/i;
  const scanTime = (v, where) => { if (isStr(v)) { const m = v.match(TIME); if (m) warn(`${where}: "${m[0]}" reads as a time estimate; the plan has none`); } else if (isArr(v)) v.forEach((x, i) => scanTime(x, `${where}[${i}]`)); else if (isObj(v)) for (const [k, x] of Object.entries(v)) scanTime(x, `${where}.${k}`); };
  scanTime(P, "plan");

  counts.tickets = tickets.length; counts.commits = tickets.length; counts.waves = waves.length; counts.prs = prs.length;
  const juncs = waves.flatMap((w) => (isArr(w.then) ? w.then : []));
  counts.reviews = juncs.filter((j) => j?.kind === "code-review" || j?.kind === "critical-review").length;
  counts.browser = juncs.filter((j) => j?.kind === "browser-check").length;
  if (prs.length && juncs.filter((j) => j?.kind === "code-review").length < prs.length) warn(`plan: ${prs.length} pull requests but ${juncs.filter((j) => j?.kind === "code-review").length} code reviews; a Fable agent reviews every pull request`);

  // ---------- proof ----------
  const F = book.proof;
  if (F !== undefined) {
    if (!isObj(F)) err("proof: must be an object { prs, items, not_verified }");
    else {
      list(F, "prs", "proof").forEach((x, i) => { if (!pIds.has(x?.id)) err(`proof.prs[${i}]: unknown pull request "${x?.id}"`); if (x?.url !== undefined && !isStr(x.url)) err(`proof.prs[${i}].url: must be a string`); });
      list(F, "items", "proof").forEach((x, i) => {
        const w = `proof.items[${i}]`;
        if (!tIds.has(x?.ticket)) err(`${w}: unknown ticket "${x?.ticket}"`);
        if (!str(x?.result)) err(`${w}.result: say what was shown`);
        const e = x?.evidence;
        if (!isObj(e) || !["image", "text", "number"].includes(e.kind)) err(`${w}.evidence: { kind: image | text | number, src, text }`);
        else if (e.kind === "image") { if (!str(e.src)) err(`${w}.evidence.src: an image needs src`); else srcRefs.push([e.src, w, false]); if (str(e.before)) srcRefs.push([e.before, `${w}.before`, false]); }
        else if (!str(e.text) && typeof e.text !== "number") err(`${w}.evidence.text: missing`);
        if (!str(x?.commit)) warn(`${w}: no commit; evidence is tied to the commit it saw`);
      });
      list(F, "not_verified", "proof").forEach((x, i) => { if (!str(x)) err(`proof.not_verified[${i}]: must be text`); });
      // views: the finished result itself (a saved copy of a page, a recording page, a screenshot), shown first under See it
      list(F, "views", "proof").forEach((v, i) => {
        const w = `proof.views[${i}]`;
        if (!str(v?.label)) err(`${w}.label: missing`);
        if (!["shot", "proto"].includes(v?.kind)) err(`${w}.kind: one of shot, proto`);
        if (!str(v?.src)) err(`${w}.src: missing`); else srcRefs.push([v.src, w, v.kind === "proto"]);
        budget(v?.caption, 25, `${w}.caption`);
      });
    }
  }
} else if (book.proof !== undefined) err("proof: needs a plan");

// ---------- no time keys anywhere, no dashes in human text ----------
const TIME_KEYS = new Set(["estimate", "eta", "due", "timeline", "when", "deadline"]);
const SKIP = new Set(["url", "src", "before", "evidence", "files", "branch", "base", "commit", "path"]);
function scan(v, where, key) {
  if (TIME_KEYS.has(key)) err(`${where}: "${key}" is a time estimate; the book has none`);
  if (isStr(v)) { if (SKIP.has(key)) return; const m = v.match(/[\u2013\u2014]/); if (m) err(`${where}: has ${m[0] === "\u2014" ? "an em" : "an en"} dash; use plain words or a comma`); }
  else if (isArr(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`, key));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) scan(x, where ? `${where}.${k}` : k, k);
}
scan(book, "", "");

// ---------- files: book.json plus everything under agent/, shots/ and proto/ ----------
const filesMap = { "agent/book.json": bookPath };
function walk(rel) {
  const abs = path.join(dir, rel);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) walk(r); else if (e.isFile()) filesMap[r] = path.join(dir, r);
  }
}
["agent", "shots", "proto"].forEach(walk);
srcRefs.forEach(([src, where, external]) => {
  if (/^https?:\/\//i.test(src)) { if (!external) warn(`${where}: "${src}" is outside the book; images belong under shots/ or agent/proof/`); return; }
  if (src.startsWith("/") || src.includes("..")) { err(`${where}: "${src}" must be a path inside the book folder`); return; }
  if (!filesMap[src]) err(`${where}: "${src}" is not published; put it under shots/, proto/ or agent/`);
});
const SECRET = /(^|\/)(\.env[^/]*|id_rsa[^/]*|[^/]*\.(pem|key|p12))$/i;
for (const p of Object.keys(filesMap)) if (SECRET.test(p)) err(`files: "${p}" looks like a secret; never publish it`);

// ---------- write ----------
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`));
  warnings.forEach((w) => console.error(`warning: ${w}`));
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s). index.html not written.`);
  process.exit(1);
}
let demo = null;
if (demoPath) {
  try { demo = JSON.parse(fs.readFileSync(path.resolve(demoPath), "utf8")); }
  catch (e) { console.error(`error: cannot read demo file ${demoPath}: ${e.message}`); process.exit(1); }
  for (const k of Object.keys(demo)) if (!k.startsWith("_") && !["status", "run", "log"].includes(k)) warn(`demo: "${k}" is not a collection the page reads (status, run, log)`);
}
// ASCII only: the page may be served without a charset (local preview), so every other character goes as an escape
const safeJSON = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
const escHTML = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u007f-\uffff]/g, (c) => "&#" + c.charCodeAt(0) + ";");
const build = { built: new Date().toISOString(), counts, published: Object.keys(filesMap).sort() };
let tpl;
try { tpl = fs.readFileSync(TEMPLATE, "utf8"); }
catch (e) { console.error(`error: cannot read template ${TEMPLATE}: ${e.message}`); process.exit(1); }
const fill = (t, token, value) => { if (!t.includes(token)) { console.error(`error: template is missing ${token}`); process.exit(1); } return t.split(token).join(value); };
let html = fill(tpl, "__TITLE__", escHTML(book.title));
html = fill(html, "/*BOOK_JSON*/", safeJSON(book));
html = fill(html, "/*BUILD_JSON*/", safeJSON(build));
html = fill(html, "/*DEMO_JSON*/", demo ? safeJSON(demo) : "");
const out = path.join(dir, "index.html");
fs.writeFileSync(out, html);
const kb = Buffer.byteLength(html) / 1024;
if (kb > 300) warn(`index.html is ${kb.toFixed(0)} KB; move long text into agent files`);
if (preview) {
  const skel = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>`;
  fs.writeFileSync(path.join(dir, "preview.html"), skel + html + "</body></html>");
}
const home = os.homedir();
const tilde = (p) => (p.startsWith(home) ? "~" + p.slice(home.length) : p);
warnings.forEach((w) => console.error(`warning: ${w}`));
console.error(`wrote ${tilde(out)} (${kb.toFixed(0)} KB), ${Object.keys(filesMap).length} published file(s), ${warnings.length} warning(s)${preview ? ", preview.html" : ""}${demo ? ", with sample live data" : ""}`);
console.error(`plan: ${counts.tickets} tickets, ${counts.waves} waves, ${counts.prs} pull requests, ${counts.commits} commits, ${counts.reviews} code reviews, ${counts.browser} browser checks`);
process.stdout.write(JSON.stringify(filesMap, null, 2) + "\n");
