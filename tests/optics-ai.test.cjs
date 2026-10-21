/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness compiles server TS in memory. */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");
// Compile source in memory; no emitted files, network, credentials or live DB.
const root = path.resolve(__dirname, "..");
const originalLoad = Module._load;
const originalTs = require.extensions[".ts"];
const originalEnv = { ...process.env };
const originalFetch = global.fetch;
let teacher = false;
function clearProviderEnv() {
  delete process.env.OPENAI_API_KEY; delete process.env.OPTICS_AI_MODEL;
  delete process.env.GEMINI_API_KEY; delete process.env.OPTICS_AI_PROVIDER;
}
before(() => {
  process.env.NODE_ENV = "development";
  clearProviderEnv(); delete process.env.DATABASE_URL;
  Module._load = function(request, parent, main) {
    if (request === "server-only") return {};
    if (request === "@/lib/auth") return { isTeacherAuthenticated: async () => teacher };
    if (request.startsWith("@/")) request = path.join(root, request.slice(2));
    return originalLoad.call(this, request, parent, main);
  };
  require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
});
after(() => { Module._load = originalLoad; if (originalTs) require.extensions[".ts"] = originalTs; else delete require.extensions[".ts"]; process.env = originalEnv; global.fetch = originalFetch; });
const submission = q => ({ response: [...q.answers], explanation: "Em dùng điều kiện và quy luật vật lí của tình huống này.", confidence: 2 });
// The tutor is only consulted after a wrong choice, and written reasoning is
// optional, so an empty explanation also exercises the relaxed rule.
const wrongSubmission = q => {
  const wrong = q.choices.find(c => !q.answers.includes(c.value));
  assert.ok(wrong, `question ${q.id} has no distractor to pick`);
  return { response: [wrong.value], explanation: "", confidence: 2 };
};

test("18-question lifecycle preserves initial work, reserves final items and hides ungraded keys", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  let state = e.createAiState(randomUUID());
  const preIds = [];
  for (let i = 0; i < 4; i++) {
    preIds.push(state.current.id);
    const input = submission(state.current);
    state = await e.answerAiState(state, input, async () => { throw new Error("AI must not run on diagnostics"); });
    const publicData = e.aiView(state);
    assert.equal(publicData.entries[0].correct, undefined);
    assert.equal(publicData.entries[0].reference, undefined);
    assert.equal(JSON.stringify(publicData).includes('"answers"'), false);
    assert.equal(JSON.stringify(publicData).includes('"bank"'), false);
  }
  assert.equal(state.phase, "practice");
  for (let i = 0; i < 10; i++) {
    // Answer wrongly so every practice item takes the coach-then-retry path.
    state = await e.answerAiState(state, wrongSubmission(state.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
    assert.equal(state.needsRevision, true);
    const saved = structuredClone(state.entries.at(-1));
    await assert.rejects(e.answerAiState(state, submission(state.current), async () => { throw new Error("duplicate"); }));
    const changed = { ...submission(state.current), explanation: "Sau đối chiếu, em bổ sung điều kiện áp dụng của quy luật." };
    state = e.reviseAiState(state, changed);
    assert.deepEqual(state.entries.at(-1).response, saved.response);
    assert.equal(state.entries.at(-1).explanation, saved.explanation);
    assert.equal(state.entries.at(-1).revision.explanation, changed.explanation);
    assert.equal(state.entries.at(-1).revision.correct, true);
  }
  assert.equal(state.phase, "transfer");
  for (let i = 0; i < 4; i++) {
    assert.equal(preIds.includes(state.current.id), false);
    assert.equal(state.entries.some(entry => entry.question.id === state.current.id), false);
    state = await e.answerAiState(state, submission(state.current), async () => { throw new Error("AI must not run on final questions"); });
  }
  assert.equal(state.phase, "complete"); assert.equal(state.entries.length, 18);
  assert.equal(new Set(state.entries.map(entry => entry.question.id)).size, 18);
  // Wrong first on all ten practice items, fixed on the retry, so 18/18 final.
  assert.deepEqual(e.aiView(state).summary, { diagnostic: 4, transfer: 4, firstPractice: 0, revisedPractice: 10, aiCalls: 0, total: 18, finalCorrect: 18, bonusPoint: 2 });
  await assert.rejects(e.answerAiState(state, {}, async () => {}));
});

test("invalid choices and duplicate multi-select values are rejected; written reasoning is optional", () => {
  const e = require("../lib/optics-ai-engine.ts"); const q = e.createAiState(randomUUID()).current;
  assert.throws(() => e.validateSubmission(q, { ...submission(q), response: ["injected-answer"] }));
  assert.throws(() => e.validateSubmission(q, { ...submission(q), response: [q.choices[0].value, q.choices[0].value] }));
  assert.throws(() => e.validateSubmission(q, { ...submission(q), response: [] }));
  assert.throws(() => e.validateSubmission(q, { ...submission(q), confidence: 5 }));
  assert.throws(() => e.validateSubmission(q, { ...submission(q), explanation: "x".repeat(601) }));
  // Grading reads the selected answer, so an empty explanation is accepted.
  assert.equal(e.validateSubmission(q, { ...submission(q), explanation: "" }).explanation, "");
});

test("stored bank snapshots survive later edits to the shared question bank", () => {
  const e = require("../lib/optics-ai-engine.ts"); const bank = require("../lib/optics-review.ts").opticsReviewQuestions;
  const state = e.createAiState(randomUUID()); const previous = bank[0].explanation;
  bank[0].explanation = "changed only in test";
  assert.equal(state.bank.find(q => q.id === bank[0].id).explanation, previous); bank[0].explanation = previous;
});

// Reaches the only phase allowed to call a provider.
async function practiceState(e) {
  let state = e.createAiState(randomUUID());
  for (let i = 0; i < 4; i++) state = await e.answerAiState(state, submission(state.current), async () => {});
  assert.equal(state.phase, "practice");
  return state;
}

test("a correct practice answer advances without coaching or a provider call", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const base = await practiceState(e);
  const previous = base.current.id;
  const state = await e.answerAiState(base, submission(base.current), async () => { throw new Error("a correct answer must not consult the tutor"); });
  const entry = state.entries.at(-1);
  assert.equal(entry.correct, true);
  assert.equal(entry.feedback, undefined);
  assert.equal(state.needsRevision, false);
  assert.equal(state.aiCalls, 0);
  assert.notEqual(state.current.id, previous);
  // Practice shows the verdict and the standard reasoning straight away.
  const shown = e.aiView(state).entries.at(-1);
  assert.equal(shown.correct, true);
  assert.ok(shown.reference);
  assert.equal(state.current.requiresExplanation, false);
});

test("a wrong practice answer coaches once and withholds the reference until the retry", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const base = await practiceState(e);
  let state = await e.answerAiState(base, wrongSubmission(base.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
  assert.equal(state.needsRevision, true);
  let shown = e.aiView(state).entries.at(-1);
  assert.equal(shown.correct, false, "the student must know the choice was wrong");
  assert.equal(shown.reference, undefined, "the standard reasoning would give the retry away");
  assert.ok(shown.feedback.hint);
  // The rules nudge names the chosen option instead of repeating one fixed line.
  const chosen = base.current.choices.find(c => shown.response.includes(c.value)).label;
  assert.ok(shown.feedback.reflection.includes(chosen));
  state = e.reviseAiState(state, submission(base.current));
  shown = e.aiView(state).entries.at(-1);
  assert.equal(shown.revision.correct, true);
  assert.ok(shown.reference, "after the retry the reasoning is safe to show");
});

test("OpenAI adapter validates output, sends no identity and falls back on errors", async () => {
  const e = require("../lib/optics-ai-engine.ts"); const p = require("../lib/optics-ai-provider.ts");
  clearProviderEnv();
  const base = await practiceState(e);
  let captured;
  process.env.OPENAI_API_KEY = "fake-test-key"; process.env.OPTICS_AI_MODEL = "mock-structured-model";
  assert.equal(p.opticsAiProvider(), "openai");
  global.fetch = async (_url, options) => {
    captured = JSON.parse(options.body);
    return Response.json({ status: "completed", output: [{ type: "reasoning" }, { type: "message", content: [{ type: "output_text", text: JSON.stringify({ hint: "Em hãy kiểm tra điều kiện áp dụng.", reflection: "Dữ kiện nào quyết định hướng truyền?", reason: "Củng cố điều kiện còn chưa rõ.", nextQuestionId: captured && JSON.parse(captured.input).candidates[0].id }) }] }] });
  };
  const leaky = { ...wrongSubmission(base.current), explanation: "Em dựa vào điều kiện. Email abc@example.com số 0901234567." };
  const aiState = await e.answerAiState(base, leaky, p.generateOpticsFeedback);
  assert.equal(aiState.entries.at(-1).feedback.source, "ai"); assert.equal(aiState.aiCalls, 1);
  assert.equal(captured.store, false); assert.equal(captured.text.format.strict, true);
  assert.equal(captured.input.includes("abc@example.com"), false); assert.equal(captured.input.includes("0901234567"), false);
  assert.equal(captured.input.includes("className"), false); assert.equal(captured.input.includes("studentNumber"), false);
  assert.throws(() => p.validateAiFeedback({ hint: "x", reflection: "x", reason: "x", nextQuestionId: "fabricated" }, ["allowed"]));
  global.fetch = async () => Response.json({ status: "incomplete", output: [] });
  const fallback = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(fallback.entries.at(-1).feedback.source, "rules"); assert.equal(fallback.entries.at(-1).feedback.fallbackReason, "incomplete_output"); assert.equal(fallback.aiCalls, 0);
  global.fetch = async () => Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ hint: "gợi ý", reflection: "câu hỏi", reason: "lý do", nextQuestionId: "unapproved-question" }) }] }] });
  const invalid = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(invalid.entries.at(-1).feedback.fallbackReason, "invalid_question");
  global.fetch = originalFetch; clearProviderEnv();
});

test("provider selection: rules mode opens the lesson without a key and never calls the network", async () => {
  const e = require("../lib/optics-ai-engine.ts"); const p = require("../lib/optics-ai-provider.ts");
  clearProviderEnv();
  assert.equal(p.opticsAiProvider(), null); assert.equal(p.opticsAiConfigured(), false);
  process.env.OPTICS_AI_PROVIDER = "rules";
  assert.equal(p.opticsAiConfigured(), true); assert.equal(p.opticsAiModelName(), null);
  global.fetch = async () => { throw new Error("rules mode must not reach the network"); };
  const base = await practiceState(e);
  const state = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(state.entries.at(-1).feedback.source, "rules");
  assert.equal(state.entries.at(-1).feedback.fallbackReason, "rules_mode");
  assert.equal(state.aiCalls, 0);
  // An explicitly named provider stays disabled until its own key exists.
  process.env.OPTICS_AI_PROVIDER = "openai"; assert.equal(p.opticsAiProvider(), null);
  process.env.OPTICS_AI_PROVIDER = "gemini"; assert.equal(p.opticsAiProvider(), null);
  clearProviderEnv(); global.fetch = originalFetch;
});

test("Gemini adapter constrains output, sends no identity, retries once on 429 then degrades", async () => {
  const e = require("../lib/optics-ai-engine.ts"); const p = require("../lib/optics-ai-provider.ts");
  clearProviderEnv();
  const base = await practiceState(e);
  process.env.GEMINI_API_KEY = "fake-gemini-key";
  assert.equal(p.opticsAiProvider(), "gemini");
  // Free tier only gives 500 requests/day on Flash Lite; plain Flash stops at 20.
  assert.equal(p.opticsAiModelName(), "gemini-3.5-flash-lite");

  let captured;
  global.fetch = async (url, options) => {
    captured = { url: String(url), headers: options.headers, body: JSON.parse(options.body) };
    const ids = captured.body.generationConfig.responseSchema.properties.nextQuestionId.enum;
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ hint: "Kiểm tra điều kiện áp dụng.", reflection: "Dữ kiện nào quyết định?", reason: "Củng cố chủ đề yếu.", nextQuestionId: ids[0] }) }] } }] });
  };
  const leaky = { ...wrongSubmission(base.current), explanation: "Em dựa vào điều kiện. Email abc@example.com số 0901234567." };
  let state = await e.answerAiState(base, leaky, p.generateOpticsFeedback);
  const feedback = state.entries.at(-1).feedback;
  assert.equal(feedback.source, "ai"); assert.equal(state.aiCalls, 1);
  assert.equal(feedback.model, "gemini-3.5-flash-lite"); assert.equal(feedback.promptVersion, "optics-tutor-gemini-v3");
  assert.match(captured.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.5-flash-lite:generateContent$/);
  assert.equal(captured.headers["x-goog-api-key"], "fake-gemini-key");
  assert.equal(captured.body.generationConfig.responseMimeType, "application/json");
  assert.deepEqual(captured.body.generationConfig.responseSchema.required, ["hint", "reflection", "reason", "nextQuestionId"]);
  assert.ok(captured.body.generationConfig.responseSchema.properties.nextQuestionId.enum.length > 0);
  // The tutor must be told the answer is wrong and told never to reveal the key.
  assert.ok(captured.body.systemInstruction.parts[0].text.includes("CHỌN SAI"));
  const wire = JSON.stringify(captured.body);
  assert.equal(wire.includes("abc@example.com"), false); assert.equal(wire.includes("0901234567"), false);
  assert.equal(wire.includes("className"), false); assert.equal(wire.includes("studentNumber"), false);

  // Truncated or blocked generations must degrade, not throw.
  global.fetch = async () => Response.json({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{" }] } }] });
  state = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(state.entries.at(-1).feedback.fallbackReason, "incomplete_output"); assert.equal(state.aiCalls, 0);

  global.fetch = async () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ hint: "a", reflection: "b", reason: "c", nextQuestionId: "fabricated" }) }] } }] });
  state = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(state.entries.at(-1).feedback.fallbackReason, "invalid_question");

  // A class entering practice together can burst past the per-minute cap.
  let attempts = 0;
  global.fetch = async () => { attempts++; return new Response("rate limited", { status: 429 }); };
  state = await e.answerAiState(base, wrongSubmission(base.current), p.generateOpticsFeedback);
  assert.equal(attempts, 2, "exactly one spaced retry, so the daily budget is not burned");
  assert.equal(state.entries.at(-1).feedback.fallbackReason, "provider_429");
  assert.equal(state.entries.at(-1).feedback.source, "rules");
  global.fetch = originalFetch; clearProviderEnv();
});

test("daily budget window follows Pacific reset and fails open without a database", async () => {
  const budget = require("../lib/optics-ai-budget.ts");
  assert.equal(budget.aiDailyBudget(), 460);
  process.env.OPTICS_AI_DAILY_BUDGET = "500"; assert.equal(budget.aiDailyBudget(), 500);
  delete process.env.OPTICS_AI_DAILY_BUDGET;
  // 05:00 UTC on 6 Oct is still 5 Oct in Los Angeles, where the quota resets.
  assert.equal(budget.quotaDay(new Date("2026-10-06T05:00:00Z")), "2026-10-05");
  assert.equal(budget.quotaDay(new Date("2026-10-06T08:00:00Z")), "2026-10-06");
  // Metering must never block a lesson when there is no store to meter against.
  assert.equal(await budget.reserveAiCall(), true);
  assert.equal(await budget.readAiBudget(), null);
});

test("preview API: no DB needed, stale/parallel posts do not duplicate work, token protects state", async () => {
  const api = require("../app/api/optics-ai/route.ts"); const token = randomUUID();
  const request = body => new Request("http://localhost/api/optics-ai", { method: "POST", headers: { "Content-Type": "application/json", "X-Optics-Session": token, origin: "http://localhost" }, body: JSON.stringify(body) });
  let result = await api.POST(request({ action: "start", preview: true, className: "9H04", studentNumber: 1 })); assert.equal(result.status, 200);
  let view = (await result.json()).view;
  const wrongToken = await api.GET(new Request(`http://localhost/api/optics-ai?preview=1&id=${view.id}`, { headers: { "X-Optics-Session": randomUUID() } })); assert.equal(wrongToken.status, 404);
  const body = { action: "answer", preview: true, id: view.id, version: view.version, submission: { response: [view.question.choices[0].value], explanation: "Em dựa vào quy luật và dữ kiện đã cho.", confidence: 2 } };
  const results = await Promise.all([api.POST(request(body)), api.POST(request(body))]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  view = (await (await api.GET(new Request(`http://localhost/api/optics-ai?preview=1&id=${view.id}`, { headers: { "X-Optics-Session": token } }))).json()).view;
  assert.equal(view.entries.length, 1); assert.equal(view.version, 1);
  result = await api.POST(request(body)); assert.equal(result.status, 409);
  process.env.NODE_ENV = "production";
  result = await api.POST(request({ action: "start", preview: true, className: "9H04", studentNumber: 1 })); assert.equal(result.status, 403);
  teacher = true;
  result = await api.POST(request({ action: "start", preview: true, className: "9H04", studentNumber: 1 })); assert.equal(result.status, 200);
  teacher = false; process.env.NODE_ENV = "development";
});

test("API rejects cross-origin and malformed requests; teacher evidence requires authentication", async () => {
  const api = require("../app/api/optics-ai/route.ts");
  const token = randomUUID();
  let request = new Request("http://localhost/api/optics-ai", { method: "POST", headers: { origin: "http://other-site", "X-Optics-Session": token }, body: "{}" });
  assert.equal((await api.POST(request)).status, 403);
  request = new Request("http://localhost/api/optics-ai", { method: "POST", headers: { "X-Optics-Session": token }, body: "not-json" });
  assert.equal((await api.POST(request)).status, 400);
  const teacherApi = require("../app/api/teacher-optics-ai/route.ts");
  assert.equal((await teacherApi.GET(new Request("http://localhost/api/teacher-optics-ai?class=9H04&year=26-27"))).status, 401);
  // Missing local database is reported, not silently replaced by a pretend AI lesson.
  assert.equal((await api.GET(new Request("http://localhost/api/optics-ai"))).status, 503);
});

test("the lens lesson runs the same engine with its own bank and reserved anchors", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const { aiLessons } = require("../lib/ai-lessons.ts");
  const lens = aiLessons.lens;
  let state = e.createLessonState(lens, randomUUID());
  assert.equal(state.lessonVersion, "lens-ai-v1");
  assert.equal(state.lessonKey, "lens");
  assert.deepEqual(state.topics, ["lens-type", "focal", "rays", "image"]);
  // Every bank item must be gradeable and belong to a declared topic.
  for (const q of state.bank) {
    assert.ok(q.answers.length > 0, `${q.id} has no answer key`);
    assert.ok(q.explanation.trim().length > 0, `${q.id} has no explanation`);
    assert.ok(state.topics.includes(q.topic), `${q.id} has topic outside the lesson`);
    assert.ok(q.answers.every(a => q.choices.some(c => c.value === a)), `${q.id} has an answer not in its choices`);
    if (q.kind !== "multiple") assert.equal(q.answers.length, 1, `${q.id} is single choice but has several answers`);
  }
  assert.equal(new Set(state.bank.map(q => q.id)).size, state.bank.length, "duplicate question ids");

  const diagnosticIds = [];
  for (let i = 0; i < 4; i++) {
    diagnosticIds.push(state.current.id);
    state = await e.answerAiState(state, submission(state.current), async () => { throw new Error("AI must not run on diagnostics"); });
  }
  assert.deepEqual(diagnosticIds, lens.diagnosticIds);
  assert.equal(state.phase, "practice");
  for (let i = 0; i < 10; i++) {
    // Practice must never spend a reserved pre/post anchor.
    assert.equal(lens.diagnosticIds.includes(state.current.id), false);
    assert.equal(lens.transferIds.includes(state.current.id), false);
    state = await e.answerAiState(state, wrongSubmission(state.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
    state = e.reviseAiState(state, submission(state.current));
  }
  assert.equal(state.phase, "transfer");
  for (let i = 0; i < 4; i++) state = await e.answerAiState(state, submission(state.current), async () => { throw new Error("AI must not run on transfer"); });
  assert.equal(state.phase, "complete");
  assert.equal(state.entries.length, 18);
  assert.equal(new Set(state.entries.map(x => x.question.id)).size, 18);
  // Answer keys never reach the student projection.
  assert.equal(JSON.stringify(e.aiView(state)).includes('"answers"'), false);
});

test("analytics aggregates progress, weak topics and classes without claiming causality", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const { buildAnalytics, summariseStudent } = require("../lib/ai-analytics.ts");

  // Builds one finished session: diagnostics all wrong, practice wrong then
  // self-corrected, transfer all right. A clear "improved" shape.
  async function improvedSession() {
    let state = e.createAiState(randomUUID());
    for (let i = 0; i < 4; i++) state = await e.answerAiState(state, wrongSubmission(state.current), async () => {});
    for (let i = 0; i < 10; i++) {
      state = await e.answerAiState(state, wrongSubmission(state.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
      state = e.reviseAiState(state, submission(state.current));
    }
    for (let i = 0; i < 4; i++) state = await e.answerAiState(state, submission(state.current), async () => {});
    return state;
  }
  const state = await improvedSession();
  const row = summariseStudent({ className: "9H04", studentNumber: 1, lessonVersion: state.lessonVersion, createdAt: "2026-10-06T01:00:00.000Z", updatedAt: "2026-10-06T02:00:00.000Z", state });
  assert.equal(row.completed, true);
  assert.equal(row.diagnostic, 0); assert.equal(row.diagnosticTotal, 4);
  assert.equal(row.transfer, 4); assert.equal(row.transferTotal, 4);
  assert.equal(row.deltaPercent, 100, "0% then 100% is a 100 point gap");
  assert.equal(row.practiceFirst, 0); assert.equal(row.practiceRevised, 10);
  assert.equal(row.total, 18, "the denominator comes from the session, not a global constant");
  assert.equal(row.selfCorrected, 10, "every wrong practice answer was fixed on the retry");

  const second = await improvedSession();
  const analytics = buildAnalytics([
    { className: "9H04", studentNumber: 1, lessonVersion: state.lessonVersion, createdAt: "2026-10-06T01:00:00.000Z", updatedAt: "2026-10-06T02:00:00.000Z", state },
    { className: "9H05", studentNumber: 7, lessonVersion: second.lessonVersion, createdAt: "2026-10-13T01:00:00.000Z", updatedAt: "2026-10-13T02:00:00.000Z", state: second },
  ]);
  assert.equal(analytics.totals.sessions, 2);
  assert.equal(analytics.totals.completed, 2);
  assert.equal(analytics.totals.diagnosticPercent, 0);
  assert.equal(analytics.totals.transferPercent, 100);
  assert.equal(analytics.totals.deltaPercent, 100);
  assert.equal(analytics.totals.selfCorrectedPercent, 100);
  assert.deepEqual(analytics.classes.map(c => c.className), ["9H04", "9H05"]);
  // Weakest topics sort first so the teacher sees what to reteach.
  assert.ok(analytics.topics.length > 0);
  for (let i = 1; i < analytics.topics.length; i++) {
    assert.ok(analytics.topics[i - 1].accuracyPercent <= analytics.topics[i].accuracyPercent, "topics must sort weakest first");
  }
  assert.ok(analytics.topics.every(t => t.label && t.attempts > 0));
  // Separate days become separate trend points.
  assert.deepEqual(analytics.timeline.map(t => t.date), ["2026-10-06", "2026-10-13"]);

  // Percentages stay null rather than zero when a phase has no items yet.
  let partial = e.createAiState(randomUUID());
  partial = await e.answerAiState(partial, submission(partial.current), async () => {});
  const partialRow = summariseStudent({ className: "9H04", studentNumber: 2, lessonVersion: partial.lessonVersion, createdAt: "2026-10-06T01:00:00.000Z", updatedAt: "2026-10-06T01:05:00.000Z", state: partial });
  assert.equal(partialRow.completed, false);
  assert.equal(partialRow.transferTotal, 0);
  assert.equal(partialRow.deltaPercent, null, "no transfer items means no gap to report");
  assert.equal(buildAnalytics([]).totals.deltaPercent, null);
});

test("optics bank matches the midterm review brief", () => {
  const { buildOpticsAiBank, aiDiagnosticIds } = require("../lib/optics-ai-bank.ts");
  const bank = buildOpticsAiBank();
  const byId = new Map(bank.map(q => [q.id, q]));

  // Opening item is a "pick every correct statement" review question, not a drill.
  const opener = byId.get(aiDiagnosticIds[0]);
  assert.equal(opener.kind, "multiple");
  assert.ok(opener.answers.length > 1, "a review statement item should have several correct statements");
  assert.match(opener.prompt, /nhận định ĐÚNG/);

  // Total internal reflection condition includes the critical angle itself.
  const tir = byId.get("ai-pre-tir");
  assert.ok(tir.choices.some(c => /lớn hơn hoặc bằng góc giới hạn/.test(c.label)), "condition must read >= critical angle");
  assert.equal(tir.choices.some(c => /^Góc tới lớn hơn góc giới hạn$/.test(c.label)), false);

  // Light mixing is not taught, so those items must not reach this lesson.
  for (const id of ["c3-additive", "c3-red-blue-additive"]) assert.equal(byId.has(id), false, `${id} is light mixing and must be excluded`);
  const mixingWords = /cộng xanh lục|cộng xanh lam|đỏ cộng|cộng hai chùm/;
  for (const q of bank) {
    const text = [q.prompt, q.context ?? "", q.explanation, ...q.choices.map(c => c.label)].join(" ");
    assert.equal(mixingWords.test(text), false, `${q.id} still refers to mixing light beams`);
  }

  // Requested additions: which way the ray bends, and seeing across water.
  for (const id of ["ai-bend-into", "ai-bend-cases", "ai-see-pebble", "ai-see-branch"]) {
    assert.ok(byId.has(id), `missing requested question ${id}`);
    assert.equal(byId.get(id).topic, "refraction");
  }

  // Bank-wide integrity, same guarantees as the lens bank.
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length, "duplicate ids");
  for (const q of bank) {
    assert.ok(q.answers.length > 0 && q.explanation.trim(), `${q.id} is not gradeable`);
    assert.ok(q.answers.every(a => q.choices.some(c => c.value === a)), `${q.id} has an answer outside its choices`);
  }
});

test("analytics also aggregates ordinary practice attempts across every activity", () => {
  const { buildAnalytics } = require("../lib/ai-analytics.ts");
  const attempt = (className, studentNumber, practiceKey, label, correctCount, totalItems, submittedAt) =>
    ({ className, studentNumber, practiceKey, label, correctCount, totalItems, submittedAt });

  const analytics = buildAnalytics([], [
    attempt("9H04", 1, "optics-quest", "Photon Quest", 9, 12, "2026-10-01T02:00:00.000Z"),
    attempt("9H04", 1, "ohm-race", "Đường đua Điện học", 3, 6, "2026-10-08T02:00:00.000Z"),
    attempt("9H05", 2, "optics-quest", "Photon Quest", 12, 12, "2026-10-01T03:00:00.000Z"),
  ]);

  assert.equal(analytics.activityTotals.submissions, 3);
  assert.equal(analytics.activityTotals.students, 2, "two distinct students across the attempts");
  // 24 correct of 30 items overall.
  assert.equal(analytics.activityTotals.accuracyPercent, 80);

  // Weakest activity first, so the teacher sees what to reteach.
  assert.deepEqual(analytics.activities.map(a => a.practiceKey), ["ohm-race", "optics-quest"]);
  const quest = analytics.activities.find(a => a.practiceKey === "optics-quest");
  assert.equal(quest.submissions, 2);
  assert.equal(quest.students, 2);
  assert.equal(quest.correct, 21);
  assert.equal(quest.total, 24);
  assert.equal(quest.accuracyPercent, 87.5);
  assert.equal(quest.lastSubmittedAt, "2026-10-01T03:00:00.000Z", "keeps the most recent submission");

  // Per-student totals span activities rather than one lesson.
  const first = analytics.overall.find(r => r.className === "9H04" && r.studentNumber === 1);
  assert.equal(first.activities, 2);
  assert.equal(first.correct, 12); assert.equal(first.total, 18);
  assert.equal(first.accuracyPercent, 66.7);

  assert.deepEqual(analytics.activityTimeline.map(r => r.date), ["2026-10-01", "2026-10-08"]);
  assert.equal(analytics.activityTimeline[0].submissions, 2);

  // The tutored-lesson section stays empty and must not invent figures.
  assert.equal(analytics.totals.sessions, 0);
  assert.equal(analytics.totals.deltaPercent, null);
  // And with no data at all nothing blows up.
  const empty = buildAnalytics([], []);
  assert.equal(empty.activities.length, 0);
  assert.equal(empty.activityTotals.accuracyPercent, null);
});

test("roster sizes gate out roll numbers that belong to nobody", () => {
  const { getRosterSize, isOnRoster, taughtClassNames } = require("../lib/classes.ts");
  assert.deepEqual([...taughtClassNames], ["9H04", "9H05", "9H08", "9H09"]);
  assert.equal(getRosterSize("9H04"), 29);
  assert.equal(getRosterSize("9H05"), 33);
  assert.equal(getRosterSize("9H08"), 29);
  assert.equal(getRosterSize("9H09"), 29);
  assert.equal(isOnRoster("9H04", 29), true);
  assert.equal(isOnRoster("9H04", 30), false, "30 is beyond the 9H04 roll");
  assert.equal(isOnRoster("9H04", 33), false);
  assert.equal(isOnRoster("9H05", 33), true, "9H05 really has 33 students");
  assert.equal(isOnRoster("9H04", 0), false);
  // An untaught class keeps the generic ceiling so trial data is still readable
  // when the teacher explicitly asks to include everything.
  assert.equal(getRosterSize("9H10"), 33);
});

test("analytics reports item quality, pace, hint effect and triage", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const { buildAnalytics } = require("../lib/ai-analytics.ts");

  // Builds a finished session with a controllable answer pattern and clock, so
  // the derived measures can be asserted exactly.
  async function session(className, studentNumber, { wrongDiagnostics, fixPractice, secondsPerStep, hintSource }) {
    let clock = Date.parse("2026-10-06T01:00:00.000Z");
    const tick = () => { clock += secondsPerStep * 1000; return new Date(clock).toISOString(); };
    let state = e.createAiState(randomUUID());
    for (let i = 0; i < 4; i++) {
      const input = wrongDiagnostics ? wrongSubmission(state.current) : submission(state.current);
      state = await e.answerAiState(state, input, async () => {}, tick());
    }
    for (let i = 0; i < 10; i++) {
      state = await e.answerAiState(state, wrongSubmission(state.current), async (s, entry) => {
        const feedback = e.rulesFeedback(s, entry, "test");
        return { ...feedback, source: hintSource };
      }, tick());
      const retry = fixPractice ? submission(state.current) : wrongSubmission(state.current);
      state = e.reviseAiState(state, retry, tick());
    }
    for (let i = 0; i < 4; i++) state = await e.answerAiState(state, submission(state.current), async () => {}, tick());
    return { className, studentNumber, lessonVersion: state.lessonVersion, createdAt: "2026-10-06T01:00:00.000Z", updatedAt: new Date(clock).toISOString(), state };
  }

  const strong = await session("9H04", 1, { wrongDiagnostics: false, fixPractice: true, secondsPerStep: 30, hintSource: "ai" });
  const weak = await session("9H04", 2, { wrongDiagnostics: true, fixPractice: false, secondsPerStep: 40, hintSource: "ai" });
  const rusher = await session("9H05", 3, { wrongDiagnostics: true, fixPractice: true, secondsPerStep: 2, hintSource: "rules" });
  const a = buildAnalytics([strong, weak, rusher]);

  // Hint effectiveness is split by who wrote the hint.
  const ai = a.hintEffect.find(r => r.source === "ai");
  const rules = a.hintEffect.find(r => r.source === "rules");
  assert.equal(ai.hints, 20, "two students got ten hints each");
  assert.equal(ai.selfCorrected, 10, "only the strong student fixed them");
  assert.equal(ai.successPercent, 50);
  assert.equal(rules.hints, 10);
  assert.equal(rules.successPercent, 100);

  // Pace: the two-second student is flagged, the thirty-second one is not.
  const fast = a.pace.find(p => p.studentNumber === 3);
  assert.equal(fast.medianSeconds, 2);
  assert.ok(fast.fastAnswers >= 10, "nearly every step was under six seconds");
  assert.ok(fast.rushedRevisions >= 5);
  const steady = a.pace.find(p => p.studentNumber === 1);
  assert.equal(steady.medianSeconds, 30);
  assert.equal(steady.fastAnswers, 0);
  assert.equal(steady.medianHintSeconds, 30, "time between answering and revising");
  // Sorted fastest first so the teacher sees the risky ones at the top.
  assert.equal(a.pace[0].studentNumber, 3);

  // Triage puts the student who could not self-correct ahead of the secure one.
  const bandOf = n => a.triage.find(t => t.studentNumber === n).band;
  assert.equal(bandOf(3), "rushing", "speed is caught before anything else");
  assert.equal(bandOf(2), "needs-teacher", "wrong a lot and hints did not help");
  // This student answered every practice item wrong first, then fixed all ten,
  // so 8/18 first time: not "secure", but a clear self-corrector.
  assert.equal(bandOf(1), "self-corrects");

  // Item analysis: every served question is described, weakest first.
  assert.ok(a.items.length >= 18);
  for (let i = 1; i < a.items.length; i++) {
    assert.ok(a.items[i - 1].difficultyPercent <= a.items[i].difficultyPercent, "items sort hardest first");
  }
  const practiceItem = a.items.find(it => it.hintsGiven > 0);
  assert.ok(practiceItem.topDistractor, "a wrong pick must be named");
  assert.ok(practiceItem.topDistractor.count > 0);
  assert.ok(practiceItem.topDistractor.label.length > 0);
  // Diagnostics were answered correctly only by the strong student, so the
  // opening items separate the groups rather than confusing everyone.
  const opener = a.items.find(it => it.questionId === "ai-pre-sine");
  assert.equal(opener.served, 3);
  assert.equal(opener.correctFirst, 1);
  assert.equal(opener.difficultyPercent, 33.3);

  // Per-topic opening versus closing, and bank upkeep.
  assert.ok(a.topicShift.length > 0);
  for (const row of a.topicShift) assert.ok(row.label && row.label.length > 0);
  assert.ok(Array.isArray(a.unusedQuestions));
  assert.equal(a.unusedQuestions.some(q => q.questionId === "ai-pre-sine"), false, "a served question is not listed as unused");

  // Nothing blows up with no sessions at all.
  const empty = buildAnalytics([], []);
  assert.deepEqual(empty.items, []);
  assert.deepEqual(empty.pace, []);
  assert.deepEqual(empty.triage, []);
  assert.deepEqual(empty.hintEffect, []);
});

test("bonus points follow the same ladder as the other practices", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const { aiBonusPoint, OPTICS_AI_TOTAL } = require("../lib/optics-ai-types.ts");
  const { getPracticeBonusPoint } = require("../lib/practice-attempt-types.ts");
  const { summariseStudent } = require("../lib/ai-analytics.ts");

  // Identical ladder, so a student sees one consistent rule across every activity.
  for (let correct = 0; correct <= OPTICS_AI_TOTAL; correct++) {
    assert.equal(aiBonusPoint(correct, OPTICS_AI_TOTAL), getPracticeBonusPoint(correct, OPTICS_AI_TOTAL));
  }
  assert.equal(OPTICS_AI_TOTAL, 18, "4 diagnostic + 10 practice + 4 transfer");
  assert.equal(aiBonusPoint(18), 2);
  assert.equal(aiBonusPoint(17), 1);
  assert.equal(aiBonusPoint(16), 0);

  // Walks a lesson, missing exactly `missTransfer` of the closing items.
  async function run(missTransfer) {
    let state = e.createAiState(randomUUID());
    for (let i = 0; i < 4; i++) state = await e.answerAiState(state, submission(state.current), async () => {});
    for (let i = 0; i < 10; i++) {
      state = await e.answerAiState(state, wrongSubmission(state.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
      state = e.reviseAiState(state, submission(state.current));
    }
    for (let i = 0; i < 4; i++) {
      const miss = i < missTransfer;
      state = await e.answerAiState(state, miss ? wrongSubmission(state.current) : submission(state.current), async () => {});
    }
    return state;
  }

  const perfect = await run(0);
  assert.equal(e.finalCorrectCount(perfect), 18);
  assert.equal(e.aiView(perfect).summary.bonusPoint, 2, "all eighteen earns +2 even when the hint was used");

  const oneShort = await run(1);
  assert.equal(e.finalCorrectCount(oneShort), 17);
  assert.equal(e.aiView(oneShort).summary.bonusPoint, 1);

  const twoShort = await run(2);
  assert.equal(e.finalCorrectCount(twoShort), 16);
  assert.equal(e.aiView(twoShort).summary.bonusPoint, 0);

  // A lesson still in progress must never advertise an award.
  let partial = e.createAiState(randomUUID());
  for (let i = 0; i < 4; i++) partial = await e.answerAiState(partial, submission(partial.current), async () => {});
  assert.notEqual(partial.phase, "complete");
  assert.equal(e.aiView(partial).summary.bonusPoint, 0);
  // And the student projection keeps the count sealed until the end.
  assert.equal(e.aiView(partial).summary.finalCorrect, 0);
  assert.equal(e.aiView(partial, true).summary.finalCorrect, 4, "the teacher can always see it");

  // Analytics carries the same figures for the dashboard and the CSV export.
  const row = summariseStudent({ className: "9H04", studentNumber: 1, lessonVersion: perfect.lessonVersion, createdAt: "2026-10-06T01:00:00.000Z", updatedAt: "2026-10-06T02:00:00.000Z", state: perfect });
  assert.equal(row.finalCorrectAll, 18);
  assert.equal(row.bonusPoint, 2);
  assert.equal(row.firstCorrectAll, 8, "eight right first time: four opening plus four closing");
});

test("the practice pool is curated: no light mixing, no twins of the sealed anchors", () => {
  const { buildOpticsAiBank, aiDiagnosticIds, aiTransferIds } = require("../lib/optics-ai-bank.ts");
  const bank = buildOpticsAiBank();
  const reserved = new Set([...aiDiagnosticIds, ...aiTransferIds]);
  const practice = bank.filter(q => !reserved.has(q.id));

  // Dropped on purpose: beam mixing is outside this unit, and these items
  // restate an anchor closely enough to spoil the pre/post comparison.
  for (const id of [
    "c3-additive", "c3-red-blue-additive", "p2-two-prisms", "c2-yellow-surface",
    "t1-conditions", "t1-air-glass-impossible", "p1-cause", "p1-not-create-color",
    "p1-mono", "p2-red-filter", "c2-color-filters", "r1-air-glass",
  ]) {
    assert.equal(bank.some(q => q.id === id), false, `${id} must not be in the tutored lesson`);
  }

  // No additive-mixing language survives anywhere a student can read it.
  const text = practice.flatMap(q => [q.prompt, q.context ?? "", ...q.choices.map(c => c.label), q.explanation]).join(" ").toLowerCase();
  for (const phrase of ["trộn ánh sáng", "chồng lên nhau", "chồng nhau"]) {
    assert.equal(text.includes(phrase), false, `practice pool still mentions "${phrase}"`);
  }

  // Enough breadth left to serve ten personalised items with room to spare,
  // and every topic can still be reached.
  const { aiLessons } = require("../lib/ai-lessons.ts");
  const { AI_PRACTICE_COUNT, AI_LEGACY_PRACTICE_COUNT, OPTICS_AI_TOTAL, aiStateTotal } = require("../lib/optics-ai-types.ts");
  assert.equal(AI_PRACTICE_COUNT, 10);
  assert.equal(OPTICS_AI_TOTAL, 4 + AI_PRACTICE_COUNT + 4);
  for (const lesson of Object.values(aiLessons)) {
    assert.equal(lesson.practiceCount, AI_PRACTICE_COUNT);
    const pool = lesson.buildBank().filter(q => ![...lesson.diagnosticIds, ...lesson.transferIds].includes(q.id));
    assert.ok(pool.length > lesson.practiceCount, `${lesson.key} pool is too small to personalise`);
    for (const topic of lesson.topics) {
      assert.ok(pool.filter(q => q.topic === topic).length >= 2, `${lesson.key} has too few ${topic} items`);
    }
  }

  // A session saved before the lesson grew keeps counting to its own length.
  assert.equal(aiStateTotal({}), 4 + AI_LEGACY_PRACTICE_COUNT + 4);
  assert.equal(aiStateTotal({ preIds: ["a", "b", "c", "d"], postIds: ["e", "f", "g", "h"], practiceCount: 10 }), 18);
});

test("the teacher can force-complete a lesson wherever the student is, and the scoreboard reads it correctly", async () => {
  const e = require("../lib/optics-ai-engine.ts");
  const { buildClassScoreboard } = require("../lib/ai-analytics.ts");

  // Student mid-practice, with a wrong answer still waiting for its retry.
  let midPractice = e.createAiState(randomUUID());
  for (let i = 0; i < 4; i++) midPractice = await e.answerAiState(midPractice, submission(midPractice.current), async () => {});
  midPractice = await e.answerAiState(midPractice, wrongSubmission(midPractice.current), async (s, entry) => e.rulesFeedback(s, entry, "test"));
  assert.equal(midPractice.needsRevision, true);
  const stoppedVersion = midPractice.version;

  const forced = e.forceCompleteAiState(midPractice);
  assert.equal(forced.phase, "complete");
  assert.equal(forced.needsRevision, false);
  assert.equal(forced.current, null);
  assert.ok(forced.forcedAt);
  assert.equal(forced.version, stoppedVersion + 1, "bumping the version invalidates any in-flight request from the student");
  // The unresolved wrong answer stands as wrong; it is not silently fixed.
  assert.equal(forced.entries.at(-1).correct, false);
  assert.equal(forced.entries.at(-1).revision, undefined);
  assert.equal(e.finalCorrectCount(forced), 4);
  assert.equal(e.aiView(forced).forcedAt, forced.forcedAt);
  assert.equal(e.aiView(forced).summary.bonusPoint, 0, "well short of the ladder, no award");

  // Calling it again on an already-forced or already-finished session is a no-op.
  const twice = e.forceCompleteAiState(forced);
  assert.equal(twice.version, forced.version);
  assert.equal(twice.forcedAt, forced.forcedAt);

  // A fresh student who had not started yet is untouched by force-completing someone else's session.
  const neverStarted = e.createAiState(randomUUID());
  assert.notEqual(neverStarted.phase, "complete");

  // A student who finished normally keeps their own completion, not a forced one.
  let finished = e.createAiState(randomUUID());
  for (let i = 0; i < 4; i++) finished = await e.answerAiState(finished, submission(finished.current), async () => {});
  for (let i = 0; i < 10; i++) finished = await e.answerAiState(finished, submission(finished.current), async () => { throw new Error("must not call AI on a correct answer"); });
  for (let i = 0; i < 4; i++) finished = await e.answerAiState(finished, submission(finished.current), async () => {});
  assert.equal(finished.phase, "complete");
  const untouched = e.forceCompleteAiState(finished);
  assert.equal(untouched.version, finished.version, "already complete, nothing to force");
  assert.equal(untouched.forcedAt, undefined);

  // Scoreboard: one forced mid-way, one finished on their own, two never started,
  // on a roster of 4, plus a stray roll number above the roster.
  const sessions = [
    { studentNumber: 1, state: forced },
    { studentNumber: 2, state: finished },
    { studentNumber: 9, state: midPractice }, // an off-roster trial run, still shown
  ];
  const board = buildClassScoreboard(sessions, 4);
  assert.equal(board.length, 5, "4 roster numbers plus the stray 9");
  assert.deepEqual(board.map(r => r.studentNumber), [1, 2, 3, 4, 9]);

  const row1 = board.find(r => r.studentNumber === 1);
  assert.equal(row1.onRoster, true); assert.equal(row1.started, true); assert.equal(row1.completed, true);
  assert.equal(row1.forced, true); assert.equal(row1.answered, 5); assert.equal(row1.total, 18);
  assert.equal(row1.finalCorrect, 4); assert.equal(row1.bonusPoint, 0);

  const row2 = board.find(r => r.studentNumber === 2);
  assert.equal(row2.forced, false); assert.equal(row2.completed, true);
  assert.equal(row2.finalCorrect, 18); assert.equal(row2.bonusPoint, 2);

  const row3 = board.find(r => r.studentNumber === 3);
  assert.equal(row3.started, false); assert.equal(row3.completed, false);
  assert.equal(row3.answered, 0); assert.equal(row3.total, 0); assert.equal(row3.bonusPoint, 0);

  const row9 = board.find(r => r.studentNumber === 9);
  assert.equal(row9.onRoster, false, "roll number above the roster is flagged, not hidden");
  assert.equal(row9.started, true); assert.equal(row9.completed, false);
});
