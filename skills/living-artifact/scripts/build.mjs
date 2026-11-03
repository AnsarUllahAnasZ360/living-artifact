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
const KINDS = ["production", "tests", "docs and config"];

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
const researchIds = ids(book.research, "research");
(book.research || []).forEach((r, i) => { need(r, "question", `research[${i}]`, nonEmptyStr, "a string"); });
ids(book.prototypes, "prototypes");

// ---------- architecture ----------
// One diagram: nodes with id, label, x, y; edges between known nodes; `new` names nodes in it.
function checkFrame(fr, where) {
  const nodeIds = new Set((fr.nodes || []).map((n) => n.id));
  (fr.nodes || []).forEach((n, j) => {
    if (!nonEmptyStr(n.id) || !nonEmptyStr(n.label)) err(`${where}.nodes[${j}]: needs id and label`);
    if (typeof n.x !== "number" || typeof n.y !== "number") err(`${where}.nodes[${j}] "${n.id}": needs numeric x and y`);
  });
  (fr.edges || []).forEach((e, j) => {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) err(`${where}.edges[${j}]: ${e.from} to ${e.to} names a node not in this diagram`);
  });
  (fr.new || []).forEach((id) => { if (!nodeIds.has(id)) err(`${where}.new: "${id}" is not a node in this diagram`); });
  if ((fr.nodes || []).length > 12) warn(`${where}: ${fr.nodes.length} nodes; over 12 is hard to read`);
  return nodeIds;
}
const arch = book.architecture;
let areaIds = new Set();
if (arch !== undefined) {
  if (!isObj(arch)) err("architecture: must be an object");
  else {
    (arch.frames || []).forEach((fr, i) => checkFrame(fr, `architecture.frames[${i}]`));
    if (arch.areas !== undefined && !isArr(arch.areas)) err("architecture.areas: must be a list");
    areaIds = ids(arch.areas, "architecture.areas");
    (arch.areas || []).forEach((a, i) => {
      const w = `architecture.areas[${i}] "${a?.id}"`;
      need(a, "title", w, nonEmptyStr, "a string");
      if (!nonEmptyStr(a?.found)) warn(`${w}: no found; say what we found, with one concrete example`);
      if (!nonEmptyStr(a?.recommend)) warn(`${w}: no recommend; say what we recommend`);
      if (!nonEmptyStr(a?.why)) warn(`${w}: no why; say why this is the right fix`);
      if (!a?.today && !a?.proposed) warn(`${w}: no today or proposed diagram`);
      const pics = {};
      for (const k of ["today", "proposed"]) if (a?.[k] !== undefined) {
        if (!isObj(a[k])) { err(`${w}.${k}: must be a diagram object`); continue; }
        pics[k] = checkFrame(a[k], `${w}.${k}`);
      }
      (a?.steps || []).forEach((st, j) => {
        if (!nonEmptyStr(st?.text)) err(`${w}.steps[${j}]: needs text`);
        const view = st?.view || (pics.proposed ? "proposed" : "today");
        if (!pics[view]) { err(`${w}.steps[${j}]: view "${view}" has no diagram`); return; }
        (st.nodes || []).forEach((n) => { if (!pics[view].has(n)) err(`${w}.steps[${j}]: node "${n}" is not in the ${view} diagram`); });
      });
      if ((a?.steps || []).length > 7) warn(`${w}: ${a.steps.length} steps; keep it to 7`);
      (a?.research || []).forEach((r) => { if (!researchIds.has(r)) err(`${w}: unknown research "${r}"`); });
      for (const k of ["tradeoffs", "not_building", "evidence"]) if (a?.[k] !== undefined && !isArr(a[k])) err(`${w}.${k}: must be a list`);
    });
  }
}

// ---------- plan ----------
// One PR per problem category. A PR holds tickets in commit order; each ticket is one commit.
// A ticket's wave is its PR's wave. One builder owns one PR.
const plan = book.plan;
const milestoneIds = new Set();
const ticketIds = new Set();
const tickets = [];
const waveByN = new Map();
let prIds = new Set();
const prById = new Map();
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
    if (w.agents !== undefined) warn(`plan.waves[${i}]: "agents" is from the old model; one builder owns each PR, so list the wave's PRs in "prs"`);
  });
  const tById = new Map();
  (plan.tickets || []).forEach((t) => { if (isObj(t)) { tickets.push(t); tById.set(t.id, t); } });

  // pull requests
  if (plan.branches !== undefined && !isObj(plan.branches)) err("plan.branches: must be an object { development, production, naming }");
  const branchNames = new Set([plan.branches?.development, plan.branches?.production].filter(Boolean));
  if (plan.prs !== undefined && !isArr(plan.prs)) err("plan.prs: must be a list");
  prIds = ids(plan.prs, "plan.prs");
  (plan.prs || []).filter(isObj).forEach((x) => prById.set(x.id, x));
  const owner = new Map(); // ticket id -> PR id
  const pos = new Map();   // ticket id -> commit position in its PR
  const RANK = { low: 0, medium: 1, high: 2 };
  (plan.prs || []).forEach((pr, i) => {
    if (!isObj(pr)) return;
    const w = `plan.prs[${i}] "${pr.id}"`;
    need(pr, "title", w, nonEmptyStr, "a string");
    need(pr, "category", w, nonEmptyStr, "a string");
    if (pr.ticket !== undefined) err(`${w}: "ticket" is from the old model; list the PR's tickets in commit order in "tickets"`);
    for (const k of ["kind", "stack", "lines", "why_large", "review"]) if (pr[k] !== undefined) warn(`${w}: "${k}" is from the old model; PRs are sized by problem category, so drop it`);
    if (!nonEmptyArr(pr.tickets)) err(`${w}: needs "tickets", its tickets in commit order`);
    if (pr.size !== undefined) { if (!isObj(pr.size)) err(`${w}.size: must be an object { files, added, deleted, why }`); else for (const k of ["files", "added", "deleted"]) if (pr.size[k] !== undefined && !(typeof pr.size[k] === "number" && isFinite(pr.size[k]) && pr.size[k] >= 0)) err(`${w}.size.${k}: must be a number`); }
    (pr.tickets || []).forEach((t, j) => {
      if (!tById.has(t)) { err(`${w}: unknown ticket "${t}"`); return; }
      if (owner.has(t)) { if (owner.get(t) !== pr.id) err(`ticket "${t}" is in two PRs ("${owner.get(t)}" and "${pr.id}"); a ticket is one commit in one PR`); else err(`${w}: lists ticket "${t}" twice`); return; }
      owner.set(t, pr.id); pos.set(t, j);
    });
    if (!waveByN.has(pr.wave)) err(`${w}: unknown wave ${JSON.stringify(pr.wave)}`);
    if (pr.base !== undefined) {
      if (!nonEmptyStr(pr.base)) err(`${w}: base must be a branch name or the id of the PR it is stacked on`);
      else if (pr.base === pr.id) err(`${w}: is stacked on itself`);
      else if (!prIds.has(pr.base) && branchNames.size && !branchNames.has(pr.base)) err(`${w}: base "${pr.base}" is neither a branch in plan.branches nor a PR id`);
    }
    if (pr.branch !== undefined && !nonEmptyStr(pr.branch)) err(`${w}: branch must be a string`);
    if (pr.risk !== undefined && !RISKS.includes(pr.risk)) err(`${w}: risk must be one of ${RISKS.join(", ")}`);
    const top = (pr.tickets || []).map((t) => tById.get(t)?.risk).filter((r) => RISKS.includes(r)).sort((a, b) => RANK[b] - RANK[a])[0];
    if (RISKS.includes(pr.risk) && top && RANK[pr.risk] < RANK[top]) warn(`${w}: risk is ${pr.risk} but a ticket in it is ${top}; a PR carries the highest risk of its tickets`);
    (pr.depends_on || []).forEach((d) => {
      if (d === pr.id) err(`${w}: depends on itself`);
      else if (!prIds.has(d)) err(`${w}: depends on unknown PR "${d}"`);
    });
    for (const k of ["areas", "shares", "proof", "depends_on"]) if (pr[k] !== undefined && !(isArr(pr[k]) && pr[k].every(isStr))) err(`${w}.${k}: must be a list of strings`);
    if (pr.hotfix !== undefined) {
      if (!isObj(pr.hotfix)) err(`${w}.hotfix: must be an object { base, note }`);
      else {
        if (!nonEmptyStr(pr.hotfix.base)) err(`${w}.hotfix.base: name the production branch the commit also goes to`);
        else if (branchNames.size && !branchNames.has(pr.hotfix.base)) err(`${w}.hotfix.base "${pr.hotfix.base}" is not a branch in plan.branches`);
        (pr.hotfix.tickets || []).forEach((t) => { if (!(pr.tickets || []).includes(t)) err(`${w}.hotfix: "${t}" is not a commit in this PR`); });
      }
    }
  });
  // the planned stack is one line: a PR sits on a PR from its own or an earlier wave, nothing loops, and no base carries two PRs
  prById.forEach((pr, id) => {
    const under = prById.get(pr.base);
    if (!under || under === pr || !Number.isInteger(under.wave) || !Number.isInteger(pr.wave)) return;
    if (under.wave > pr.wave) err(`PR "${id}" (wave ${pr.wave}) is stacked on PR "${pr.base}" from later wave ${under.wave}; a PR opens above one that is built no later`);
  });
  prById.forEach((pr, id) => {
    const seen = new Set([id]);
    for (let b = prById.get(pr.base); b; b = prById.get(b.base)) { if (seen.has(b.id)) { err(`PR "${id}": its stack loops back through PR "${b.id}"`); break; } seen.add(b.id); }
  });
  const onBase = new Map();
  prById.forEach((pr) => { if (nonEmptyStr(pr.base)) onBase.set(pr.base, [...(onBase.get(pr.base) || []), pr.id]); });
  onBase.forEach((on, base) => { if (on.length > 1) warn(`PRs ${on.map((x) => `"${x}"`).join(", ")} all sit on "${base}"; the stack is one line, so each sits on the PR before it`); });
  // a PR depends only on PRs in earlier waves
  prById.forEach((pr, id) => (pr.depends_on || []).forEach((d) => {
    const dep = prById.get(d);
    if (!dep || !Number.isInteger(dep.wave) || !Number.isInteger(pr.wave) || d === id) return;
    if (dep.wave >= pr.wave) err(`PR "${id}" (wave ${pr.wave}) depends on PR "${d}" in ${dep.wave === pr.wave ? "the same wave" : "later wave " + dep.wave}; a PR depends only on PRs in earlier waves`);
  }));
  // waves list their PRs, and each PR is listed by its own wave
  (plan.waves || []).forEach((wv) => {
    if (!Number.isInteger(wv?.n)) return;
    if (wv.prs !== undefined && !isArr(wv.prs)) { err(`wave ${wv.n}: prs must be a list`); return; }
    (wv.prs || []).forEach((id) => {
      if (!prIds.has(id)) err(`wave ${wv.n}: unknown PR "${id}"`);
      else if (prById.get(id).wave !== wv.n) err(`wave ${wv.n} lists PR "${id}", but the PR says wave ${prById.get(id).wave}`);
    });
    const mine = [...prById.values()].filter((p) => p.wave === wv.n);
    if (wv.prs) mine.forEach((p) => { if (!wv.prs.includes(p.id)) err(`PR "${p.id}" says wave ${wv.n}, but wave ${wv.n} does not list it`); });
    if (mine.length > 6) warn(`wave ${wv.n}: ${mine.length} PRs; six at most unless the user raised it`);
  });

  tickets.forEach((t, i) => {
    const w = `plan.tickets[${i}] "${t.id}"`;
    for (const k of ["title", "goal"]) need(t, k, w, nonEmptyStr, "a string");
    need(t, "done_when", w, nonEmptyArr, "a non-empty list");
    if (!milestoneIds.has(t.milestone)) err(`${w}: unknown milestone "${t.milestone}"`);
    if (t.size && !SIZES.includes(t.size)) err(`${w}: size must be one of ${SIZES.join(", ")}`);
    if (t.size === "S") warn(`${w}: size S; fold it into a goal-sized ticket`);
    if (t.risk && !RISKS.includes(t.risk)) err(`${w}: risk must be one of ${RISKS.join(", ")}`);
    if (t.short !== undefined) { if (!nonEmptyStr(t.short)) err(`${w}: short must be a string`); else if (words(t.short) > 5) warn(`${w}: short is ${words(t.short)} words; 5 at most`); }
    for (const k of ["agent", "order", "prs"]) if (t[k] !== undefined) warn(`${w}: "${k}" is from the old model; one builder owns the PR and the PR lists its commits in order, so drop it`);
    const mine = owner.get(t.id);
    if (!mine) err(`${w}: is in no PR; every ticket is one commit in exactly one PR`);
    if (t.pr !== undefined && mine && t.pr !== mine) err(`${w}: pr is "${t.pr}", but PR "${mine}" lists it`);
    else if (t.pr !== undefined && !mine && !prIds.has(t.pr)) err(`${w}: unknown PR "${t.pr}"`);
    if (t.wave !== undefined && mine && prById.get(mine)?.wave !== t.wave) err(`${w}: wave ${t.wave}, but its PR "${mine}" is in wave ${prById.get(mine)?.wave}; a ticket's wave comes from its PR`);
    if (/^(pr|check|ready)-/.test(t.id)) err(`${w}: a ticket id may not start with pr-, check- or ready-; those name live status documents`);
    if (t.after_merge !== undefined && !(isArr(t.after_merge) && t.after_merge.every(nonEmptyStr))) err(`${w}.after_merge: must be a list of strings`);
    (t.depends_on || []).forEach((d) => {
      if (!tById.has(d)) { err(`${w}: depends on unknown ticket "${d}"`); return; }
      if (d === t.id) { err(`${w}: depends on itself`); return; }
      const theirs = owner.get(d);
      if (!mine || !theirs) return;
      if (mine === theirs) {
        if (pos.get(d) > pos.get(t.id)) err(`${w}: depends on "${d}", a later commit in its own PR "${mine}"; move "${d}" earlier in that PR's tickets`);
        return;
      }
      const a = prById.get(mine)?.wave, b = prById.get(theirs)?.wave;
      if (Number.isInteger(a) && Number.isInteger(b) && b >= a) err(`${w}: depends on "${d}" in PR "${theirs}" (wave ${b}); a ticket depends only on earlier commits in its own PR or on PRs from earlier waves`);
    });
  });

  // two PRs in one wave owning the same area (path prefixes, case-insensitive); shares never count
  (plan.waves || []).forEach((wv) => {
    const owned = [];
    [...prById.values()].filter((p) => p.wave === wv.n).forEach((p) => {
      (isArr(p.areas) ? p.areas : []).forEach((f) => owned.push({ pr: p.id, f: String(f).toLowerCase().replace(/\/+$/, "") }));
    });
    const seen = new Set();
    for (let i = 0; i < owned.length; i++) for (let j = i + 1; j < owned.length; j++) {
      const x = owned[i], y = owned[j];
      if (x.pr === y.pr) continue;
      const under = (p, q) => p === q || q.startsWith(p + "/");
      if (!under(x.f, y.f) && !under(y.f, x.f)) continue;
      const key = [x.pr, y.pr].sort().join("|");
      if (seen.has(key)) continue; seen.add(key);
      warn(`wave ${wv.n}: PRs "${x.pr}" and "${y.pr}" both own "${x.f.length <= y.f.length ? x.f : y.f}"; run them in order or split the area`);
    }
  });

  // milestones name the PRs whose merge reaches them
  (plan.milestones || []).forEach((m, i) => {
    if (m?.prs === undefined) return;
    if (!isArr(m.prs)) { err(`plan.milestones[${i}].prs: must be a list`); return; }
    m.prs.forEach((p) => { if (!prIds.has(p)) err(`plan.milestones[${i}] "${m.id}": unknown PR "${p}"`); });
  });

  (plan.review_policy || []).forEach((x, i) => {
    if (!RISKS.includes(x?.risk)) err(`plan.review_policy[${i}].risk: one of ${RISKS.join(", ")}`);
    if (!nonEmptyStr(x?.who) || !nonEmptyStr(x?.what)) err(`plan.review_policy[${i}]: needs who and what`);
  });
  if (plan.merge_checklist !== undefined && !(isArr(plan.merge_checklist) && plan.merge_checklist.every(isStr))) err("plan.merge_checklist: must be a list of strings");
  (plan.github || []).forEach((x, i) => { if (!nonEmptyStr(x?.what)) err(`plan.github[${i}].what: missing`); });
  if (plan.flow !== undefined) {
    if (!isObj(plan.flow)) err("plan.flow: must be an object { ticket, pr }");
    else for (const k of ["ticket", "pr"]) if (plan.flow[k] !== undefined && !(isArr(plan.flow[k]) && plan.flow[k].every(nonEmptyStr))) err(`plan.flow.${k}: must be a list of steps`);
  }
  if (plan.pr_template !== undefined) {
    if (!isArr(plan.pr_template)) err("plan.pr_template: must be a list of { heading, holds }");
    else plan.pr_template.forEach((x, i) => { if (!nonEmptyStr(x?.heading) || !nonEmptyStr(x?.holds)) err(`plan.pr_template[${i}]: needs heading and holds`); });
  }

  // gate and stop rules
  if (plan.gate !== undefined) {
    if (!isObj(plan.gate)) err("plan.gate: must be an object { steps, baseline }");
    else for (const k of ["steps", "baseline"]) if (plan.gate[k] !== undefined && !(isArr(plan.gate[k]) && plan.gate[k].every(isStr))) err(`plan.gate.${k}: must be a list of strings`);
  }
  if (plan.stop_rules !== undefined && !(isArr(plan.stop_rules) && plan.stop_rules.every(isStr))) err("plan.stop_rules: must be a list of strings");

  // the verification checklist (an older book's list of { where, what } is read as its building rows)
  const V = isArr(plan.verification) ? { building: plan.verification } : plan.verification;
  if (V !== undefined) {
    if (!isObj(V)) err("plan.verification: must be an object { summary, where, ready, building, runs, checks }");
    else {
      const list = (k) => { if (V[k] === undefined) return []; if (isArr(V[k])) return V[k]; err(`plan.verification.${k}: must be a list`); return []; };
      const READY = list("ready"), BUILDING = list("building"), RUNS = list("runs"), CHECKS = list("checks");
      BUILDING.forEach((x, i) => { if (!nonEmptyStr(x?.where) || !nonEmptyStr(x?.what)) err(`plan.verification.building[${i}]: needs where and what`); });
      ids(READY, "plan.verification.ready");
      READY.forEach((r, i) => {
        if (!nonEmptyStr(r?.need)) err(`plan.verification.ready[${i}]: needs need`);
        if (r?.state !== undefined && !["ok", "missing", "unknown"].includes(r.state)) err(`plan.verification.ready[${i}]: state is ok, missing or unknown`);
        if (!nonEmptyStr(r?.who)) warn(`plan.verification.ready[${i}]: name who supplies it (agent or a person)`);
      });
      ids(RUNS, "plan.verification.runs");
      const runAt = new Map(RUNS.filter((r) => nonEmptyStr(r?.id)).map((r) => [r.id, RUNS.indexOf(r)]));
      RUNS.forEach((r, i) => {
        if (!nonEmptyStr(r?.title)) err(`plan.verification.runs[${i}]: needs title`);
        if (r?.needs && !(runAt.get(r.needs) < i)) err(`plan.verification.runs[${i}]: needs "${r.needs}", which must be an earlier run`);
      });
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
        if (c.kind === "measure" && !READY.some((r) => /baseline/i.test(`${r?.id} ${r?.need}`))) warn(`${w}: a measure check compares with a baseline, but no ready item supplies one`);
        if (c.kind === "ask" && !nonEmptyStr(c.say)) err(`${w}: an ask check gives the words a person types in say`);
        if (words(c.title) > 10) warn(`${w}: title is ${words(c.title)} words; 10 at most`);
        budget(c.expect, 40, `${w}.expect`); budget(c.pass, 30, `${w}.pass`);
      });
      if (CHECKS.length && tickets.length && CHECKS.length > Math.ceil(tickets.length * 0.75)) warn(`plan.verification: ${CHECKS.length} checks for ${tickets.length} tickets; aim for about one per two tickets by letting one check cover several`);
      if (CHECKS.length) tickets.forEach((t) => { if (!covered.has(t.id)) err(`plan.verification: ticket "${t.id}" has no final check; every ticket is proven by at least one`); });
      else if (tickets.length) warn("plan.verification: no checks yet; agree the final checklist before the run");
    }
  }
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
    const pool = { ticket: ticketIds, pr: prIds, milestone: milestoneIds, outcome: outcomeIds, finding: findingIds }[kind];
    if (!pool) err(`${w}: attach "${d.attach}" must start with ticket:, pr:, milestone:, outcome: or finding:`);
    else if (!pool.has(id)) err(`${w}: attach names unknown ${kind} "${id}"`);
  }
  (d.blocks || []).forEach((t) => { if (!ticketIds.has(t) && !prIds.has(t)) err(`${w}: blocks unknown ticket or PR "${t}"`); });
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
  const num = (v) => typeof v === "number" && isFinite(v) && v >= 0;
  if (rep.totals !== undefined) {
    const Tt = rep.totals;
    if (!isObj(Tt)) err("report.totals: must be an object { prs_opened, prs_merged, approvals, commits, lines_added, lines_deleted, by_kind }");
    else {
      for (const k of ["prs_opened", "prs_merged", "approvals", "commits", "lines_added", "lines_deleted"]) if (Tt[k] !== undefined && !num(Tt[k])) err(`report.totals.${k}: must be a number`);
      if (Tt.by_kind !== undefined) {
        if (!isArr(Tt.by_kind)) err("report.totals.by_kind: must be a list");
        else Tt.by_kind.forEach((x, i) => {
          if (!KINDS.includes(x?.kind)) err(`report.totals.by_kind[${i}].kind: one of ${KINDS.join(", ")}`);
          for (const k of ["added", "deleted"]) if (!num(x?.[k])) err(`report.totals.by_kind[${i}].${k}: must be a number`);
        });
      }
    }
  }
  (rep.tests || []).forEach((x, i) => {
    if (!nonEmptyStr(x?.kind)) err(`report.tests[${i}].kind: missing`);
    for (const k of ["count", "passed"]) if (x?.[k] !== undefined && !num(x[k])) err(`report.tests[${i}].${k}: must be a number`);
    if (num(x?.count) && num(x?.passed) && x.passed > x.count) err(`report.tests[${i}]: passed is more than count`);
  });
  for (const k of ["works_now", "not_proven"]) if (rep[k] !== undefined && !(isArr(rep[k]) && rep[k].every(isStr))) err(`report.${k}: must be a list of strings`);
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

// ---------- architecture areas name real tickets ----------
(arch?.areas || []).forEach((a, i) => (a?.tickets || []).forEach((t) => { if (!ticketIds.has(t)) err(`architecture.areas[${i}] "${a.id}": unknown ticket "${t}"`); }));
(book.research || []).forEach((r, i) => {
  if (r?.shaped !== undefined && !isArr(r.shaped)) { err(`research[${i}].shaped: must be a list of ticket or PR ids`); return; }
  (r?.shaped || []).forEach((x) => { if (!ticketIds.has(x) && !prIds.has(x)) err(`research[${i}] "${r.id}": shaped names unknown ticket or PR "${x}"`); });
});

// ---------- executive summary and prompts ----------
const SECTION_IDS = new Set(["summary", "needs", "problem", "findings", "research", "architecture", "prototypes", "plan", "prs", "checks", "decisions", "kickoff", "progress", "report", "history"]);
function checkLink(link, where) {
  if (!isStr(link)) { err(`${where}: must be a string`); return; }
  const [kind, id] = link.includes(":") ? [link.slice(0, link.indexOf(":")), link.slice(link.indexOf(":") + 1)] : ["#", link.replace(/^#/, "")];
  const pool = { t: ticketIds, p: prIds, a: areaIds, r: researchIds }[kind];
  if (kind === "#") { if (!SECTION_IDS.has(id)) err(`${where}: "${link}" is not a section; use #section, t:ticket, p:pr, a:area or r:research`); }
  else if (!pool) err(`${where}: "${link}" must start with t:, p:, a:, r: or #`);
  else if (!pool.has(id)) err(`${where}: "${link}" names an unknown ${{ t: "ticket", p: "PR", a: "area", r: "research question" }[kind]}`);
}
if (book.summary !== undefined) {
  const S = book.summary;
  if (!isObj(S)) err("summary: must be an object { headline, numbers, timeline, points }");
  else {
    if (!nonEmptyStr(S.headline)) warn("summary.headline: missing; the first screen needs one plain sentence");
    (S.numbers || []).forEach((n, i) => { if (n?.value === undefined || n?.value === "" || !nonEmptyStr(n?.label)) err(`summary.numbers[${i}]: needs value and label`); });
    if ((S.numbers || []).length > 6) warn(`summary.numbers: ${S.numbers.length}; keep it to 6`);
    (S.timeline || []).forEach((x, i) => { if (!nonEmptyStr(x?.when) || !nonEmptyStr(x?.what)) err(`summary.timeline[${i}]: needs when and what`); });
    (S.points || []).forEach((x, i) => {
      if (!nonEmptyStr(x?.label) || !nonEmptyStr(x?.text)) err(`summary.points[${i}]: needs label and text`);
      if (x?.link !== undefined) checkLink(x.link, `summary.points[${i}].link`);
    });
    if ((S.points || []).length > 8) warn(`summary.points: ${S.points.length}; keep it to 8`);
  }
} else if (stageIdx >= 1) warn("summary: missing; a reader needs the whole story on the first screen");
if (book.prompts !== undefined && !isArr(book.prompts)) err("prompts: must be a list");
ids(book.prompts, "prompts");
(book.prompts || []).forEach((x, i) => { need(x, "title", `prompts[${i}]`, nonEmptyStr, "a string"); need(x, "text", `prompts[${i}]`, nonEmptyStr, "a string"); });
(book.needs || []).forEach((n, i) => { if (isStr(n?.link) && /^(t|p|a|r):/.test(n.link)) checkLink(n.link, `needs[${i}].link`); });

// ---------- word budgets (references/design.md) ----------
function words(t) { return String(t || "").trim().split(/\s+/).filter(Boolean).length; }
function budget(text, max, where) { if (isStr(text) && words(text) > max) warn(`${where}: ${words(text)} words; budget is ${max}`); }
budget(book.tagline, 15, "tagline");
budget(book.problem?.statement, 50, "problem.statement");
(book.outcomes || []).forEach((o, i) => budget(o.claim, 30, `outcomes[${i}].claim`));
(book.findings || []).forEach((f, i) => { budget(f.finding, 25, `findings[${i}].finding`); budget(f.solution, 25, `findings[${i}].solution`); budget(f.detail, 80, `findings[${i}].detail`); budget(f.solution_detail, 80, `findings[${i}].solution_detail`); });
if (isObj(book.summary)) {
  budget(book.summary.headline, 25, "summary.headline"); budget(book.summary.text, 50, "summary.text");
  (book.summary.points || []).forEach((x, i) => budget(x.text, 40, `summary.points[${i}].text`));
  (book.summary.timeline || []).forEach((x, i) => budget(x.what, 15, `summary.timeline[${i}].what`));
}
(arch?.areas || []).forEach((a, i) => {
  const w = `architecture.areas[${i}]`;
  budget(a.short, 12, `${w}.short`); budget(a.found, 90, `${w}.found`); budget(a.recommend, 90, `${w}.recommend`);
  budget(a.why, 70, `${w}.why`); budget(a.user_sees, 50, `${w}.user_sees`);
  budget(a.today?.caption, 25, `${w}.today.caption`); budget(a.proposed?.caption, 25, `${w}.proposed.caption`);
  (a.steps || []).forEach((st, j) => budget(st.text, 30, `${w}.steps[${j}]`));
  for (const k of ["tradeoffs", "not_building"]) (a[k] || []).forEach((x, j) => budget(x, 20, `${w}.${k}[${j}]`));
});
(plan?.prs || []).forEach((x, i) => { budget(x.title, 10, `plan.prs[${i}].title`); budget(x.problem, 40, `plan.prs[${i}].problem`); budget(x.outcome, 30, `plan.prs[${i}].outcome`); });
(book.research || []).forEach((r, i) => { budget(r.answer, 40, `research[${i}].answer`); (r.recommendations || []).forEach((x, j) => budget(x, 15, `research[${i}].recommendations[${j}]`)); });
(book.architecture?.frames || []).forEach((f, i) => budget(f.caption, 20, `architecture.frames[${i}].caption`));
(book.architecture?.frames || []).forEach((f, i) => {
  if ((f.points || []).length > 6) warn(`architecture.frames[${i}]: ${f.points.length} points; keep it to 6`);
  (f.points || []).forEach((pt, j) => { if (!nonEmptyStr(pt.label) || !nonEmptyStr(pt.text)) err(`architecture.frames[${i}].points[${j}]: needs label and text`); budget(pt.text, 22, `architecture.frames[${i}].points[${j}]`); });
});
tickets.forEach((t, i) => { budget(t.problem, 60, `plan.tickets[${i}].problem`); budget(t.solution, 120, `plan.tickets[${i}].solution`); budget(t.why_right, 60, `plan.tickets[${i}].why_right`); budget(t.verify?.run, 50, `plan.tickets[${i}].verify.run`); (t.reproduce || []).forEach((x, j) => budget(x, 25, `plan.tickets[${i}].reproduce[${j}]`)); });
tickets.forEach((t, i) => { budget(t.goal, 50, `plan.tickets[${i}].goal`); (t.done_when || []).forEach((d, j) => budget(d, 20, `plan.tickets[${i}].done_when[${j}]`)); });
(book.outcomes || []).forEach((o, i) => (o.done_when || []).forEach((d, j) => budget(d, 20, `outcomes[${i}].done_when[${j}]`)));
(plan?.milestones || []).forEach((m, i) => (m.done_when || []).forEach((d, j) => budget(d, 20, `plan.milestones[${i}].done_when[${j}]`)));
(book.decisions || []).forEach((d, i) => { budget(d.question, 15, `decisions[${i}].question`); budget(d.why, 30, `decisions[${i}].why`); (d.options || []).forEach((o, j) => budget(o.effect, 12, `decisions[${i}].options[${j}].effect`)); });
if (isObj(rep)) for (const k of ["blocked_on_you", "changed", "found", "attention", "works_now", "not_proven"]) (rep[k] || []).forEach((x, j) => budget(x, 25, `report.${k}[${j}]`));

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
