# Contributing to TrendXee

Start with the [README](README.md), then the [development guide](docs/development.md)
and [data model](docs/data-model.md). TrendZee, the local processing pipeline, is a
separate repository. Keep runtime changes in the service that owns them.

## Find the right code

- Frontend routes: `trendzy-front/src/routes/`. TanStack generates `routeTree.gen.ts`;
  edit route files and let the build regenerate the tree.
- Reusable UI: `src/components/`; home sections: `src/components/home/`.
- API calls, normalization and filtering: `src/lib/`.
- Animation helpers and reduced-motion behavior: `src/motion/`.
- Public API: `trendzy-api/.../controller`, `service`, `repository` and `model`.
- Accounts and sign-in: `trendzy-business/.../auth`, `user` and `config`.
- Tests live beside each service in `tests/` or `src/test/java/`.

## Make a change

Use a focused branch. Check existing working-tree changes before editing and keep
unrelated work intact. Avoid broad renames or formatting-only changes mixed with a
bug fix. Comments should explain a surprising constraint or why a step is needed,
using short plain sentences. Do not narrate every line or leave temporary debug code.

Keep the website usable at mobile widths and with reduced motion. A pairing change
must preserve whole-outfit membership, audience, stock, identity and layering checks.
An unknown audience defaults to Unisex; a model's appearance is not sizing evidence.

## Before a pull request

Run the commands in the README or `scripts/verify.ps1`. Include the behavior changed,
the checks run and a screenshot for visible UI changes. Document API and data-contract
changes. New tests should cover meaningful behavior, not copy the implementation.

Do not commit `.env`, PEM keys, database dumps, browser sessions, local review
artifacts, dependency folders or build outputs. Keep `.env.example` limited to
local defaults and empty placeholders. Production credentials belong in deployment
secrets. Do not push to `main` unless deployment is intended.
