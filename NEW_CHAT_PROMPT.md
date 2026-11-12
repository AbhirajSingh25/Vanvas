# VANVAS — New Chat Session Starter Prompt

> **Ready-to-Copy Prompt for Starting a New AI Coding Session**  
> *Copy and paste the block below into any new ChatGPT or AI assistant conversation to resume VANVAS development immediately without losing project context.*

---

```markdown
You are working on VANVAS, an ongoing, production-grade dual-platform travel product by The Sorted Club (Web Next.js PWA + React Native Mobile + FastAPI Backend).

CRITICAL SESSION INSTRUCTIONS:
1. DO NOT assume this is a new project. A permanent, verified context system is established in the repository.
2. Before modifying anything, read the following five permanent context documents in the root directory:
   - `PROJECT_CONTEXT.md` (Primary architecture, routes, seed datasets, and verified feature matrix)
   - `CURRENT_STATE.md` (Active checkpoint, recent builds, test outcomes, and active issues)
   - `DECISIONS.md` (Architectural philosophies, design rules, and non-negotiables)
   - `NEXT_SESSION.md` (Actionable tasks, key files, and acceptance criteria)
   - `AI_INSTRUCTIONS.md` (Permanent behavioral guidelines and safety rules)
3. Inspect the actual repository state using Git and file inspection tools before making any assumptions or claims:
   - Check `git status`, `git branch --show-current`, `git log -5 --oneline`, `git remote -v`.
   - Distinguish Vercel Preview deployments from Production (`vanvasai.vercel.app` maps to base `main` until a PR is merged; feature branch builds deploy to unique preview URLs).
   - Understand the transformed-ancestor loading regression: route templates (`template.tsx`) must never apply `translateY` transforms, and `<ProtectedRoute>` uses React portal escalation directly to `document.body` at `zIndex: 2147483000` to prevent fixed overlays from being trapped inside transformed layout containers.
4. Resume development directly from the latest verified checkpoint documented in `CURRENT_STATE.md`.
5. Preserve all existing product and architecture decisions:
   - Vanvas is an authentic Indian travel companion and Himalayan operating layer, not a generic SaaS dashboard.
   - All visual assets must use authentic painterly gouache travel illustrations (zero flat vectors, zero stock photos, zero AI-embedded typography).
   - Discovery carousels must remain strictly horizontal single-row touch collections across all viewports.
   - Spiti motorcycle expedition logic, gateway pickup hubs, and Kaza rental restriction warnings must be preserved.
   - Core experience suite (Ask VANVAS copilot, "I'M HERE" arrival mode, Dynamic Replanner, Nearby Radar, TripMap, Travel Ledger, Group Circles) must remain functional.
   - Web (`frontend/`) and Native Mobile (`mobile/`) are co-equal first-class platforms.
6. Check `NEXT_SESSION.md` and execute the next specified task immediately.
7. Do not ask me to repeat information that is already documented in the repository context files.
```
