#!/usr/bin/env node
// Build the book page.
//   node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]
// Reads <book-dir>/book.json, checks it, writes <book-dir>/index.html from assets/book.html,
// and prints the Artifact `files` map (published path -> absolute source path) as JSON on stdout.
// Errors and warnings go to stderr. Exit 1 on any error; warnings never stop the build, but fix them.
//   --demo     sample live state for preview.html only (labelled as sample); index.html never carries it
//   --preview  also write <book-dir>/preview.html for opening locally. Never publish preview.html.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(here, "../assets/book.html");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) { console.error(`${name} needs a file. Usage: node scripts/build.mjs <book-dir> [--demo <db-seed.json>] [--preview]`); process.exit(1); }
  args.splice(i, 2); return v;
};
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

let tpl;
try { tpl = fs.readFileSync(TEMPLATE, "utf8"); }
catch (e) { console.error(`error: cannot read template ${TEMPLATE}: ${e.message}`); process.exit(1); }

// The page's expression language, read from the template so the checker and the page agree.
const exprSrc = tpl.match(/\/\*EXPR-START\*\/([\s\S]*?)\/\*EXPR-END\*\//);
if (!exprSrc) { console.error("error: template has no /*EXPR-START*/ block"); process.exit(1); }
const Expr = new Function(exprSrc[1] + "\nreturn Expr;")();

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
const KINDS = ["production", "tests", "docs and config"];
const CERTAINTY = ["measured", "estimated", "designed"];
const COMPONENTS = ["story", "compare", "map", "steps", "capabilities", "risks", "scale", "cost", "build", "decided", "roadmap", "chapter",
  "inventory", "cards", "research", "decisions", "plan", "verification", "kickoff", "progress", "figure"];
const DEPTH_KINDS = ["table", "text", "list", "figure", "file", "code"];
const FIGURES = ["steps", "stack", "bars", "line", "layers"];
const INV_STATES = ["proven", "built", "planned", "later"];
const RESERVED_SECTIONS = new Set(["choice", "reference", "main", "digest", "live", "mark", "nav", "theme", "skip", "top"]);
const nonEmptyStr = (v) => isStr(v) && v.trim() !== "";
const nonEmptyArr = (v) => isArr(v) && v.length > 0;
function need(obj, key, where, test = (v) => v !== undefined && v !== null && v !== "", what = "a value") {
  if (!isObj(obj) || !test(obj[key])) { err(`${where}.${key}: missing or not ${what}`); return false; }
  return true;
}
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
function words(t) { return String(t || "").replace(/\{[^{}]*\}/g, "x").trim().split(/\s+/).filter(Boolean).length; }

// ---------- required top level ----------
for (const k of ["id", "title", "updated"]) need(book, k, "book", nonEmptyStr, "a string");
if (isStr(book.id) && !KEBAB.test(book.id)) err(`book.id "${book.id}": ids are kebab-case`);
need(book, "profile", "book", (v) => PROFILES.includes(v), `one of ${PROFILES.join(", ")}`);
if (need(book, "round", "book", isObj, "an object")) {
  need(book.round, "n", "book.round", (v) => Number.isInteger(v) && v >= 1, "a whole number");
  need(book.round, "stage", "book.round", (v) => STAGES.includes(v), `one of ${STAGES.join(", ")}`);
}
if (book.updated && isNaN(Date.parse(book.updated))) err("book.updated: not a date");
for (const k of ["links", "findings", "research", "prototypes", "history", "files", "decided", "sections"]) {
  if (book[k] !== undefined && !isArr(book[k])) err(`book.${k}: must be a list`);
}
const profile = book.profile;
const stageIdx = STAGES.indexOf(book.round?.stage);

// ---------- an old book: derive a minimal section list so it still builds ----------
const isNew = isArr(book.sections);
const REMOVED = { needs: "a list of things waiting on the reader; questions go to the chat, and one blocking choice goes in book.blocking",
  glossary: "a glossary; define each term in the sentence that first uses it", decisions: "open questions with options; decide and record in book.decided, ask in the chat",
  layout: "a side list layout; sections render in the order of book.sections" };
for (const [k, why] of Object.entries(REMOVED)) {
  if (book[k] === undefined || (isArr(book[k]) && !book[k].length)) continue;
  (isNew ? err : warn)(`book.${k}: removed (${why})`);
}
if (isObj(book.summary) && book.summary.points !== undefined) (isNew ? err : warn)("summary.points: removed; the story section holds one claim, one lead and three numbers");
if (!isNew) {
  const S = isObj(book.summary) ? book.summary : {};
  book.sections = [{ id: "story", component: "story", claim: S.headline || book.tagline || book.title, lead: S.text || book.problem?.statement || "",
    data: { numbers: (S.numbers || []).slice(0, 3).map((n) => ({ value: String(n.value), label: n.label })) } }];
  if (isArr(book.plan?.waves) && book.plan.waves.length) book.sections.push({ id: "build", component: "build", label: "The build", claim: "Each step is proven before the next one starts.", lead: "Pick a step to see its pieces of work. Open one to see what done means and the proof." });
  (preview ? warn : err)("book.sections: missing, so this is an old book. It builds only as a preview (--preview), showing a story and the build; migrate before publishing (references/data-model.md).");
}

// ---------- the shared model ----------
const MODEL = isObj(book.model) ? book.model : { inputs: [], values: {} };
if (book.model !== undefined && !isObj(book.model)) err("model: must be an object { inputs, values }");
const inputIds = ids(MODEL.inputs, "model.inputs");
const scopeNames = new Set(inputIds);
const defaults = {};
(MODEL.inputs || []).forEach((x, i) => {
  if (!isObj(x)) return;
  const w = `model.inputs[${i}] "${x.id}"`;
  if (!nonEmptyStr(x.label)) err(`${w}: needs label`);
  if (x.stops !== undefined) {
    if (!isArr(x.stops) || x.stops.length < 2 || !x.stops.every((v) => typeof v === "number")) err(`${w}.stops: a list of at least two numbers`);
    else if (x.stops.some((v, j) => j && v <= x.stops[j - 1])) err(`${w}.stops: must rise`);
    else if (x.default !== undefined && !x.stops.includes(x.default)) err(`${w}.default: ${x.default} is not one of its stops`);
    defaults[x.id] = x.default ?? x.stops?.[0];
  } else if (x.options !== undefined) {
    if (!isArr(x.options) || x.options.length < 2 || x.options.some((o) => !isObj(o) || o.value === undefined || !nonEmptyStr(o.label))) err(`${w}.options: a list of at least two { value, label }`);
    else if (x.default !== undefined && !x.options.some((o) => o.value === x.default)) err(`${w}.default: not one of its options`);
    defaults[x.id] = x.default ?? x.options?.[0]?.value;
  } else {
    if (typeof x.min !== "number" || typeof x.max !== "number") err(`${w}: needs stops, options, or min and max`);
    defaults[x.id] = x.default ?? x.min;
  }
});
const chapterJsAll = []; // filled below; a value may name a function a chapter registers in BOOKFN
const valueNames = [];
if (MODEL.values !== undefined && !isObj(MODEL.values)) err("model.values: must be an object { name: expression }");
for (const [name, src] of Object.entries(isObj(MODEL.values) ? MODEL.values : {})) {
  if (!/^[A-Za-z_]\w*$/.test(name)) { err(`model.values.${name}: a name is letters, digits and _`); continue; }
  if (scopeNames.has(name)) { err(`model.values.${name}: also an input`); continue; }
  try {
    const { refs } = Expr.compile(src);
    refs.forEach((r) => { if (!scopeNames.has(r)) err(`model.values.${name}: "${r}" is not an input or an earlier value`); });
  } catch (e) { valueNames.push([name, src, e.message]); }
  scopeNames.add(name);
}
function modelAt(over = {}) {
  const sc = { ...defaults, ...over };
  for (const [name, src] of Object.entries(isObj(MODEL.values) ? MODEL.values : {})) { try { sc[name] = Expr.eval(src, sc); } catch { sc[name] = NaN; } }
  return sc;
}
function checkExpr(src, where, extra = []) {
  if (src === undefined || src === null || src === "") return;
  if (typeof src !== "string" && typeof src !== "number") { err(`${where}: must be an expression string`); return; }
  try {
    const { refs } = Expr.compile(String(src));
    refs.forEach((r) => { if (!scopeNames.has(r) && !extra.includes(r)) err(`${where}: "${r}" is not in book.model`); });
  } catch (e) { err(`${where}: ${e.message}`); }
}
function checkPlaceholders(text, where, extra = []) {
  if (!isStr(text)) return;
  for (const m of text.matchAll(/\{([^{}]+)\}/g)) {
    const body = m[1], i = body.lastIndexOf("|"), ex = i > 0 ? body.slice(0, i) : body;
    checkExpr(ex, `${where} {${body}}`, extra);
  }
}

// ---------- findings, research ----------
ids(book.findings, "findings");
(book.findings || []).forEach((f, i) => { need(f, "finding", `findings[${i}]`, nonEmptyStr, "a string"); if (f?.impact && !IMPACTS.includes(f.impact)) err(`findings[${i}].impact: one of ${IMPACTS.join(", ")}`); });
ids(book.research, "research");
(book.research || []).forEach((r, i) => need(r, "question", `research[${i}]`, nonEmptyStr, "a string"));

// ---------- plan ----------
// Tickets are pieces of work, each with a goal, done-when and proof. Waves are the steps a person sees.
// When the plan ships through pull requests, one PR per problem category holds its tickets in commit order;
// a ticket's wave is then its PR's wave. PRs, milestones and the PR process are agent mode only.
const plan = book.plan;
const ticketIds = new Set();
const tickets = [];
const waveByN = new Map();
let prIds = new Set();
const prById = new Map();
const owner = new Map();
if (isObj(plan)) {
  const milestoneIds = ids(plan.milestones, "plan.milestones");
  ids(plan.tickets, "plan.tickets").forEach((x) => ticketIds.add(x));
  (plan.waves || []).forEach((w, i) => {
    if (!Number.isInteger(w?.n)) { err(`plan.waves[${i}].n: missing`); return; }
    if (waveByN.has(w.n)) err(`plan.waves: duplicate wave ${w.n}`);
    waveByN.set(w.n, w);
    if (!nonEmptyStr(w.name) && !nonEmptyStr(w.title)) err(`plan.waves[${i}]: needs name, two plain words a person reads ("Engine")`);
    if (!nonEmptyStr(w.what) && !nonEmptyStr(w.why)) warn(`plan.waves[${i}]: needs what, eight words on what the step gives`);
    if (w.id !== undefined && !KEBAB.test(w.id)) err(`plan.waves[${i}].id: kebab-case`);
  });
  const tById = new Map();
  (plan.tickets || []).forEach((t) => { if (isObj(t)) { tickets.push(t); tById.set(t.id, t); } });
  if (plan.branches !== undefined && !isObj(plan.branches)) err("plan.branches: must be an object { development, production, naming }");
  const branchNames = new Set([plan.branches?.development, plan.branches?.production].filter(Boolean));
  if (plan.prs !== undefined && !isArr(plan.prs)) err("plan.prs: must be a list");
  prIds = ids(plan.prs, "plan.prs");
  (plan.prs || []).filter(isObj).forEach((x) => prById.set(x.id, x));
  const usesPRs = prById.size > 0;
  const pos = new Map();
  const RANK = { low: 0, medium: 1, high: 2 };
  (plan.prs || []).forEach((pr, i) => {
    if (!isObj(pr)) return;
    const w = `plan.prs[${i}] "${pr.id}"`;
    need(pr, "title", w, nonEmptyStr, "a string");
    if (!nonEmptyArr(pr.tickets)) err(`${w}: needs "tickets", its tickets in commit order`);
    (pr.tickets || []).forEach((t, j) => {
      if (!tById.has(t)) { err(`${w}: unknown ticket "${t}"`); return; }
      if (owner.has(t)) { err(owner.get(t) !== pr.id ? `ticket "${t}" is in two PRs ("${owner.get(t)}" and "${pr.id}"); a ticket is one commit in one PR` : `${w}: lists ticket "${t}" twice`); return; }
      owner.set(t, pr.id); pos.set(t, j);
    });
    if (!waveByN.has(pr.wave)) err(`${w}: unknown wave ${JSON.stringify(pr.wave)}`);
    if (pr.base !== undefined) {
      if (!nonEmptyStr(pr.base)) err(`${w}: base must be a branch name or the id of the PR it is stacked on`);
      else if (pr.base === pr.id) err(`${w}: is stacked on itself`);
      else if (!prIds.has(pr.base) && branchNames.size && !branchNames.has(pr.base)) err(`${w}: base "${pr.base}" is neither a branch in plan.branches nor a PR id`);
    }
    if (pr.risk !== undefined && !RISKS.includes(pr.risk)) err(`${w}: risk must be one of ${RISKS.join(", ")}`);
    const top = (pr.tickets || []).map((t) => tById.get(t)?.risk).filter((r) => RISKS.includes(r)).sort((a, b) => RANK[b] - RANK[a])[0];
    if (RISKS.includes(pr.risk) && top && RANK[pr.risk] < RANK[top]) warn(`${w}: risk is ${pr.risk} but a ticket in it is ${top}; a PR carries the highest risk of its tickets`);
    (pr.depends_on || []).forEach((d) => { if (d === pr.id) err(`${w}: depends on itself`); else if (!prIds.has(d)) err(`${w}: depends on unknown PR "${d}"`); });
    for (const k of ["areas", "shares", "proof", "depends_on"]) if (pr[k] !== undefined && !(isArr(pr[k]) && pr[k].every(isStr))) err(`${w}.${k}: must be a list of strings`);
    if (pr.hotfix !== undefined) {
      if (!isObj(pr.hotfix) || !nonEmptyStr(pr.hotfix.base)) err(`${w}.hotfix: needs base, the production branch the commit also goes to`);
      else (pr.hotfix.tickets || []).forEach((t) => { if (!(pr.tickets || []).includes(t)) err(`${w}.hotfix: "${t}" is not a commit in this PR`); });
    }
  });
  prById.forEach((pr, id) => {
    const under = prById.get(pr.base);
    if (under && under !== pr && Number.isInteger(under.wave) && Number.isInteger(pr.wave) && under.wave > pr.wave) err(`PR "${id}" (wave ${pr.wave}) is stacked on PR "${pr.base}" from later wave ${under.wave}`);
    const seen = new Set([id]);
    for (let b = prById.get(pr.base); b; b = prById.get(b.base)) { if (seen.has(b.id)) { err(`PR "${id}": its stack loops back through PR "${b.id}"`); break; } seen.add(b.id); }
    (pr.depends_on || []).forEach((d) => {
      const dep = prById.get(d);
      if (dep && d !== id && Number.isInteger(dep.wave) && Number.isInteger(pr.wave) && dep.wave >= pr.wave) err(`PR "${id}" (wave ${pr.wave}) depends on PR "${d}" in ${dep.wave === pr.wave ? "the same wave" : "later wave " + dep.wave}`);
    });
  });
  const onBase = new Map();
  prById.forEach((pr) => { if (nonEmptyStr(pr.base)) onBase.set(pr.base, [...(onBase.get(pr.base) || []), pr.id]); });
  onBase.forEach((on, base) => { if (on.length > 1) warn(`PRs ${on.map((x) => `"${x}"`).join(", ")} all sit on "${base}"; the stack is one line`); });
  (plan.waves || []).forEach((wv) => {
    if (!Number.isInteger(wv?.n)) return;
    (wv.prs || []).forEach((id) => {
      if (!prIds.has(id)) err(`wave ${wv.n}: unknown PR "${id}"`);
      else if (prById.get(id).wave !== wv.n) err(`wave ${wv.n} lists PR "${id}", but the PR says wave ${prById.get(id).wave}`);
    });
    const mine = [...prById.values()].filter((p) => p.wave === wv.n);
    if (wv.prs) mine.forEach((p) => { if (!wv.prs.includes(p.id)) err(`PR "${p.id}" says wave ${wv.n}, but wave ${wv.n} does not list it`); });
    if (mine.length > 6) warn(`wave ${wv.n}: ${mine.length} PRs; six at most unless the user raised it`);
    const owned = [];
    mine.forEach((p) => (isArr(p.areas) ? p.areas : []).forEach((f) => owned.push({ pr: p.id, f: String(f).toLowerCase().replace(/\/+$/, "") })));
    const seen = new Set();
    for (let i = 0; i < owned.length; i++) for (let j = i + 1; j < owned.length; j++) {
      const x = owned[i], y = owned[j], under = (p, q) => p === q || q.startsWith(p + "/");
      if (x.pr === y.pr || (!under(x.f, y.f) && !under(y.f, x.f))) continue;
      const key = [x.pr, y.pr].sort().join("|"); if (seen.has(key)) continue; seen.add(key);
      warn(`wave ${wv.n}: PRs "${x.pr}" and "${y.pr}" both own "${x.f.length <= y.f.length ? x.f : y.f}"; run them in order or split the area`);
    }
  });
  const waveOf = (t) => (owner.has(t.id) ? prById.get(owner.get(t.id))?.wave : t.wave);
  tickets.forEach((t, i) => {
    const w = `plan.tickets[${i}] "${t.id}"`;
    for (const k of ["title", "goal"]) need(t, k, w, nonEmptyStr, "a string");
    need(t, "done_when", w, nonEmptyArr, "a non-empty list");
    // every ticket carries what a person needs to judge it (references/planning.md)
    need(t, "files", w, nonEmptyArr, "a non-empty list of the files or folders it touches");
    need(t, "depends_on", w, isArr, "a list (empty when it waits for nothing)");
    if (!(nonEmptyStr(t.verify) || (isObj(t.verify) && nonEmptyStr(t.verify.run)))) err(`${w}.verify: missing; how it is verified, a sentence or { run, expect }`);
    if (profile === "large") for (const k of ["size", "risk"]) need(t, k, w, nonEmptyStr, "a value");
    if (t.acceptance !== undefined && !(isArr(t.acceptance) && t.acceptance.every(nonEmptyStr))) err(`${w}.acceptance: a list of the full acceptance lines`);
    if (t.hours !== undefined && !(typeof t.hours === "number" && t.hours > 0)) err(`${w}.hours: a number of hours`);
    if (t.milestone !== undefined && milestoneIds.size && !milestoneIds.has(t.milestone)) err(`${w}: unknown milestone "${t.milestone}"`);
    if (t.size && !SIZES.includes(t.size)) err(`${w}: size must be one of ${SIZES.join(", ")}`);
    if (t.size === "S") warn(`${w}: size S; fold it into a goal-sized ticket`);
    if (t.risk && !RISKS.includes(t.risk)) err(`${w}: risk must be one of ${RISKS.join(", ")}`);
    if (t.short !== undefined) warn(`${w}: "short" is dropped; the title is the one name used everywhere`);
    const mine = owner.get(t.id);
    if (usesPRs && !mine) err(`${w}: is in no PR; every ticket is one commit in exactly one PR`);
    if (t.pr !== undefined && mine && t.pr !== mine) err(`${w}: pr is "${t.pr}", but PR "${mine}" lists it`);
    if (t.wave !== undefined && mine && prById.get(mine)?.wave !== t.wave) err(`${w}: wave ${t.wave}, but its PR "${mine}" is in wave ${prById.get(mine)?.wave}`);
    if (!usesPRs && waveByN.size && !waveByN.has(t.wave)) err(`${w}: names no known wave; without PRs a ticket says its wave in "wave"`);
    if (/^(pr|check|ready)-/.test(t.id)) err(`${w}: a ticket id may not start with pr-, check- or ready-; those name live status documents`);
    if (t.after_merge !== undefined && !(isArr(t.after_merge) && t.after_merge.every(nonEmptyStr))) err(`${w}.after_merge: must be a list of strings`);
    (t.depends_on || []).forEach((d) => {
      if (!tById.has(d)) { err(`${w}: depends on unknown ticket "${d}"`); return; }
      if (d === t.id) { err(`${w}: depends on itself`); return; }
      const theirs = owner.get(d);
      if (mine && theirs && mine === theirs) { if (pos.get(d) > pos.get(t.id)) err(`${w}: depends on "${d}", a later commit in its own PR "${mine}"`); return; }
      const a = waveOf(t), b = waveOf(tById.get(d));
      if (Number.isInteger(a) && Number.isInteger(b) && b > a) err(`${w}: depends on "${d}" from a later wave`);
      if (usesPRs && Number.isInteger(a) && Number.isInteger(b) && b === a) err(`${w}: depends on "${d}" in another PR of the same wave; a ticket depends only on earlier commits in its own PR or on earlier waves`);
    });
  });
  (plan.review_policy || []).forEach((x, i) => { if (!RISKS.includes(x?.risk)) err(`plan.review_policy[${i}].risk: one of ${RISKS.join(", ")}`); });
  if (plan.stop_rules !== undefined && !(isArr(plan.stop_rules) && plan.stop_rules.every(isStr))) err("plan.stop_rules: must be a list of strings");
  if (plan.heartbeat_minutes !== undefined && !(typeof plan.heartbeat_minutes === "number" && plan.heartbeat_minutes > 0)) err("plan.heartbeat_minutes: a number of minutes");

  // the verification checklist
  const V = isArr(plan.verification) ? { building: plan.verification } : plan.verification;
  if (V !== undefined) {
    if (!isObj(V)) err("plan.verification: must be an object { summary, where, ready, building, runs, checks }");
    else {
      const list = (k) => { if (V[k] === undefined) return []; if (isArr(V[k])) return V[k]; err(`plan.verification.${k}: must be a list`); return []; };
      const READY = list("ready"), RUNS = list("runs"), CHECKS = list("checks");
      ids(READY, "plan.verification.ready");
      READY.forEach((r, i) => { if (!nonEmptyStr(r?.need)) err(`plan.verification.ready[${i}]: needs need`); if (r?.state !== undefined && !["ok", "missing", "unknown"].includes(r.state)) err(`plan.verification.ready[${i}]: state is ok, missing or unknown`); });
      ids(RUNS, "plan.verification.runs");
      const runAt = new Map(RUNS.filter((r) => nonEmptyStr(r?.id)).map((r) => [r.id, RUNS.indexOf(r)]));
      RUNS.forEach((r, i) => { if (r?.needs && !(runAt.get(r.needs) < i)) err(`plan.verification.runs[${i}]: needs "${r.needs}", which must be an earlier run`); });
      const covered = new Set();
      ids(CHECKS, "plan.verification.checks");
      CHECKS.forEach((c, i) => {
        const w = `plan.verification.checks[${i}] "${c?.id}"`;
        if (!["code", "screen", "watch", "ask", "measure"].includes(c?.kind)) { err(`${w}: kind is code, screen, watch, ask or measure`); return; }
        for (const k of ["title", "expect", "pass"]) if (!nonEmptyStr(c[k])) err(`${w}: needs ${k}`);
        if (!isArr(c.tickets) || !c.tickets.length) err(`${w}: names no tickets`);
        else c.tickets.forEach((t) => { if (!ticketIds.has(t)) err(`${w}: unknown ticket "${t}"`); covered.add(t); });
        if (["watch", "ask", "measure"].includes(c.kind) && !runAt.has(c.run)) err(`${w}: a ${c.kind} check names one of plan.verification.runs in run`);
        else if (c.run !== undefined && c.run !== "" && !runAt.has(c.run)) err(`${w}: unknown run "${c.run}"`);
        if (c.kind === "ask" && !nonEmptyStr(c.say)) err(`${w}: an ask check gives the words a person types in say`);
      });
      if (CHECKS.length && tickets.length && CHECKS.length > Math.ceil(tickets.length * 0.75)) warn(`plan.verification: ${CHECKS.length} checks for ${tickets.length} tickets; aim for about one per two tickets`);
      if (CHECKS.length) tickets.forEach((t) => { if (!covered.has(t.id)) err(`plan.verification: ticket "${t.id}" has no final check`); });
    }
  }
}

// ---------- report ----------
const rep = book.report;
if (isObj(rep)) {
  (rep.proof || []).forEach((p, i) => {
    if (p.verdict && !VERDICTS.includes(p.verdict)) err(`report.proof[${i}].verdict: one of ${VERDICTS.join(", ")}`);
    if (p.ticket && !ticketIds.has(p.ticket)) err(`report.proof[${i}]: unknown ticket "${p.ticket}"`);
  });
  (rep.totals?.by_kind || []).forEach((x, i) => { if (!KINDS.includes(x?.kind)) err(`report.totals.by_kind[${i}].kind: one of ${KINDS.join(", ")}`); });
  for (const k of ["works_now", "not_proven"]) if (rep[k] !== undefined && !(isArr(rep[k]) && rep[k].every(isStr))) err(`report.${k}: must be a list of strings`);
}

// ---------- decided and the one blocking choice ----------
const sectionIds = new Set((book.sections || []).map((x) => x?.id).filter(Boolean));
const decidedIds = new Set();
(book.decided || []).forEach((d, i) => {
  const w = `decided[${i}]`;
  if (!isObj(d)) { err(`${w}: not an object`); return; }
  need(d, "what", w, nonEmptyStr, "a string");
  need(d, "why", w, nonEmptyStr, "a string");
  if (!nonEmptyStr(d.who)) err(`${w}.who: say who decided ("model" or the person's name)`);
  if (d.when === undefined) warn(`${w}.when: say when it was decided`);
  else if (isNaN(Date.parse(d.when))) err(`${w}.when: not a date`);
  if (d.id !== undefined) { if (!KEBAB.test(d.id)) err(`${w}.id: kebab-case`); if (decidedIds.has(d.id)) err(`${w}: duplicate id "${d.id}"`); decidedIds.add(d.id); }
  if (d.section !== undefined && !sectionIds.has(d.section)) err(`${w}.section: "${d.section}" is not a section id`);
});
if (book.blocking !== undefined && book.blocking !== null) {
  const b = book.blocking;
  if (!isObj(b)) err("blocking: must be an object { question, why, options, default }");
  else if (!b.resolved) {
    need(b, "question", "blocking", nonEmptyStr, "a string");
    need(b, "why", "blocking", nonEmptyStr, "one sentence on why the model cannot decide this itself");
    if (!isArr(b.options) || b.options.length < 2) err("blocking.options: at least two { label, effect }");
    need(b, "default", "blocking", nonEmptyStr, "what happens until they answer");
  }
}

// ---------- sections ----------
const SECS = book.sections || [];
const secSeen = new Set();
let storyCount = 0;
const human = []; // [where, text, budget, onLoad]
function labels(x, keys, where) {
  if (x === undefined) return;
  if (!isObj(x)) { err(`${where}: an object of ${keys.join(", ")}`); return; }
  for (const k of Object.keys(x)) { if (!keys.includes(k)) err(`${where}.${k}: one of ${keys.join(", ")}`); else if (!nonEmptyStr(x[k])) err(`${where}.${k}: a word or two`); else H(`${where}.${k}`, x[k], 3, false); }
}
const H = (where, text, max, onLoad = true, depth = false) => { if (isStr(text) && text.trim()) human.push([where, text, max, onLoad, depth]); };
const GROUPS = new Set();
if (book.groups !== undefined) {
  if (!isArr(book.groups) || !book.groups.length) err("book.groups: a list of { id, label }, the side menu's groups in order");
  else { ids(book.groups, "book.groups").forEach((x) => GROUPS.add(x)); book.groups.forEach((g, i) => { if (!nonEmptyStr(g?.label)) err(`book.groups[${i}]: needs label`); else H(`book.groups[${i}].label`, g.label, 3); }); }
}
// ---------- depth blocks: the second layer under each section, for people ----------
const ROLES = new Map(); // role -> [{ sec, block }]
const depthBlocks = [];
const roleOf = (b) => b?.role || b?.data?.role;
const sourcePaths = []; // [path, where]
function srcPath(src) { return isStr(src) ? src : isObj(src) ? src.path || src.url : undefined; }
function checkCell(v, where) {
  if (isObj(v) && (v.url || v.ticket || v.file)) { H(where, v.label || "", 25, false, true); if (v.file) sourcePaths.push([v.file, where]); return; }
  if (!(isStr(v) || typeof v === "number" || v === null)) { err(`${where}: a cell is a string, a number, or { label, url | file | ticket }`); return; }
  if (isStr(v)) H(where, v, 25, false, true);
}
function checkFigure(f, where) {
  if (!isObj(f) || !FIGURES.includes(f.type)) { err(`${where}.type: one of ${FIGURES.join(", ")}`); return; }
  if (f.type === "line") {
    if (!nonEmptyArr(f.series) || f.series.length > 3) err(`${where}.series: one to three { name, points: [[x, y]] }`);
    (f.series || []).forEach((x, i) => { if (!nonEmptyStr(x?.name) || !nonEmptyArr(x?.points) || !x.points.every((p) => isArr(p) && p.length === 2 && p.every((v) => typeof v === "number"))) err(`${where}.series[${i}]: { name, points: [[x, y], ...] } with numbers`); });
    H(`${where}.x_label`, f.x_label, 4, false, true); H(`${where}.y_label`, f.y_label, 4, false, true);
  } else {
    if (!nonEmptyArr(f.items)) { err(`${where}.items: needs items`); return; }
    f.items.forEach((x, i) => {
      if (!nonEmptyStr(x?.label)) err(`${where}.items[${i}]: needs label`);
      if (f.type !== "layers" && typeof x?.value !== "number") err(`${where}.items[${i}].value: a number`);
      H(`${where}.items[${i}].label`, x?.label, 8, false, true); H(`${where}.items[${i}].note`, x?.note, 20, false, true); H(`${where}.items[${i}].wall`, x?.wall, 20, false, true);
    });
  }
  H(`${where}.note`, f.note, 40, false, true);
}
function checkDepth(sec, w) {
  if (sec.depth === undefined) return;
  if (!isArr(sec.depth)) { err(`${w}.depth: a list of depth blocks`); return; }
  const seen = new Set();
  sec.depth.forEach((b, i) => {
    const ww = `${w}.depth[${i}]${b?.id ? ` "${b.id}"` : ""}`;
    if (!isObj(b)) { err(`${ww}: not an object`); return; }
    if (!nonEmptyStr(b.id) || !KEBAB.test(b.id)) err(`${ww}.id: missing or not kebab-case`);
    else if (seen.has(b.id)) err(`${ww}: duplicate id in this section`);
    seen.add(b.id);
    if (!nonEmptyStr(b.title)) err(`${ww}.title: says what is inside, six words at most`); else H(`${ww}.title`, b.title, 6, false, true);
    if (!DEPTH_KINDS.includes(b.kind)) { err(`${ww}.kind: one of ${DEPTH_KINDS.join(", ")}`); return; }
    const sp = srcPath(b.source);
    if (!nonEmptyStr(sp)) err(`${ww}.source: required; a published path (an #anchor is fine) or an https URL`); else sourcePaths.push([sp, `${ww}.source`]);
    if (isObj(b.source) && b.source.label !== undefined) H(`${ww}.source.label`, b.source.label, 8, false, true);
    H(`${ww}.lead`, b.lead, 25, false, true);
    const d = b.data;
    if (!isObj(d)) { err(`${ww}.data: an object`); return; }
    const r = roleOf(b); if (nonEmptyStr(r)) { if (!ROLES.has(r)) ROLES.set(r, []); ROLES.get(r).push({ sec, block: b }); }
    depthBlocks.push({ sec, block: b, where: ww });
    if (b.kind === "table") {
      if (!nonEmptyArr(d.columns) || !d.columns.every(nonEmptyStr)) { err(`${ww}.data.columns: a list of column names`); return; }
      d.columns.forEach((c, k) => H(`${ww}.data.columns[${k}]`, c, 6, false, true));
      if (!nonEmptyArr(d.rows)) err(`${ww}.data.rows: needs rows`);
      (d.rows || []).forEach((row, k) => {
        const cells = isArr(row) ? row : isObj(row) ? row.cells : null;
        if (!isArr(cells)) { err(`${ww}.data.rows[${k}]: an array of cells or { cells, detail }`); return; }
        if (cells.length !== d.columns.length) err(`${ww}.data.rows[${k}]: ${cells.length} cells for ${d.columns.length} columns`);
        cells.forEach((v, j) => checkCell(v, `${ww}.data.rows[${k}][${j}]`));
        if (isObj(row) && row.detail !== undefined) { if (!nonEmptyStr(row.detail)) err(`${ww}.data.rows[${k}].detail: text`); else H(`${ww}.data.rows[${k}].detail`, row.detail, 120, false, true); }
      });
      H(`${ww}.data.note`, d.note, 40, false, true);
    } else if (b.kind === "text") {
      if (!nonEmptyArr(d.paragraphs) || !d.paragraphs.every(nonEmptyStr)) err(`${ww}.data.paragraphs: a list of paragraphs`);
      else { if (d.paragraphs.length > 2) err(`${ww}.data.paragraphs: ${d.paragraphs.length}; two in a row at most, then a table, list or figure (split the block)`); d.paragraphs.forEach((p, k) => H(`${ww}.data.paragraphs[${k}]`, p, 60, false, true)); }
    } else if (b.kind === "list") {
      if (!nonEmptyArr(d.items)) err(`${ww}.data.items: needs items`);
      (d.items || []).forEach((x, k) => {
        if (isStr(x)) H(`${ww}.data.items[${k}]`, x, 20, false, true);
        else if (isObj(x) && nonEmptyStr(x.label)) H(`${ww}.data.items[${k}]`, x.label + " " + (x.text || ""), 20, false, true);
        else err(`${ww}.data.items[${k}]: a string or { label, text }`);
      });
    } else if (b.kind === "figure") checkFigure(d, `${ww}.data`);
    else if (b.kind === "file") { if (!nonEmptyStr(d.path)) err(`${ww}.data.path: the published file to show`); else sourcePaths.push([d.path, `${ww}.data.path`]); H(`${ww}.data.note`, d.note, 20, false, true); }
    else if (b.kind === "code") { if (!nonEmptyStr(d.text)) err(`${ww}.data.text: the text to show`); }
  });
}
const nodeName = new Map();
SECS.forEach((sec, i) => {
  const w = `sections[${i}]${sec?.id ? ` "${sec.id}"` : ""}`;
  if (!isObj(sec)) { err(`${w}: not an object`); return; }
  if (!nonEmptyStr(sec.id) || !KEBAB.test(sec.id)) err(`${w}.id: missing or not kebab-case`);
  else if (secSeen.has(sec.id) || RESERVED_SECTIONS.has(sec.id) || /^(book|ch|h|b)-/.test(sec.id)) err(`${w}.id: "${sec.id}" is taken by the page`);
  else if (ticketIds.has(sec.id)) err(`${w}.id: "${sec.id}" is also a ticket id; #<ticket-id> opens that ticket's card`);
  secSeen.add(sec.id);
  const comp = sec.component;
  if (!COMPONENTS.includes(comp)) { err(`${w}.component: one of ${COMPONENTS.join(", ")}; every section opens on a component`); return; }
  if (comp === "story") { storyCount++; if (i !== 0) warn(`${w}: the story is the first section`); }
  const d = isObj(sec.data) ? sec.data : {};
  if (sec.data !== undefined && !isObj(sec.data)) err(`${w}.data: must be an object`);
  const extra = comp === "cost" ? ["shape", "ratio"] : [];
  if (!nonEmptyStr(sec.claim)) err(`${w}.claim: missing; the heading is a claim a stranger understands`);
  else {
    checkPlaceholders(sec.claim, `${w}.claim`, extra);
    const n = words(sec.claim);
    if (comp === "story") H(`${w}.claim`, sec.claim, 12);
    else {
      H(`${w}.claim`, sec.claim, 14);
      if (n < 4) warn(`${w}.claim: "${sec.claim}" reads as a label; write a full sentence that makes a claim`);
      if (/:/.test(sec.claim.replace(/\{[^{}]*\}/g, ""))) warn(`${w}.claim: has a colon; write one plain sentence`);
    }
  }
  H(`${w}.lead`, sec.lead, comp === "story" ? 30 : 40); checkPlaceholders(sec.lead, `${w}.lead`, extra);
  H(`${w}.label`, sec.label, 4);
  if (sec.nav !== undefined && sec.nav !== false) { if (!nonEmptyStr(sec.nav)) err(`${w}.nav: the menu label, a word or three`); else H(`${w}.nav`, sec.nav, 3); }
  if (GROUPS.size) { if (comp !== "story" && !GROUPS.has(sec.group)) err(`${w}.group: one of ${[...GROUPS].join(", ")}; the side menu lists sections by group`); }
  else if (sec.group !== undefined) err(`${w}.group: "${sec.group}" but book.groups is missing`);
  const T = sec.table || d.table;
  if (T !== undefined) (isNew ? err : warn)(`${w}.table: removed; put the table in a depth block { id, title, kind: "table", source, data: { columns, rows } }`);
  checkDepth(sec, w);
  const tk = (id, where) => { if (id !== undefined && !ticketIds.has(id)) err(`${where}: unknown ticket "${id}"`); };
  if (comp === "story") {
    const nums = d.numbers || [];
    if (nums.length > 3) warn(`${w}.data.numbers: ${nums.length}; three at most`);
    nums.forEach((n, j) => {
      const ww = `${w}.data.numbers[${j}]`;
      if (!nonEmptyStr(String(n?.value ?? "")) || !nonEmptyStr(n?.label)) err(`${ww}: needs value and label`);
      if (n?.live !== undefined && n.live !== "proven") err(`${ww}.live: only "proven"`);
      if (!CERTAINTY.includes(n?.certainty) && n?.live !== "proven") warn(`${ww}: no certainty; say measured, estimated or designed`);
      if (isStr(n?.value) && /^[\d.,\s]+$/.test(n.value) && words(n.label) < 2) warn(`${ww}: "${n.value}" has no unit; the label must say what it counts`);
      H(`${ww}.label`, n?.label, 6); H(`${ww}.value`, n?.value, 4);
    });
    if (d.after !== undefined) { H(`${w}.data.after.claim`, d.after.claim, 12, false); H(`${w}.data.after.lead`, d.after.lead, 30, false); }
  }
  if (comp === "map") {
    const nodes = d.nodes || [], nid = new Set();
    if (!nodes.length) err(`${w}.data.nodes: a map needs parts`);
    const parts = nodes.filter((n) => !n?.zone);
    if (parts.length > 12) err(`${w}.data.nodes: ${parts.length} parts; 12 at most. Split it into a second figure`);
    nodes.forEach((n, j) => {
      const ww = `${w}.data.nodes[${j}]`;
      if (!nonEmptyStr(n?.id) || !nonEmptyStr(n?.name)) { err(`${ww}: needs id and name`); return; }
      if (nid.has(n.id)) err(`${ww}: duplicate id "${n.id}"`); nid.add(n.id); nodeName.set(n.id, n.name);
      if (!isArr(n.wide) || n.wide.length !== 4) err(`${ww}.wide: [x, y, width, height] for the wide layout`);
      if (n.tall !== undefined && (!isArr(n.tall) || n.tall.length !== 4)) err(`${ww}.tall: [x, y, width, height]`);
      H(`${ww}.name`, n.name, n.zone ? 3 : 2); if (!n.zone) H(`${ww}.does`, n.does, 4);
    });
    if (nodes.length && nodes.some((n) => !n?.tall)) warn(`${w}: some parts have no tall layout; on a phone the wide map shrinks instead of being redrawn`);
    const eid = new Set();
    (d.edges || []).forEach((e, j) => {
      const ww = `${w}.data.edges[${j}]`;
      if (!nonEmptyStr(e?.id)) { err(`${ww}: needs id`); return; }
      eid.add(e.id);
      if (!nid.has(e.from) || !nid.has(e.to)) err(`${ww}: ${e.from} to ${e.to} names a part not on the map`);
      if (!nonEmptyStr(e.verb)) warn(`${ww}: every arrow has a verb ("sends jobs")`); else H(`${ww}.verb`, e.verb, 3);
    });
    const stories = d.stories || [];
    if (stories.length > 3) warn(`${w}.data.stories: ${stories.length}; three at most`);
    stories.forEach((st, j) => {
      const ww = `${w}.data.stories[${j}]`;
      if (!nonEmptyArr(st?.steps)) { err(`${ww}: needs steps`); return; }
      if (st.steps.length > 7) warn(`${ww}: ${st.steps.length} steps; seven at most`);
      H(`${ww}.name`, st.name, 4);
      st.steps.forEach((x, k) => {
        const s = `${ww}.steps[${k}]`;
        if (!nonEmptyStr(x?.title)) err(`${s}: needs title`);
        if (x?.edge !== undefined && !eid.has(x.edge)) err(`${s}.edge: "${x.edge}" is not an edge of this map`);
        for (const key of ["on", "busy", "dead"]) (x?.[key] || []).forEach((n) => { if (!nid.has(n)) err(`${s}.${key}: "${n}" is not a part of this map`); });
        H(`${s}.title`, x?.title, 5, j === 0); H(`${s}.text`, x?.text, 20, j === 0 && k === 0);
      });
    });
  }
  if (comp === "steps") {
    const st = d.steps || [];
    if (!st.length) err(`${w}.data.steps: needs steps`);
    if (st.length > 7) warn(`${w}.data.steps: ${st.length}; seven at most`);
    st.forEach((x, k) => { if (!nonEmptyStr(x?.title)) err(`${w}.data.steps[${k}]: needs title`); H(`${w}.data.steps[${k}].title`, x?.title, 5); H(`${w}.data.steps[${k}].text`, x?.text, 20, k === 0); });
  }
  if (comp === "compare") {
    for (const side of ["before", "after"]) {
      const x = d[side];
      if (!isObj(x)) { err(`${w}.data.${side}: needs { label, points }`); continue; }
      H(`${w}.data.${side}.label`, x.label, 3);
      if ((x.points || []).length > 3) warn(`${w}.data.${side}.points: three at most`);
      (x.points || []).forEach((p, k) => H(`${w}.data.${side}.points[${k}]`, p, 15, side === (d.start === "before" ? "before" : "after")));
      (x.numbers || []).forEach((n, k) => { H(`${w}.data.${side}.numbers[${k}].label`, n?.label, 6, false); if (!CERTAINTY.includes(n?.certainty)) warn(`${w}.data.${side}.numbers[${k}]: no certainty`); });
    }
    (d.parts || []).forEach((p, k) => { if (!nonEmptyStr(p?.name)) err(`${w}.data.parts[${k}]: needs name`); H(`${w}.data.parts[${k}].name`, p?.name, 3); H(`${w}.data.parts[${k}].after`, p?.after, 6); H(`${w}.data.parts[${k}].before`, p?.before, 6, false); });
    if ((d.parts || []).length > 8) warn(`${w}.data.parts: ${d.parts.length}; eight at most`);
  }
  if (comp === "scale") {
    if (d.input !== undefined && !inputIds.has(d.input)) err(`${w}.data.input: "${d.input}" is not in model.inputs`);
    (d.inputs || []).forEach((x) => { if (!inputIds.has(x)) err(`${w}.data.inputs: "${x}" is not in model.inputs`); });
    if (!nonEmptyArr(d.rows)) err(`${w}.data.rows: needs rows`);
    (d.rows || []).forEach((r, k) => {
      const ww = `${w}.data.rows[${k}]`;
      if (!nonEmptyStr(r?.name)) err(`${ww}: needs name`);
      if (!["cells", "bar", "sizes", "number", undefined].includes(r?.kind)) err(`${ww}.kind: cells, bar, sizes or number`);
      if (r?.kind === "bar" && !(r.max > 0)) err(`${ww}.max: a bar needs max`);
      checkExpr(r?.value, `${ww}.value`); [].concat(r?.unit || []).forEach((u) => checkPlaceholders(u, `${ww}.unit`));
      H(`${ww}.name`, r?.name, 2); H(`${ww}.does`, r?.does, 6);
    });
    (d.say || []).forEach((x, k) => { checkExpr(x?.when, `${w}.data.say[${k}].when`); checkPlaceholders(x?.text, `${w}.data.say[${k}].text`); H(`${w}.data.say[${k}].text`, x?.text, 30, k === 0); });
    (d.flags || []).forEach((x, k) => { checkExpr(x?.when, `${w}.data.flags[${k}].when`); checkPlaceholders(x?.text, `${w}.data.flags[${k}].text`); H(`${w}.data.flags[${k}].text`, x?.text, 30, false); });
    H(`${w}.data.calm`, d.calm, 15);
    if (!CERTAINTY.includes(d.certainty)) warn(`${w}.data.certainty: the figures are numbers; say measured, estimated or designed`);
  }
  if (comp === "cost") {
    if (!inputIds.has(d.x?.input)) err(`${w}.data.x.input: names the model input on the across axis`);
    const series = d.series || [];
    if (series.length < 1 || series.length > 3) err(`${w}.data.series: one to three lines`);
    series.forEach((x, k) => { if (!nonEmptyStr(x?.name)) err(`${w}.data.series[${k}]: needs name`); checkExpr(x?.value, `${w}.data.series[${k}].value`); H(`${w}.data.series[${k}].name`, x?.name, 3); });
    if (series.filter((x) => x?.ours).length > 1) err(`${w}.data.series: one line is ours at most`);
    (d.readouts || []).forEach((x, k) => { checkExpr(x?.value, `${w}.data.readouts[${k}].value`); H(`${w}.data.readouts[${k}].label`, x?.label, 5); if (isStr(x?.negative)) H(`${w}.data.readouts[${k}].negative`, x.negative, 6, false); else if (x?.negative !== undefined && x.negative !== false) err(`${w}.data.readouts[${k}].negative: a label for a value below zero, or false`); });
    if (d.rival !== undefined && !series.some((x) => x?.name === d.rival)) err(`${w}.data.rival: "${d.rival}" is not the name of a line`);
    (d.split?.parts || []).forEach((x, k) => { checkExpr(x?.value, `${w}.data.split.parts[${k}].value`); H(`${w}.data.split.parts[${k}].name`, x?.name, 4); });
    if ((d.split?.parts || []).length > 3) warn(`${w}.data.split.parts: three at most`);
    (d.controls || []).forEach((x) => { if (!inputIds.has(x)) err(`${w}.data.controls: "${x}" is not in model.inputs`); });
    if (!CERTAINTY.includes(d.certainty)) warn(`${w}.data.certainty: say measured, estimated or designed`);
    if (!T) warn(`${w}: no table; "Show the numbers" should open the prices with their sources and dates`);
    H(`${w}.data.note`, d.note, 40);
    // the claim must say the true shape: check the series against a straight line
    if (inputIds.has(d.x?.input) && !/\{shape\}/.test(sec.claim || "")) {
      const inp = (MODEL.inputs || []).find((x) => x.id === d.x.input), lo = d.x.from ?? inp?.stops?.[0] ?? inp?.min ?? 0, hi = d.x.to ?? inp?.stops?.at(-1) ?? inp?.max ?? 100;
      const curved = series.some((x) => { try { const ys = [0, 0.25, 0.5, 0.75, 1].map((f) => Expr.eval(x.value, modelAt({ [d.x.input]: lo + (hi - lo) * f }))); const span = Math.max(...ys) - Math.min(...ys) || 1; return ys.some((y, j) => Math.abs(y - (ys[0] + (ys[4] - ys[0]) * j / 4)) / span > 0.04); } catch { return false; } });
      if (/straight|linear/i.test(sec.claim || "") && curved) warn(`${w}.claim: says straight, but a line curves; use {shape} so the heading states the true shape`);
      if (/exponential/i.test(sec.claim || "") && !curved) warn(`${w}.claim: says exponential, but every line is straight; use {shape}`);
    }
  }
  if (comp === "capabilities") {
    if (!nonEmptyArr(d.items)) err(`${w}.data.items: needs items`);
    if (d.only !== undefined && !["today", "building", "later"].includes(d.only)) err(`${w}.data.only: today, building or later`);
    labels(d.labels, ["all", "today", "building", "planned", "later"], `${w}.data.labels`);
    (d.items || []).forEach((x, k) => {
      const ww = `${w}.data.items[${k}]`;
      if (!nonEmptyStr(x?.name)) err(`${ww}: needs name`);
      if (!["today", "building", "later"].includes(x?.state)) err(`${ww}.state: today, building or later`);
      tk(x?.ticket, `${ww}.ticket`);
      if (d.only === "today" && x?.state === "today" && !x.proof && !x.ticket && !x.source) warn(`${ww}: works today but has no proof, ticket or source`);
      H(`${ww}.name`, x?.name, 6); H(`${ww}.line`, x?.line, 15);
    });
  }
  if (comp === "risks") {
    if (!nonEmptyArr(d.risks)) err(`${w}.data.risks: needs risks`);
    labels(d.labels, ["covered", "planned", "partly", "no"], `${w}.data.labels`);
    (d.risks || []).forEach((x, k) => {
      const ww = `${w}.data.risks[${k}]`;
      if (!nonEmptyStr(x?.name)) err(`${ww}: needs name`);
      for (const key of ["likelihood", "impact"]) if (![1, 2, 3].includes(x?.[key])) err(`${ww}.${key}: 1, 2 or 3`);
      if (!["yes", "partly", "no"].includes(x?.covered)) err(`${ww}.covered: yes, partly or no`);
      tk(x?.ticket, `${ww}.ticket`);
      H(`${ww}.name`, x?.name, 6); H(`${ww}.then`, x?.then, 20, false);
    });
  }
  if (comp === "build" && !(isObj(plan) && waveByN.size)) warn(`${w}: the build shows plan.waves, and there are none yet`);
  if (comp === "roadmap") {
    if (!nonEmptyArr(d.items)) err(`${w}.data.items: needs items`);
    if ((d.items || []).length > 5) warn(`${w}.data.items: five at most`);
    (d.items || []).forEach((x, k) => { if (!nonEmptyStr(x?.name)) err(`${w}.data.items[${k}]: needs name`); if (!nonEmptyStr(x?.trigger)) warn(`${w}.data.items[${k}]: needs trigger, what starts it`); H(`${w}.data.items[${k}].name`, x?.name, 5); H(`${w}.data.items[${k}].trigger`, x?.trigger, 10); H(`${w}.data.items[${k}].line`, x?.line, 15); });
  }
  if (comp === "inventory") {
    const cols = d.columns || [];
    if (!nonEmptyArr(cols) || cols.length > 4) err(`${w}.data.columns: two to four { state, label, items }`);
    cols.forEach((c, k) => {
      const ww = `${w}.data.columns[${k}]`;
      if (!INV_STATES.includes(c?.state)) err(`${ww}.state: one of ${INV_STATES.join(", ")}`);
      if (!nonEmptyStr(c?.label)) err(`${ww}.label: a few words`); else H(`${ww}.label`, c.label, 4);
      (c?.items || []).forEach((x, j) => {
        if (!nonEmptyStr(x?.name)) err(`${ww}.items[${j}]: needs name`);
        if (c.state === "proven" && !x?.source) err(`${ww}.items[${j}] "${x?.name}": proven needs source, the proof`);
        H(`${ww}.items[${j}].name`, x?.name, 8); H(`${ww}.items[${j}].note`, x?.note, 15, false);
      });
    });
  }
  if (comp === "cards") {
    if (!nonEmptyArr(d.items)) err(`${w}.data.items: needs items`);
    if ((d.items || []).length > 6) err(`${w}.data.items: ${d.items.length}; six at most on a surface, the rest in a depth table`);
    (d.items || []).forEach((x, k) => {
      const ww = `${w}.data.items[${k}]`;
      if (!nonEmptyStr(x?.title)) err(`${ww}: needs title`);
      H(`${ww}.title`, x?.title, 8); H(`${ww}.text`, x?.text, 20);
      (x?.facts || []).forEach((f, j) => { if (!nonEmptyStr(f?.label)) err(`${ww}.facts[${j}]: needs label and value`); H(`${ww}.facts[${j}]`, `${f?.label || ""} ${f?.value ?? ""}`, 8); });
    });
  }
  if (comp === "decisions") (d.top || []).forEach((id, k) => { if (!(book.decided || []).some((x) => x?.id === id)) err(`${w}.data.top[${k}]: "${id}" is not a decided id`); });
  if (comp === "decisions" && (d.top || []).length > 5) err(`${w}.data.top: five at most`);
  if (comp === "kickoff") {
    if (!nonEmptyStr(book.kickoff)) err(`${w}: a kickoff section needs book.kickoff, the full prompt`);
    (d.steps || []).forEach((x, k) => H(`${w}.data.steps[${k}]`, isStr(x) ? x : x?.title, 5));
    if ((d.steps || []).length > 6) err(`${w}.data.steps: six at most`);
  }
  if (comp === "figure") checkFigure(d, `${w}.data`);
  if (["plan", "verification", "progress"].includes(comp) && !(isObj(plan) && waveByN.size)) err(`${w}: a ${comp} section shows plan.waves, and there are none`);
});
if (isNew && storyCount !== 1) err(`sections: ${storyCount} story sections; a book opens on exactly one`);

// human text outside sections
H("book.title", book.title, 8);
H("book.subtitle", book.subtitle, 4);
H("book.now", book.now, 20, false);
const hasBuildSec = SECS.some((x) => x?.component === "build");
if (isObj(plan) && plan.start !== undefined) { if (!nonEmptyStr(plan.start)) err("plan.start: the few lines a person reads first in the build, or leave it out"); else H("plan.start", plan.start, 50, hasBuildSec); }
const headLinks = (() => { const ok = (book.links || []).filter((l) => isObj(l) && nonEmptyStr(l.label) && /^https?:/.test(l.url || "")); const pick = ok.filter((l) => l.header); return (pick.length ? pick : ok).slice(0, 3); })();
(book.links || []).forEach((l, i) => { if (!isObj(l) || !nonEmptyStr(l.label)) err(`book.links[${i}]: needs label`); else H(`book.links[${i}].label`, l.label, 3, headLinks.includes(l)); });
const waveNames = [...waveByN.values()];
waveNames.forEach((wv, i) => { H(`plan.waves[${i}].name`, wv.name || wv.title, 2); H(`plan.waves[${i}].what`, wv.what || wv.why, 8); });
const firstWave = waveNames.slice().sort((a, b) => a.n - b.n)[0];
tickets.forEach((t, i) => {
  const wv = owner.has(t.id) ? prById.get(owner.get(t.id))?.wave : t.wave;
  H(`plan.tickets[${i}].title`, t.title, 10, firstWave && wv === firstWave.n);
  H(`plan.tickets[${i}].goal`, t.goal, 30, false);
  H(`plan.tickets[${i}].problem`, t.problem, 60, false, true);
  (t.done_when || []).forEach((x, j) => H(`plan.tickets[${i}].done_when[${j}]`, x, 15, false));
  (t.after_merge || []).forEach((x, j) => H(`plan.tickets[${i}].after_merge[${j}]`, x, 15, false));
});
const hasDecidedSec = SECS.some((x) => x?.component === "decided");
(book.decided || []).forEach((d, i) => { const shown = hasDecidedSec && (book.decided || []).indexOf(d) < 3; H(`decided[${i}].what`, d?.what, 10, shown); H(`decided[${i}].why`, d?.why, 25, shown); });
if (isObj(book.ops)) (book.ops.groups || []).forEach((g, i) => { if (!nonEmptyStr(g?.title)) err(`ops.groups[${i}]: needs title`); (g?.items || []).forEach((x, j) => { if (!nonEmptyStr(x?.what)) err(`ops.groups[${i}].items[${j}]: needs what`); H(`ops.groups[${i}].items[${j}].what`, x?.what, 25, false, true); }); });
if (isObj(book.blocking) && !book.blocking.resolved) { H("blocking.question", book.blocking.question, 15); H("blocking.why", book.blocking.why, 30); (book.blocking.options || []).forEach((o, i) => { H(`blocking.options[${i}].label`, o?.label, 6); H(`blocking.options[${i}].effect`, o?.effect, 15); }); }
if (isObj(rep)) for (const k of ["works_now", "not_proven"]) (rep[k] || []).forEach((x, j) => H(`report.${k}[${j}]`, x, 15, stageIdx >= 4));

// ---------- chapters: custom explorable sections ----------
// A section with component "chapter" reads chapters/<id>.html (or its file): an HTML fragment with optional
// <style> and <script> blocks. Styles join the page CSS; the markup becomes a <template>; each script body becomes
// BOOKCH[id](root, api), run once. chapters/_kit.css and _kit.js load first. Mount catalog components with
// api.mount(el, "steps" | "map" | "scale" | ..., data) rather than drawing them again.
const filesMap = {};
let chapterCss = "", chapterTpl = "", chapterJs = "";
const SIDE_BORDER = /border-(?:left|right|top|inline-start|inline-end|block-start)(?:-color)?\s*:\s*([^;}"'`<]+)/gi;
const HAIRLINE_OK = /^(?:\s|var\(--line\)|transparent|none|inherit|unset|initial|solid|dashed|dotted|0|\d*\.?\d+px|!important)*$/i;
const NETWORK = /<link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\/|\b(?:src|action|poster|srcset)\s*=\s*["']?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\/|@import\s+["']?\s*(?:https?:)?\/\/|\b(?:fetch|import|importScripts|WebSocket|EventSource)\s*\(\s*["'`]\s*(?:https?:|wss?:)?\/\/|\.(?:src|href)\s*=\s*["'`]\s*(?:https?:)?\/\//i;
const STRIPE = /border-(?:left|right|inline-start|inline-end)-width\s*:\s*(?!0[;\s}]|1px)[^;}]+|box-shadow\s*:\s*inset\s+-?[1-9]\d*px\s+0(?:px)?\s+0(?:px)?\s/gi;
function guard(text, where) {
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(SIDE_BORDER)) if (!HAIRLINE_OK.test(m[1])) err(`${where}:${i + 1}: coloured side border "${m[0].trim()}". Use var(--line), or no border: hierarchy comes from type, space and one hairline`);
    for (const m of line.matchAll(STRIPE)) err(`${where}:${i + 1}: a side stripe "${m[0].trim()}". Use var(--line), or no border: hierarchy comes from type, space and one hairline`);
  });
  if (NETWORK.test(text)) err(`${where}: loads a stylesheet, font or script from the network; the page makes no external request`);
}
guard(tpl, "assets/book.html");
{
  const kitCss = path.join(dir, "chapters/_kit.css"), kitJs = path.join(dir, "chapters/_kit.js");
  if (fs.existsSync(kitCss)) { const k = fs.readFileSync(kitCss, "utf8"); guard(k, "chapters/_kit.css"); chapterCss += k + "\n"; }
  if (fs.existsSync(kitJs)) { const k = fs.readFileSync(kitJs, "utf8"); guard(k, "chapters/_kit.js"); chapterJs += k + "\n"; chapterJsAll.push(k); }
  SECS.filter((x) => x?.component === "chapter" && nonEmptyStr(x.id)).forEach((c) => {
    const rel = c.file || `chapters/${c.id}.html`, abs = path.join(dir, rel);
    if (path.basename(rel) === "preview.html") { err(`section "${c.id}": chapter file ${rel}: rename it; preview.html is the local preview output`); return; }
    if (!fs.existsSync(abs)) { err(`section "${c.id}": chapter file ${rel} not found`); return; }
    let src = fs.readFileSync(abs, "utf8");
    if (/[–—]/.test(src)) err(`${rel}: has an em or en dash; use plain words or a comma`);
    guard(src, rel);
    src = src.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => { chapterCss += `/* chapter ${c.id} */\n${css}\n`; return ""; });
    src = src.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (_, js) => { chapterJsAll.push(js); chapterJs += `BOOKCH[${JSON.stringify(c.id)}] = function (root, api) {\n${js}\n};\n`; return ""; });
    if (/<template/i.test(src)) err(`${rel}: a chapter may not hold a <template>`);
    chapterTpl += `<template id="ch-${c.id}">${src}</template>\n`;
    const text = src.replace(/<[^>]+>/g, " ").replace(/&\w+;/g, " ").replace(/\s+/g, " ").trim();
    H(`${rel} (visible text)`, text, 0);
    filesMap[rel] = abs;
  });
}
valueNames.forEach(([name, src, msg]) => { if (!chapterJsAll.some((js) => js.includes(`BOOKFN.${src}`) || js.includes(`BOOKFN["${src}"]`))) err(`model.values.${name}: ${msg}`); });

// ---------- human text: budgets, internal references, the whole-book budget ----------
// book.terms: names a reader must recognise (product, vendor or standard names such as "Z360", "S3", "Node.js").
// The id and code check never flags them; each still needs its short explanation where it is first used.
if (book.terms !== undefined && !(isArr(book.terms) && book.terms.every(nonEmptyStr))) err("book.terms: must be a list of names");
const TERMS = new Set((book.terms || []).map(String));
const known = [...ticketIds, ...prIds, ...decidedIds, ...[...waveByN.values()].map((w) => w.id).filter(Boolean),
  ...(plan?.verification?.checks || []).map((c) => c?.id), ...(plan?.verification?.runs || []).map((r) => r?.id), ...(plan?.milestones || []).map((m) => m?.id),
  ...(book.findings || []).map((f) => f?.id), ...(book.research || []).map((r) => r?.id)].filter((x) => isStr(x) && /[-\d]/.test(x) && !TERMS.has(x));
const knownRe = known.length ? new RegExp(`(?<![\\w-])(${[...new Set(known)].sort((a, b) => b.length - a.length).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w-])`) : null;
const CODES = [
  [/\b(?:W|M|D|T|R|CP|PR|WP|MS)-?\d+[a-z]?\b/, "a short code"],
  [/\b[A-Z]{2,5}-\d+\b/, "a short code"],
  [/\b(?:decision|round|wave|milestone|ticket|pr|pull request|check)\s*#?\d+\b/i, "a numbered reference"],
  [/(?:^|\s)#\d{2,}\b/, "a number reference"],
  [/\b[\w.-]+\/[\w./-]*\.[a-z]{1,5}\b/i, "a file path"],
  [/\b(?:agent|docs|src|apps|packages|scripts|chapters)\/[\w./-]*/, "a file path"],
  [/\b(?:feat|fix|lab|release|hotfix|chore)\/[\w./-]+/, "a branch name"],
  [/\b[a-z][\w-]*\.(?:md|json|html?|mjs|cjs|js|ts|tsx|jsx|py|ya?ml|css|png|jpe?g|gif|svg|sh|toml|sql|csv|tsv|xlsx?|pdf|docx?|zip|txt|log)\b/, "a file name"],
  [/\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b/, "a code name"],
  [/\b(?:as (?:discussed|agreed|we agreed)|see (?:above|below)|as above|(?:your|the) (?:first|second|third|last|earlier) (?:brief|plan|round|draft)|this (?:document|page|book))\b/i, "a reference to context the reader may not have"]
];
const BARE = /(?:\b(?:costs?|was|is|were|are)\s+\d[\d,.]*(?!\s*(?:%|[a-z])))|(?:(?<![$\w])\d[\d,.]*\s+a\s+(?:month|day|year|week)\b)/i;
const BARE_FIELDS = /\.(lead|points\[\d+\]|then|line|text)$/;
// Each element is counted by itself (references/design.md). The page as a whole has no word limit.
let onLoad = 0, total = 0;
human.forEach(([where, text, max, load, depth]) => {
  const n = words(text);
  total += n; if (load) onLoad += n;
  if (max && n > max) (isNew ? err : warn)(`${where}: ${n} words; the limit for this element is ${max}: "${text.length > 90 ? text.slice(0, 87) + "..." : text}"`);
  if (depth) return; // depth may name real things: services, packages, paths, ids beside their plain name
  const bare = text.replace(/\{[^{}]*\}/g, " ").replace(/https?:\/\/\S+/g, " ");
  const hits = [];
  for (const [re, what] of CODES) for (const m of bare.matchAll(new RegExp(re.source, re.flags + "g"))) { const x = m[0].trim(); if (!TERMS.has(x) && ![...TERMS].some((tm) => tm.includes(x) && bare.includes(tm))) hits.push(`${what} "${x}"`); }
  if (knownRe) for (const m of bare.matchAll(new RegExp(knownRe.source, "g"))) hits.push(`the id "${m[1]}"`);
  if (hits.length) warn(`${where}: ${[...new Set(hits)].join(", ")} in human text; name things in plain words, ids and files show in agent mode, or list a real name in book.terms: "${text.length > 90 ? text.slice(0, 87) + "..." : text}"`);
  if (BARE_FIELDS.test(where) && BARE.test(bare.replace(/\$\s?\d[\d,.]*/g, " "))) warn(`${where}: a number without a unit ("costs 5", "40 a month"); say "$5 a month", "40 invoices a month": "${text.length > 90 ? text.slice(0, 87) + "..." : text}"`);
  if (/\.lead$/.test(where) && /^(?:pick|drag|switch|click|tap|open|step through|change|follow|scroll|hover)\b/i.test(text.trim())) warn(`${where}: tells the reader how to use the figure; state the one fact the claim needs, or leave the lead out: "${text}"`);
});
// ---------- dashes anywhere in the book ----------
const SKIP_KEYS = new Set(["url", "ref", "path", "file", "files", "sha", "code", "evidence", "wide", "tall", "source"]);
function scan(v, where, key) {
  if (isStr(v)) { if (SKIP_KEYS.has(key)) return; const m = v.match(/[–—]/); if (m) err(`${where}: has ${m[0] === "—" ? "an em" : "an en"} dash; use plain words or a comma`); }
  else if (isArr(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`, key));
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) scan(x, where ? `${where}.${k}` : k, k);
}
scan(book, "", "");

// ---------- files ----------
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
    if (e.isDirectory()) walk(r, test); else if (test(e.name)) filesMap[r] = path.join(dir, r);
  }
}
walk("agent/proof", (n) => IMG.test(n));
if (fs.existsSync(path.join(dir, "proto"))) for (const n of fs.readdirSync(path.join(dir, "proto"))) if (/\.html$/i.test(n)) { filesMap[`proto/${n}`] = path.join(dir, "proto", n); guard(fs.readFileSync(path.join(dir, "proto", n), "utf8"), `proto/${n}`); }
const published = new Set(Object.keys(filesMap));
if (book.agent_start !== undefined && !published.has(book.agent_start)) err(`book.agent_start: "${book.agent_start}" is not a published file; name one from book.files`);
const startHere = book.agent_start || [...published].find((f) => /(^|\/)kickoff[^/]*\.md$/i.test(f)) || (published.has("agent/CHECKPOINT.md") ? "agent/CHECKPOINT.md" : "agent/book.json");
const refd = [];
(book.research || []).forEach((r) => r?.file && refd.push([r.file, `research "${r.id}"`]));
(book.history || []).forEach((x) => x?.file && refd.push([x.file, `history round ${x.round}`]));
tickets.forEach((t) => t.file && refd.push([t.file, `ticket "${t.id}"`]));
const srcs = [];
(function collect(v, key) { if (isStr(v) && key === "source") srcs.push(v); else if (isArr(v)) v.forEach((x) => collect(x, key)); else if (isObj(v)) for (const [k, x] of Object.entries(v)) collect(x, k); })(book, "");
srcs.forEach((p) => { if (!/^https?:\/\//.test(p) && !/\s/.test(p) && /[/.]/.test(p)) refd.push([p, "a source link"]); });
refd.forEach(([p, who]) => { if (!published.has(p.split("#")[0])) (isNew ? err : warn)(`${who} points at "${p}", which is not published (add it to files)`); });
sourcePaths.forEach(([p, who]) => { if (!/^https?:\/\//.test(p) && !published.has(p.split("#")[0])) err(`${who}: "${p}" is not a published file (add it to files) or an https URL`); });
(book.findings || []).forEach((f, i) => (f?.evidence || []).forEach((e, j) => { const r = e?.ref; if (isStr(r) && /^(agent|proto|chapters)\//.test(r) && !published.has(r.split("#")[0])) err(`findings[${i}].evidence[${j}]: "${r}" is not published`); }));

// ---------- the required depth: what a plan book must hold, checked on the data (references/design.md) ----------
const REQ = [];
const isPlanBook = isObj(plan) && tickets.length > 0 && isNew;
const secOf = (c) => SECS.filter((x) => x?.component === c);
const role = (r) => ROLES.get(r) || [];
const colsHave = (blk, names) => { const cols = (blk?.data?.columns || []).map((c) => String(c).toLowerCase()); return names.filter((n) => !cols.some((c) => c.startsWith(n.toLowerCase()))); };
const rowsOf = (blk) => (blk?.data?.rows || []).map((r) => (isArr(r) ? r : r?.cells || []));
const req = (n, item, ok, count, missing) => REQ.push({ n, item, ok: !!ok, count: count ?? "", missing: ok ? "" : missing || "" });
const fmtMoney = (v) => { const a = Math.abs(v), whole = Math.abs(a - Math.round(a)) < 0.005; return (v < 0 ? "-$" : "$") + (a < 10 && !whole ? a.toFixed(2) : Math.round(a).toLocaleString("en-US")); };
if (isPlanBook) {
  const large = profile === "large";
  const deepText = (v) => JSON.stringify(v || "");
  // 1 why
  const measured = SECS.filter((x) => /"certainty":"measured"/.test(deepText(x?.data)) || (x?.depth || []).some((b) => b.kind === "table" && /measured/i.test(deepText(b.data))));
  if (large) req(1, "Why: a measured number with its source", measured.some((x) => x.source || (x.depth || []).some((b) => b.source)), measured.length + " section(s)", "no section carries a measured number with a source");
  // 2 inventory
  if (large) { const inv = secOf("inventory")[0]; const cols = inv?.data?.columns || []; req(2, "What exists today, by state", inv && cols.length >= 2 && cols.every((c) => nonEmptyArr(c?.items)), cols.reduce((a, c) => a + (c?.items || []).length, 0) + " items", inv ? "a column has no items" : "no inventory section"); }
  // 3 capabilities and scope
  { const cap = secOf("capabilities")[0], oos = role("out-of-scope").length || depthBlocks.some((x) => x.block.id === "not-in-v1");
    req(3, "Capabilities and what is out of scope", cap && (oos || !large), (cap?.data?.items || []).length + " capabilities", !cap ? "no capabilities section" : "no depth block with role out-of-scope"); }
  // 4 architecture
  if (large) {
    const map = secOf("map")[0], nodes = (map?.data?.nodes || []).filter((n) => !n?.zone), parts = role("parts")[0]?.block, oss = role("open-source")[0]?.block;
    const rows = rowsOf(parts), firstCells = rows.map((r) => String(r[0] || "").toLowerCase());
    const rowNodes = new Set((parts?.data?.rows || []).map((r) => (isObj(r) ? r.node : null)).filter(Boolean));
    const unmatched = nodes.filter((n) => !rowNodes.has(n.id) && !firstCells.some((c) => c === n.id || c.startsWith(String(n.name || "").toLowerCase())));
    const missCols = parts ? colsHave(parts, ["choice", "does", "why", "cost", "source"]) : [];
    const missLic = oss ? colsHave(oss, ["licen"]) : ["licence"];
    req(4, "Architecture: map, parts table, open source with licences", map && parts && !unmatched.length && !missCols.length && oss && !missLic.length, rows.length + " parts, " + rowsOf(oss).length + " open source",
      !map ? "no map section" : !parts ? "no table with role parts" : unmatched.length ? "map parts with no row: " + unmatched.map((n) => n.name).join(", ") : missCols.length ? "parts table lacks columns: " + missCols.join(", ") : !oss ? "no table with role open-source" : "open-source table lacks a Licence column");
  }
  // 5 lifecycle with a failure story
  { const stories = secOf("map").flatMap((x) => x?.data?.stories || []), failure = stories.some((st) => (st?.steps || []).some((x) => nonEmptyArr(x?.dead)));
    if (large || stories.length) req(5, "A run's lifecycle with a failure story", failure, stories.length + " stories", "no map story where a part fails (a step with dead)"); }
  // 6 scaling
  if (large) { const need6 = ["scale-rule", "scale-up", "scale-down", "limits"].filter((r) => !role(r).length); req(6, "Scaling: rule, up, down or idle, limits", !need6.length, 4 - need6.length + " of 4 blocks", "missing blocks with roles: " + need6.join(", ")); }
  // 7 cost
  if (large || secOf("cost").length) {
    const up = role("unit-prices")[0]?.block, ex = role("cost-example")[0]?.block, miss = [];
    if (!up) miss.push("unit-prices table"); else {
      const mc = colsHave(up, ["source", "read"]); if (mc.length) miss.push("unit-prices columns " + mc.join(", "));
      else { const cols = up.data.columns.map((c) => c.toLowerCase()), si = cols.findIndex((c) => c.startsWith("source")), ri = cols.findIndex((c) => c.startsWith("read")); rowsOf(up).forEach((r, k) => { if (!String(r[si] ?? "").trim() || !String(r[ri] ?? "").trim()) miss.push(`unit price row ${k + 1} without source or read date`); }); }
    }
    if (!role("cost-formula").length) miss.push("cost-formula block");
    if (!ex) miss.push("cost-example block"); else if (!nonEmptyStr(String(ex.data?.result ?? ""))) miss.push("cost-example data.result");
    else if (ex.data.check !== undefined) { try { const got = fmtMoney(Expr.eval(String(ex.data.check), modelAt())); if (got.replace(/\s/g, "") !== String(ex.data.result).replace(/\s/g, "")) miss.push(`cost-example result ${ex.data.result} but the model gives ${got}`); } catch (e) { miss.push("cost-example check: " + e.message); } }
    else if (secOf("cost").length) miss.push("cost-example data.check, the model expression whose value equals the result");
    if (!role("cost-excluded").length) miss.push("cost-excluded block");
    req(7, "Cost: unit prices with sources, formula, worked example, exclusions", !miss.length, up ? rowsOf(up).length + " prices" : "", miss.join("; "));
  }
  // 8 security
  if (large) { const need8 = ["who-may-act", "walls", "secrets", "accepted-risks"].filter((r) => !role(r).length); req(8, "Security: who may act, walls, secrets, accepted risks", !need8.length, 4 - need8.length + " of 4 blocks", "missing blocks with roles: " + need8.join(", ")); }
  // 9 failures and backups
  if (large) { const ft = role("failures")[0]?.block, mc = ft ? colsHave(ft, ["lost", "back"]) : []; req(9, "Failures with what is lost and time back; backups", ft && !mc.length && role("backups").length, rowsOf(ft).length + " failures", !ft ? "no table with role failures" : mc.length ? "failures table lacks columns: " + mc.join(", ") : "no block with role backups"); }
  // 10 research
  if (large) {
    const R = book.research || [], named = new Set([...R.map((r) => r?.file), ...depthBlocks.filter((x) => x.block.kind === "file").map((x) => x.block.data?.path)].filter(Boolean));
    const unnamed = [...published].filter((p) => /^agent\/research\/[^/]+\.md$/.test(p) && !named.has(p));
    const nofile = R.filter((r) => !r?.file || !published.has(r.file));
    req(10, "Research: every file with question, answer, link", R.length && !unnamed.length && !nofile.length, R.length + " notes", !R.length ? "book.research is empty" : nofile.length ? "research without a published file: " + nofile.map((r) => r.id).join(", ") : "research files no entry names: " + unnamed.join(", "));
  }
  // 11 decisions
  { const ds = book.decided || []; req(11, "Decisions with who, when, why", secOf("decisions").length && ds.length && ds.every((d) => d?.who && d?.when && d?.why), ds.length + " decisions", !secOf("decisions").length ? "no decisions section" : "a decision lacks who, when or why"); }
  // 12 plan
  { const miss = []; if (!secOf("plan").length) miss.push("plan section"); if (!waveByN.size) miss.push("waves");
    if (large) { if (!prById.size) miss.push("pull requests"); if (!nonEmptyArr(plan.critical_path)) miss.push("plan.critical_path"); }
    req(12, "Plan: waves, pull requests, order, critical path, full tickets", !miss.length, tickets.length + " tickets, " + prById.size + " PRs, " + waveByN.size + " waves", "missing " + miss.join(", ")); }
  // 13 verification
  { const V = isObj(plan.verification) ? plan.verification : {}, miss = [];
    if (!secOf("verification").length) miss.push("verification section");
    if (large && !nonEmptyArr(plan.coverage_lines)) miss.push("plan.coverage_lines");
    if (!nonEmptyArr(V.final) && !nonEmptyArr(V.checks)) miss.push("final checks");
    if (large && !nonEmptyArr(plan.reviews)) miss.push("plan.reviews");
    req(13, "Verification: coverage, final checks, review gates", !miss.length, (plan.coverage_lines || []).length + " coverage lines, " + ((V.final || V.checks || []).length) + " final checks", "missing " + miss.join(", ")); }
  // 14 kickoff
  req(14, "Kickoff: the full prompt, copyable, in human mode", secOf("kickoff").length && nonEmptyStr(book.kickoff), nonEmptyStr(book.kickoff) ? words(book.kickoff) + " words" : "", !secOf("kickoff").length ? "no kickoff section" : "book.kickoff is empty");
  // 15 ops
  if (published.has("agent/OPS-CHECKLIST.md") || book.ops) { const g = book.ops?.groups || []; req(15, "What only the owner does (ops checklist)", nonEmptyArr(g) && g.every((x) => nonEmptyArr(x?.items)), g.reduce((a, x) => a + (x?.items || []).length, 0) + " items", "book.ops.groups missing or a group has no items"); }
  // 16 beyond
  if (large) req(16, "Beyond: what comes next and what triggers it", secOf("roadmap").length, (secOf("roadmap")[0]?.data?.items || []).length + " stages", "no roadmap section");
  req(17, "Agent workspace: tree, tables, raw files, db", true, published.size + " files");
  REQ.filter((r) => !r.ok).forEach((r) => err(`required ${r.n}, ${r.item}: ${r.missing}`));
}

// ---------- source coverage: every level 2 heading of the design file has a home ----------
const designFile = book.design_file || (published.has("agent/DESIGN.md") ? "agent/DESIGN.md" : null);
if (isNew && designFile) {
  if (!published.has(designFile)) err(`book.design_file: "${designFile}" is not published`);
  else {
    const slug = (x) => String(x).toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
    const anchors = new Set();
    (function collect(v, key) { if (isStr(v) && (key === "source" || key === "path" || key === "file")) { const [p, a] = v.split("#"); if (p === designFile && a) anchors.add(a.toLowerCase()); } else if (isArr(v)) v.forEach((x) => collect(x, key)); else if (isObj(v)) for (const [k, x] of Object.entries(v)) collect(x, k); })(book, "");
    const unmapped = new Set((book.unmapped || []).map((u) => String(u?.heading || "").replace(/^#+\s*/, "").trim().toLowerCase()));
    (book.unmapped || []).forEach((u, i) => { if (!nonEmptyStr(u?.reason)) err(`unmapped[${i}]: needs reason`); });
    const heads = fs.readFileSync(published.has(designFile) ? filesMap[designFile] : "", "utf8").split("\n").filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
    const lost = heads.filter((hd) => {
      const num = (hd.match(/^(\d+(?:\.\d+)*)\.?\s/) || [])[1], sl = slug(hd.replace(/^\d+(?:\.\d+)*\.?\s*/, ""));
      if (unmapped.has(hd.toLowerCase())) return false;
      return ![...anchors].some((a) => a === sl || a === slug(hd) || (num && (a === num || a.startsWith(num + "."))));
    });
    REQ.push({ n: "S", item: `Source coverage of ${designFile}`, ok: !lost.length, count: heads.length - lost.length + " of " + heads.length + " headings", missing: lost.length ? "unmapped: " + lost.join(" | ") : "" });
    if (lost.length) err(`source coverage: ${lost.length} heading(s) of ${designFile} have no section or depth block (a source "${designFile}#<number or slug>") and are not in book.unmapped: ${lost.join(" | ")}`);
  }
}

// ---------- no regression against the last frozen round ----------
if (isNew && Number.isInteger(book.round?.n)) {
  const rdir = path.join(dir, "agent/rounds");
  const prev = fs.existsSync(rdir) ? fs.readdirSync(rdir).map((f) => [f, +(f.match(/^round-(\d+)\.json$/) || [])[1]]).filter(([, n]) => n && n < book.round.n).sort((a, b) => b[1] - a[1])[0] : null;
  if (prev) {
    let old = null; try { old = JSON.parse(fs.readFileSync(path.join(rdir, prev[0]), "utf8")); } catch (e) { err(`agent/rounds/${prev[0]}: cannot read: ${e.message}`); }
    if (old) {
      const removed = book.removed || [];
      removed.forEach((r, i) => { if (!nonEmptyStr(r?.what) || !nonEmptyStr(r?.reason) || !nonEmptyStr(r?.who)) err(`removed[${i}]: needs what, reason and who asked`); });
      const gone = new Set(removed.map((r) => String(r?.what || "")));
      const lostR = [];
      const nowSec = new Map(SECS.map((x) => [x.id, x]));
      (old.sections || []).forEach((x) => {
        if (!x?.id) return;
        if (!nowSec.has(x.id)) { if (!gone.has(x.id) && !gone.has("section " + x.id)) lostR.push("section " + x.id); return; }
        const ids2 = new Set((nowSec.get(x.id).depth || []).map((b) => b?.id));
        (x.depth || []).forEach((b) => { if (b?.id && !ids2.has(b.id) && !gone.has(x.id + "/" + b.id)) lostR.push(x.id + "/" + b.id); });
      });
      const nowKeys = new Set(tickets.flatMap((t) => Object.keys(t)));
      [...new Set((old.plan?.tickets || []).flatMap((t) => Object.keys(t || {})))].forEach((k) => { if (!nowKeys.has(k) && !gone.has("ticket." + k)) lostR.push("ticket." + k); });
      REQ.push({ n: "R", item: `No regression against agent/rounds/${prev[0]}`, ok: !lostR.length, count: lostR.length + " lost", missing: lostR.join(", ") });
      if (lostR.length) err(`no regression: ${lostR.join(", ")} existed in agent/rounds/${prev[0]} and are gone; bring them back or list each in book.removed { what, reason, who }`);
    }
  }
}
const SECRET = /(^|\/)(\.env[^/]*|id_rsa[^/]*|[^/]*\.(pem|key|p12))$/i;
for (const p of Object.keys(filesMap)) if (SECRET.test(p)) err(`files: "${p}" looks like a secret; never publish it`);

// ---------- fonts: embedded, so the page makes no external request ----------
const FONT_FILES = [["Inter", 400, "inter-400"], ["Inter", 500, "inter-500"], ["Inter", 600, "inter-600"], ["Inter Display", 500, "inter-display-500"], ["Inter Display", 600, "inter-display-600"], ["JetBrains Mono", 400, "jbmono-400"], ["JetBrains Mono", 500, "jbmono-500"]];
const fontDir = path.resolve(here, "../assets/fonts");
const fontFaces = FONT_FILES.map(([family, weight, file]) => {
  const f = path.join(fontDir, file + ".woff2");
  if (!fs.existsSync(f)) { err(`fonts: ${f} not found`); return ""; }
  return `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString("base64")}) format("woff2")}`;
}).join("\n");

// ---------- write ----------
if (REQ.length) {
  const pad = (x, n) => String(x).padEnd(n);
  console.error("\nRequired depth (references/design.md). Read this before publishing:");
  REQ.forEach((r) => console.error(`  ${pad(r.ok ? "present" : "MISSING", 8)} ${pad(r.n, 3)} ${pad(r.item, 66)} ${r.count}`));
  console.error("");
}
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
const built = new Date().toISOString();
const build = { source: path.basename(dir) + "/index.html", built, preview: false, words_written_on_load: onLoad, words_total: total, published: Object.keys(filesMap).sort() };

// The machine entry point: an agent that fetches the HTML parses this block without rendering the page.
const waveOfT = (t) => (owner.has(t.id) ? prById.get(owner.get(t.id))?.wave : t.wave);
const index = {
  book: book.id, title: book.title, round: book.round, updated: book.updated, built,
  start_here: startHere,
  how_to_read: `Start with ${startHere}. Content is the book-data script block (agent/book.json); notes for one piece of work are agent/tickets/<ticket-id>.md. Live state is the page database: status/<ticket-id>, status/pr-<id>, status/check-<id>, status/ready-<id>, run/current, run/blocking, log/<id>. Inside the page it is ArtifactData; from outside, read it with db_list and db_get (collections status, run, log) and write it with db_write.`,
  sections: SECS.map((x) => ({ id: x.id, component: x.component, claim: x.claim })),
  steps: [...waveByN.values()].sort((a, b) => a.n - b.n).map((w, i) => ({ n: w.n, id: w.id || `wave-${w.n}`, name: w.name || w.title, order: i + 1, tickets: tickets.filter((t) => waveOfT(t) === w.n).map((t) => t.id) })),
  tickets: tickets.map((t) => { const p = prById.get(owner.get(t.id)); return { id: t.id, title: t.title, goal: t.goal || null, step: waveOfT(t), pr: p?.id || null, branch: p?.branch || null, file: t.file || null, files: t.files || [], depends_on: t.depends_on || [], done_when: t.done_when || [], after_merge: t.after_merge || [], risk: t.risk || null, size: t.size || null, status_doc: `status/${t.id}` }; }),
  ready: (plan?.verification?.ready || []).map((r) => ({ id: r.id, need: r.need, who: r.who || "agent", status_doc: `status/ready-${r.id}` })),
  runs: (plan?.verification?.runs || []).map((r) => ({ id: r.id, title: r.title, what: r.what || null, needs: r.needs || null })),
  prs: [...prById.values()].map((p) => ({ id: p.id, title: p.title, wave: p.wave, base: p.base || null, branch: p.branch || null, tickets: p.tickets || [], status_doc: `status/pr-${p.id}` })),
  checks: (plan?.verification?.checks || []).map((c) => ({ id: c.id, title: c.title, kind: c.kind, run: c.run || null, tickets: c.tickets || [], expect: c.expect || null, pass: c.pass || null, status_doc: `status/check-${c.id}` })),
  decided: (book.decided || []).map((d) => ({ id: d.id || null, what: d.what, who: d.who || "model", when: d.when || null, section: d.section || null })),
  findings: (book.findings || []).map((f) => ({ id: f.id, finding: f.finding })),
  research: (book.research || []).map((r) => ({ id: r.id, question: r.question, file: r.file || null })),
  files: Object.keys(filesMap).sort()
};

let html = tpl;
const put = (token, value) => { if (!html.includes(token)) { console.error(`error: template is missing ${token}`); process.exit(1); } html = html.split(token).join(value); };
put("/*FONT_FACES*/", fontFaces);
put("/*CHAPTER_CSS*/", chapterCss.replace(/<\/style/gi, "<\\/style"));
put("<!--CHAPTER_TEMPLATES-->", chapterTpl);
put("/*CHAPTER_JS*/", chapterJs.replace(/<\/script/gi, "<\\/script"));
put("__TITLE__", escHTML(book.title));
put("/*BOOK_JSON*/", safeJSON(book));
put("/*INDEX_JSON*/", safeJSON(index));
put("/*BUILD_JSON*/", safeJSON(build));
put("/*DEMO_JSON*/", ""); // index.html never carries sample state

const out = path.join(dir, "index.html");
fs.writeFileSync(out, html);
const kb = Buffer.byteLength(html) / 1024;
const fontKb = Buffer.byteLength(fontFaces) / 1024;
if (kb - fontKb > 400) warn(`index.html is ${kb.toFixed(0)} KB (${(kb - fontKb).toFixed(0)} KB without the embedded fonts); keep it under 400 KB without fonts by moving long text into agent files`);
if (preview) {
  const empty = '<script id="book-demo" type="application/json"></script>';
  if (!html.includes(empty)) { console.error("error: template is missing the book-demo block"); process.exit(1); }
  fs.writeFileSync(path.join(dir, "preview.html"), html.replace(empty, () => `<script id="book-demo" type="application/json">${demo ? safeJSON(demo) : ""}</script>`)
    .replace(safeJSON(build), () => safeJSON({ ...build, preview: true })));
}
if (demo && !preview) warn("--demo has no effect without --preview; sample state goes only into preview.html");

for (const w of warnings) console.error(`warning: ${w}`);
console.error(`wrote ${tilde(out)} (${kb.toFixed(0)} KB, fonts ${fontKb.toFixed(0)} KB), ${total} words of human text, ${Object.keys(filesMap).length} published file(s), ${warnings.length} warning(s)${preview ? ", preview.html" : ""}${demo && preview ? ", sample live data in preview.html only" : ""}`);
process.stdout.write(JSON.stringify(filesMap, null, 2) + "\n");
