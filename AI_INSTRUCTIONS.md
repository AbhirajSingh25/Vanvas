# VANVAS — Permanent Instructions for AI Coding Assistants

> **Operational Guidelines & Quality Directives for Any AI Working on VANVAS**

---

## 1. Golden Rules of Engagement

1. **Inspect Before Modifying:**  
   Always inspect the actual repository code, git status, and commit log before making changes or assumptions. Never assume a summary from an earlier conversation or outdated report reflects the present repository state.

2. **Read the Permanent Context First:**  
   At the beginning of every session, read the following core context files in this exact order:
   - `PROJECT_CONTEXT.md` (Primary architecture, routes, seed datasets, and verified feature matrix)
   - `CURRENT_STATE.md` (Active checkpoint, recent builds, test outcomes, and active issues)
   - `DECISIONS.md` (Architectural philosophies, design rules, and non-negotiables)
   - `NEXT_SESSION.md` (Actionable tasks, key files, and acceptance criteria)

3. **Verify Against Actual Code:**  
   Do not declare an issue fixed or an endpoint working until you have inspected the code, verified the file on disk, and executed the relevant test suite or typecheck.

4. **Preserve Existing Functionality:**  
   VANVAS is a mature dual-platform product with extensive live and curated features (Ask VANVAS, "I'M HERE", Dynamic Replanner, Nearby Radar, Travel Ledger, Group Circles, Spiti Expedition Planner). **Never delete, disable, or hollow out features to make an interface simpler or to pass a test quickly.**

5. **No Architectural Rewrites:**  
   The monorepo structure (FastAPI + Next.js App Router + Expo React Native + Shared Package) is fixed and production-tested. Do not propose or execute framework migrations, state management replacements, or directory reorganizations.

6. **Preserve Authentic Art Direction:**  
   All visual assets must follow the painterly gouache travel-journal style. Never substitute flat vectors, geometric mountain clipart, or generic stock photography. Never generate artwork with embedded AI text, labels, or watermarks.

7. **Zero Paid Quota Overages:**  
   If an external image generation or AI model returns `429 RESOURCE_EXHAUSTED` or quota limits, halt image generation immediately. Never purchase credits or enable paid overages without explicit user permission.

8. **Strict Dual-Platform Type Safety:**  
   Always verify type safety across both platforms:
   - Web: `cd frontend && npx tsc --noEmit`
   - Mobile: `cd mobile && npm run typecheck`
   - Health: `cd mobile && npx expo-doctor`
   - Shared: `cd packages/shared && npm run build`

9. **Never Claim Deployment Without Verification:**  
   Committing to `main` triggers automated CI pipelines on GitHub and automatic deployments to Vercel and Render. Do not state that a fix is live in production until you have verified the commit has been successfully pushed and confirmed healthy.

10. **Update Documentation After Major Changes:**  
    Whenever a significant implementation task is completed:
    - Update `CURRENT_STATE.md` with the new commit, test results, and active state.
    - Append the milestone entry to `DEVELOPMENT_LOG.md`.
    - Update `PROJECT_CONTEXT.md` if data schemas or feature states changed.
    - Update `NEXT_SESSION.md` with the next logical action items.
    - Record any architectural deviations or decisions in `DECISIONS.md`.

11. **Security & Secrets Invariant:**  
    Never write API keys, database passwords, JWT secrets, or production tokens into repository files or documentation. Reference environment variables strictly by NAME.
