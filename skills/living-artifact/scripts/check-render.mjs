#!/usr/bin/env node
// Rendered checks for a built book (references/design.md, "What the build checks").
//   node scripts/check-render.mjs <book-dir>/index.html
// Opens the page in headless Chromium at 1440, 1280, 1024, 768 and 390 px, in human and agent mode, and fails
// (exit 1) when the header clips, the page scrolls sideways, a section link is cut off, the human page lacks a
// ticket, the kickoff, a decision, a research file or a table row, agent mode looks like human mode, a section
// surface is taller than 900 px at 1280, the console shows an error, or the page asks the network for anything.
// Playwright is looked up in this order: the PLAYWRIGHT env path, a local install, /opt/node-tools.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const file = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!file || !fs.existsSync(file)) { console.error("Usage: node scripts/check-render.mjs <book-dir>/index.html"); process.exit(1); }
const req = createRequire(import.meta.url);
let pw = null;
for (const p of [process.env.PLAYWRIGHT, "playwright", "/opt/node-tools/node_modules/playwright"].filter(Boolean)) { try { pw = req(p); break; } catch {} }
if (!pw) { console.error("rendered checks: Playwright is not installed here, so they did not run (unknown, not passed). Install playwright or set PLAYWRIGHT=<path>."); process.exit(2); }

const html = fs.readFileSync(file, "utf8");
const B = JSON.parse(html.match(/<script id="book-data" type="application\/json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
const errors = [];
const fail = (m) => errors.push(m);
const url = "file://" + file;
const WIDTHS = [1440, 1280, 1024, 768, 390];
const browser = await pw.chromium.launch();
const pageAt = async (w, q) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  const where = `${w} px${q ? " " + q : ""}`;
  p.on("pageerror", (e) => fail(`${where}: page error: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error") fail(`${where}: console error: ${m.text()}`); });
  await p.route("**/*", (r) => { const u = r.request().url(); if (/^(file|data|blob|about):/.test(u)) return r.continue(); fail(`${where}: network request to ${u}`); return r.abort(); });
  await p.goto(url + (q || ""));
  await p.waitForTimeout(250);
  return { p, ctx };
};

const headerCheck = () => {
  const out = [], top = document.querySelector(".top__in");
  if (top.scrollWidth > top.clientWidth + 1) out.push(`header row overflows (${top.scrollWidth} > ${top.clientWidth})`);
  top.querySelectorAll("*").forEach((el) => {
    const cs = getComputedStyle(el); if (cs.display === "none" || el.closest(".links__menu") || el.closest("svg")) return;
    if (el.matches(".mark span")) return; // the subtitle may shorten
    const r = el.getBoundingClientRect(); if (!r.width) return;
    if (r.right > innerWidth + 1 || r.left < -1) out.push(`header item "${(el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 30)}" is outside the window`);
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && cs.overflow !== "visible") out.push(`header text "${el.textContent.trim().slice(0, 30)}" is cut off`);
  });
  const mode = document.querySelector('button[data-mode="agent"]'), mr = mode.getBoundingClientRect();
  if (!mr.width || mr.right > innerWidth) out.push("the Human and Agent switch is not visible");
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`the page scrolls sideways (${document.documentElement.scrollWidth} > ${innerWidth})`);
  return out;
};

for (const w of WIDTHS) {
  // human mode
  {
    const { p, ctx } = await pageAt(w, "?mode=human");
    (await p.evaluate(headerCheck)).forEach((m) => fail(`${w} px human: ${m}`));
    if (w < 1024) { await p.click("#menubtn"); await p.waitForTimeout(150); }
    const nav = await p.evaluate((ids) => {
      const side = document.querySelector("#side"), sr = side.getBoundingClientRect(), out = [];
      if (getComputedStyle(side).visibility === "hidden" || !sr.width) return ["the section menu is not open"];
      if (sr.right > innerWidth + 1) out.push("the menu is wider than the window");
      ids.forEach((id) => { const a = side.querySelector(`.sl[data-sec="${id}"]`); if (!a) { out.push(`section "${id}" has no menu link`); return; } const r = a.getBoundingClientRect(); if (r.right > sr.right + 1 || r.left < sr.left - 1 || r.right > innerWidth + 1) out.push(`menu link "${id}" is cut off`); });
      return out;
    }, (B.sections || []).filter((s) => s.nav !== false).map((s) => s.id));
    nav.forEach((m) => fail(`${w} px human: ${m}`));
    if (w === 1280) {
      const dom = await p.evaluate(() => document.querySelector("#main").textContent.replace(/\s+/g, " "));
      const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
      const has = (t, what) => { if (t && !dom.includes(norm(t))) fail(`1280 px human: the page lacks ${what}: "${norm(t).slice(0, 70)}"`); };
      (B.plan?.tickets || []).forEach((t) => has(t.title, "a ticket title"));
      if (B.kickoff) { const k = await p.evaluate(() => Array.from(document.querySelectorAll("#main pre")).some((x) => x.textContent === JSON.parse(document.getElementById("book-data").textContent).kickoff)); if (!k) fail("1280 px human: the full kickoff prompt is not on the human page"); }
      (B.decided || []).forEach((d) => has(d.what, "a decision"));
      (B.research || []).forEach((r) => r.file && has(r.file.split("/").pop(), "a research file name"));
      (B.sections || []).forEach((s) => (s.depth || []).forEach((b) => { if (b.kind === "table") (b.data?.rows || []).forEach((r) => { const c = (Array.isArray(r) ? r : r.cells || [])[0]; has(c && typeof c === "object" ? c.label : c, `row of "${b.title}"`); }); }));
      const tall = await p.evaluate(() => Array.from(document.querySelectorAll("#main > section.sec")).map((s) => {
        const comp = s.dataset.component; if (comp === "plan" || comp === "chapter" || comp === "build") return null;
        const stop = s.querySelector(":scope > .now, :scope > .secfoot, :scope > .declink, :scope > .toc, :scope > .depth");
        const top = (s.querySelector("h1, h2") || s).getBoundingClientRect().top, bottom = (stop ? stop.getBoundingClientRect().top : s.getBoundingClientRect().bottom);
        return bottom - top > 900 ? `${s.id} (${Math.round(bottom - top)} px)` : null;
      }).filter(Boolean));
      tall.forEach((x) => fail(`1280 px human: the surface of ${x} is taller than 900 px; move detail into depth`));
      // a ticket opens in a drawer with every field
      const tk = (B.plan?.tickets || [])[0];
      if (tk) { await p.evaluate((id) => { location.hash = "plan/" + id; }, tk.id); await p.waitForTimeout(200); const ok = await p.evaluate(() => !document.getElementById("tdrawer").hidden && /Goal/.test(document.getElementById("tdrawer").textContent) && /How it is verified/.test(document.getElementById("tdrawer").textContent)); if (!ok) fail("1280 px human: a ticket link does not open its drawer with goal and verification"); }
    }
    await ctx.close();
  }
  // agent mode
  {
    const { p, ctx } = await pageAt(w, "?mode=agent#agent/tables/tickets");
    (await p.evaluate(headerCheck)).forEach((m) => fail(`${w} px agent: ${m}`));
    const a = await p.evaluate(() => ({ main: !!document.querySelector("#shell") && getComputedStyle(document.querySelector("#shell")).display !== "none", aws: getComputedStyle(document.getElementById("aws")).display, font: getComputedStyle(document.body).fontFamily, rows: document.querySelectorAll(".atbl tbody tr.arow").length, cols: document.querySelectorAll(".atbl thead th").length, tree: document.querySelectorAll("#tree button").length }));
    if (a.main) fail(`${w} px agent: the human sections still show in agent mode`);
    if (a.aws === "none") fail(`${w} px agent: the agent workspace is hidden`);
    if (!/mono/i.test(a.font)) fail(`${w} px agent: agent mode is not monospace`);
    if (a.rows !== (B.plan?.tickets || []).length) fail(`${w} px agent: tables/tickets shows ${a.rows} rows for ${(B.plan?.tickets || []).length} tickets`);
    if (a.cols < 15 && (B.plan?.tickets || []).length) fail(`${w} px agent: tables/tickets has ${a.cols} columns; every field is a column`);
    if (!a.tree) fail(`${w} px agent: the file tree is empty`);
    if (w < 1024) { await p.click("#menubtn"); await p.waitForTimeout(150); const vis = await p.evaluate(() => getComputedStyle(document.getElementById("tree")).visibility !== "hidden"); if (!vis) fail(`${w} px agent: the menu button does not open the tree`); }
    await ctx.close();
  }
}
await browser.close();
if (errors.length) { [...new Set(errors)].forEach((e) => console.error("render error: " + e)); console.error(`\nrendered checks: ${new Set(errors).size} error(s) at ${WIDTHS.join(", ")} px.`); process.exit(1); }
console.error(`rendered checks: passed at ${WIDTHS.join(", ")} px, human and agent mode.`);
