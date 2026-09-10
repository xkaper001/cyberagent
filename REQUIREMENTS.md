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
- `backend/graph/nodes.py`: ✅ all real now — research/vulnerability (NVD, Phase 2),
  critic (LLM)/risk (CVSS)/report (from findings) (Phase 3). No `8.4`/`96%`/`INITIAL_REPORTS`.
- `backend/agents/scanning.py`: fallback `http/https/spring-actuator/ssh`, ports=2. → Phase 1
- `backend/rag/retriever.py`: `INITIAL_KNOWLEDGE` — now only the static browse catalog; pipeline RAG is real (Phase 2 done).
- `backend/services/mock_data.py`: source of all canned findings/reports/knowledge.

### Phase 0 — Foundation / merge  ✅ DONE
- [x] Adopt base as **new repo** → `~/Developer/cyberagents-v2` (friend's git history kept, remote detached)
- [x] Copy old project's `.env` LLM values in (`llm.kimchi.dev`, `deepseek-v4-flash-0731`), `DEMO_MODE=false`
- [x] Endpoint verified with a real completion (curl → `ok`)
- [x] Remove silent simulation fallback → `factory.py` now raises `RuntimeError` if no real key
- [x] `docker compose up` brings backend+db+redis+qdrant live (fixed Dockerfile COPY bug, added psycopg2, DEMO_MODE=false)
- **Demo**: ✅ stack boots, `/api/health` LIVE, `/api/chat` real DNS + auth-gate, LLM endpoint verified.

### Phase 1 — Real scanning (1 day)  ✅ DONE
- [x] Scanning agent: deleted hardcoded `http/https/spring-actuator/ssh` + `ports_count=2`
- [x] Use real nmap JSON from sandbox; empty result = empty, not fake (only `state==open` ports)
- [x] Recon agent: was faking `Apache/2.4.49` banner + a fake TLS line + discarding real IPs → now emits real resolved IPs + real Server header, honest when absent
- [x] Evidence entries carry raw tool output; full tool job pushed to `state["tool_results"]` for Phase 2
- [x] Bonus: killed worker `entrypoint.py` FileNotFoundError mock (fake Apache 2.4.49 → fed downstream fake CVE); now returns `TOOL_NOT_INSTALLED`
- **Demo**: proven via real nmap-XML fixtures (2 hosts → different ports/services, closed excluded, empty→empty). Live external scan deferred — needs an authorized in-scope target; `backend/tests/test_scanning_real.py` is the leave-behind check.

### Phase 2 — Real vulnerability mapping (1–2 days)  ✅ DONE
- [x] Service version → CVE lookup via **NVD 2.0** (`backend/services/cve_lookup.py`), CPE-first (`virtualMatchString` from nmap CPEs) with keyword fallback; `lru_cache`d
- [x] Vuln agent (`vulnerability_node`) emits real `FindingSchema` from discovered services: real CVE IDs, CVSS→severity, CWE, NVD references, nmap banner as evidence; deduped + idempotent
- [x] `research_node` now builds real NVD `KnowledgeItem`s per discovered service (dropped `rag_engine`/`INITIAL_KNOWLEDGE` from the pipeline path)
- [~] `rag_engine` (retriever.py) still serves the static knowledge **browse catalog** (`/api/resources` + `rag_search` tool) — not in the graph flow; left as a reference catalog, not a pipeline mock. Full Qdrant corpus deferred (Review 2 scope).
- **Demo**: Apache 2.4.49 → CVE-2021-41773 (9.8) + 4 more; OpenSSH 8.2p1 → CVE-2020-14145 — all live from NVD, closed ports excluded. `backend/tests/test_phase2.py` is the network-free leave-behind.

### Phase 3 — Real critic + risk + report (1–2 days)  ✅ DONE
- [x] Critic: **real LLM call** (first in pipeline) scores per-finding confidence + verdict from evidence vs. version-only match; deterministic evidence-completeness fallback if LLM down. No fixed `96%`.
- [x] Risk: composite from real CVSS (`max(cvss)` + small count bonus, capped 10), rejected findings excluded, empty→0.0. No fixed `8.4`.
- [x] Report: real `ReportSchema` from findings — severity counts, attack surface from open ports, exec summary + roadmap from actual data. Dropped `INITIAL_REPORTS[0]`.
- [x] `final_response`: templated from real risk/counts/top-CVEs. No hardcoded CVE-2021-41773.
- [x] Added `cvssScore` to `FindingSchema` so risk uses real numbers.
- **Demo**: verified — target A (Apache 9.8) → 9.8/Critical, target B (low) → 2.1/Low; live LLM critic returned 85% w/ reasoning. `backend/tests/test_phase3.py` (LLM-free) + live smoke.

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
