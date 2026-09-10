# CyberAgents v2 — Requirements (DRAFT v1)

> Living doc. We iterate on this before writing code.

## Timeline (two reviews)
- **Review 1 (now)**: working autonomous AI agent, running locally. Prove the
  brain is real (no mocks). This is the bar for "not a shit project."
- **Review 2 (later this month)**: finalize + enhance + **hosted sandbox
  deployment**. Polish, always-on dashboard.

## 0. One-line pitch
Autonomous AI pentest copilot: state a target in plain English → specialized
agents plan, run real tools in a sandbox, verify findings, and publish a live
web report. **Authorized targets only.**

## 1. Why v2 (the gap we're closing)
Friend's `reference/cyberagents` already has the architecture (LangGraph
9-agent, Docker sandbox, FastAPI + React, SSE, RAG, reports). But the brain is
**mocked**: risk score, critic confidence, findings, and the report are
hardcoded; the LLM falls back to a canned simulation. Same target → same
answer every run.

**v2 = same architecture, real brain.** Every hardcoded value becomes a real
LLM/tool-derived value. That is the differentiator.

## 2. What we KEEP from the reference (don't rebuild)
- [ ] Docker sandbox execution (`execution/sandbox.py`, `worker_manager.py`) — real
- [ ] Tool registry + nmap runner
- [ ] React/Vite UI, SSE event stream, reports view
- [ ] FastAPI backend + LangGraph workflow skeleton
- [ ] Target scope validator + auth gating

## 3. What we FIX / make real (the work)
- [ ] Scanning agent: use real nmap output, delete the hardcoded ports fallback
- [ ] Critic agent: real evidence-vs-output confidence, not `96%`
- [ ] Risk agent: real CVSS-based score, not `8.4`
- [ ] Vulnerability agent: real service-version → CVE mapping (NVD/OSV API)
- [ ] Report agent: generate from actual findings, not `INITIAL_REPORTS[0]`
- [ ] LLM: require a working key/endpoint; remove silent simulation fallback
- [ ] Salvage from old desktop app: `normalize_target` + tool detect/install

## 4. Scope decisions (LOCKED)
- **Q1 Deployment**: local for Review 1 → **hosted sandbox** for Review 2. ✅
- **Q2 LLM**: reuse old project's OpenAI-compatible endpoint + embedded key
  (`llm.py` / `secrets_embedded.py` `.env`: `LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY`).
  Plug into reference's LangChain factory (same OpenAI protocol). ✅
- **Q3 Active tools**: recon + scan + vuln-mapping + exploit **advisor**.
  **NO real exploitation.** ✅
- **Q4 Report site**: **always-on web dashboard.** ✅ (history = see §Non-goals)
- **Q5 Goal**: **a working autonomous AI agent.** ✅

## Non-goals (explicitly OUT)
- Real exploitation / running exploits
- Multi-target assessments
- Continuous monitoring
- Cross-run history persistence — state lives only within one run; re-running
  the **same target** continues/updates that target's context, nothing else.

## 5. Hard requirements (non-negotiable)
- [ ] Authorization gate before ANY active tool touches a target
- [ ] All tool execution inside sandbox, never on host
- [ ] Audit log of every tool run + every auth decision
- [ ] No hardcoded findings — a fresh target must produce fresh results
- [ ] Reproducible: `docker compose up` brings the whole stack live

## 6. Success criteria (how we prove it's "next level")
- [ ] Run against 2 different authorized targets → 2 genuinely different reports
- [ ] Findings trace to real tool output (show the raw evidence)
- [ ] CVE references resolve to real advisories
- [ ] Live agent trace visible in UI while running

## 7. Open questions / parking lot
- Auth beyond a checkbox (scope file, DNS TXT proof of ownership)? — decide later
- Which hosted sandbox provider for Review 2 (Fly/Render/E2B/self-host)? — decide before R2
- Exploit advisor: how far does "advice" go before it's too much? — define guardrail

## 8. Phased plan + to-dos

Dependency-ordered. Each phase produces something demoable. Phases 0–4 = Review 1
(real autonomous agent, local). Phases 5–6 = Review 2 (hosted + polish).

### Coding standards
- No unnecessary comments. Code self-explains; comment only non-obvious *why*.
- Ponytail: smallest working diff, reuse before adding, no speculative scaffolding.

### Known mocks to kill (inventory — replaces `# MOCK:` tagging)
- `backend/graph/nodes.py`: research/vulnerability/critic/risk/report nodes all
  hardcoded (risk `8.4`, critic `96%`, report = `INITIAL_REPORTS[0]`, final
  response hardcodes CVE-2021-41773). → Phase 2/3
- `backend/agents/scanning.py`: fallback `http/https/spring-actuator/ssh`, ports=2. → Phase 1
- `backend/rag/retriever.py`: serves `INITIAL_KNOWLEDGE` mock. → Phase 2
- `backend/services/mock_data.py`: source of all canned findings/reports/knowledge.

### Phase 0 — Foundation / merge (½ day)  ✅ mostly done
- [x] Adopt base as **new repo** → `~/Developer/cyberagents-v2` (friend's git history kept, remote detached)
- [x] Copy old project's `.env` LLM values in (`llm.kimchi.dev`, `deepseek-v4-flash-0731`), `DEMO_MODE=false`
- [x] Endpoint verified with a real completion (curl → `ok`)
- [x] Remove silent simulation fallback → `factory.py` now raises `RuntimeError` if no real key
- [ ] `docker compose up` brings full stack live locally (backend, frontend, sandbox, db)
- **Demo**: stack runs, one real LLM call succeeds. *(LLM call ✅; full stack pending)*

### Phase 1 — Real scanning (1 day)
- [ ] Scanning agent: delete hardcoded `http/https/spring-actuator/ssh` + `ports_count=2`
- [ ] Use real nmap JSON from sandbox; empty result = empty, not fake
- [ ] Recon agent: confirm DNS/HTTP-header inspection is real (fix if mocked)
- [ ] Evidence entries carry raw tool output, not prose summaries
- **Demo**: scan 2 targets → genuinely different open-ports/services.

### Phase 2 — Real vulnerability mapping (1–2 days)
- [ ] Service version → CVE lookup via NVD or OSV API (pick one; cache responses)
- [ ] Vuln agent emits candidate findings with real CVE IDs + evidence links
- [ ] RAG: confirm retriever returns real docs (OWASP/CWE/MITRE), not `INITIAL_KNOWLEDGE`
- **Demo**: a discovered service version resolves to a real advisory.

### Phase 3 — Real critic + risk + report (1–2 days)
- [ ] Critic: LLM-scored confidence from evidence vs. raw output (no fixed `96%`)
- [ ] Risk: compute from findings (CVSS-based), not fixed `8.4`
- [ ] Report agent: generate from actual findings, drop `INITIAL_REPORTS[0]`
- [ ] `final_response`: templated from real state, no hardcoded CVE-2021-41773
- **Demo**: 2 targets → 2 different reports (risk, findings, CVEs all differ).

### Phase 4 — Autonomy + exploit advisor + salvage (1 day)
- [ ] Supervisor/planner loop runs end-to-end unattended after authorization
- [ ] Exploit **advisor** node: suggests commands, never executes (guardrail in §7)
- [ ] Fold in old project's `normalize_target` + tool detect/install
- [ ] Auth gate verified: no active tool runs pre-confirmation; audit log present
- **Demo (Review 1 bar)**: plain-English target → autonomous run → live report.

### Phase 5 — Hosted sandbox deploy (Review 2)
- [ ] Pick provider (Fly / Render / E2B / self-host) — §7 open question
- [ ] Sandbox isolation + resource limits validated in hosted env
- [ ] Always-on web dashboard reachable

### Phase 6 — Polish (Review 2)
- [ ] UI/UX pass on trace + report views
- [ ] Same-target re-run continues that target's context
- [ ] Docs + demo script for faculty

---
### Changelog
- v2 (2026-09-10): added phased plan + to-dos (§8).
- v1 (2026-09-10): locked scope (§4), added timeline + non-goals.
- v0 (2026-09-10): initial draft after reviewing reference project.
