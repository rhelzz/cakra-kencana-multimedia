# Cakra Kencana Multimedia — agent guide

Read [`CLAUDE.md`](CLAUDE.md) before changing this project. It is the authoritative technical map: architecture, content model, API quirks, non-negotiable decisions, local commands, and known gaps. Do not duplicate or contradict it here.

## Project map

- `backend/` — Joomla 5.4.7 CMS and the `nextrevalidate` plugin. Do not edit Joomla core.
- `frontend/` — Next.js 16.3 application. Read `frontend/AGENTS.md` and `frontend/CLAUDE.md` before frontend work.
- `frontend/src/lib/joomla.ts` — the only API boundary for Joomla content.
- `content-drafts/` — translation staging only; Joomla is the source of truth after import.
- `docs/` — human-facing Indonesian documentation. Use [`docs/README.md`](docs/README.md) as its index; open the document that matches the task.

## Non-negotiables

- Visible editorial copy and images belong in Joomla, not hardcoded frontend components. UI chrome labels are the intentional exception.
- Keep the Joomla API token server-only. Client components receive plain props only.
- Preserve locale URLs and alias-based translation behavior; never use article IDs for service-detail URLs.
- Before a frontend change, read the relevant local Next.js guide as required by `frontend/AGENTS.md`.
- For frontend checks, run `npx tsc --noEmit` and `npm run lint` from `frontend/` when the change warrants it.

## Documentation routing

- Architecture/setup/content/API/frontend: `docs/01-arsitektur.md` through `docs/07-frontend.md`.
- Operations, CMS audit, service restructuring, deployment: `docs/08-operasional.md` through `docs/11-deploy.md`.

If documentation conflicts, follow the most specific instruction; for code behavior, inspect the current implementation before changing it.
