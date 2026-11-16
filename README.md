# Daniel Yu's portfolio

A responsive React + TypeScript portfolio focused on production AI engineering.

## Requirements and setup

Use Node 26 LTS and npm on supported macOS, Windows, or Linux systems. The
`.node-version` and `.nvmrc` files declare the runtime. Install and sign in to the
Codex CLI on each computer; credentials stay on that computer. Keep a local
career-ops checkout for its template, validators, and Playwright PDF renderer.

```sh
npm ci
npm run cv:setup -- --career-ops-root "/path/to/career-ops-daniel"
npm run cv:setup -- --verify
```

Setup checks the runtime, Codex login, Git access, and renderer dependencies. It
saves machine-specific paths in ignored `.cv-sync.local.json` and installs the
CV routing instructions in career-ops' protected custom-workflow configuration.
Existing custom instructions are preserved.

Setup also records the exact Node 26 executable in the ignored local
configuration. Once configured, the CV commands can relaunch with that verified
executable even if another Node version is the shell's default. This does not
change the global runtime. On a new computer, activate Node 26 for the initial
setup; if the recorded executable moves, repeat setup under Node 26.

The `--verify` step performs a real generation and validation using your Codex
login, then enables publication for this computer only after that smoke test
passes. A basic setup without verification can generate local output, but cannot
publish or start the publishing watcher.

For frontend development:

```sh
npm run dev
```

## Content and résumé

`assets/cv.md` is the editable master CV and is publicly tracked in this
repository. Add verified facts there. Website copy in `src/content/portfolio.json`
and the public PDF are derived outputs; avoid maintaining separate facts in them.
The deployed website is static and requires neither Codex nor career-ops at
runtime.

Generate and validate the website content and résumé locally:

```sh
npm run cv:sync
```

`npm run resume` is an alias for the same local workflow. Generation uses your
configured Codex model and existing login. Career-ops renders a general Software
Engineering / AI résumé in English on US Letter, with a strict two-page limit.
Job-specific resumes and the application tracker remain separate.

The workflow validates job titles, dates, source coverage, factual claims, ATS
structure, and PDF content. It stages output and checks the source hash before
promotion. Failed or stale runs preserve the last successful website data and
resume; one correction attempt is allowed. Logs and intermediate files live in
ignored `output/cv-sync/`.

Career-ops' root `cv.md` is a managed, gitignored snapshot, not another editable
source. Its custom instructions route edits back here and refresh the snapshot
before CV-dependent workflows. Unexpected snapshot edits stop synchronization
so they can be reconciled. Refresh only that snapshot without AI generation:

```sh
npm run cv:sync -- --snapshot-only
```

## Publishing and watching

After reviewing local output, publish through the existing push-to-deploy setup:

```sh
npm run cv:sync -- --publish
```

For automatic updates after local CV saves, keep this foreground command running:

```sh
npm run cv:watch
```

The watcher checks missed changes on startup, waits 10 seconds after saves, and
serializes updates. It generates, validates, commits, and pushes each current CV
version. Stop it with Ctrl-C. It runs only while this process is running and the
computer is awake; no OS-specific background service is installed.
After a generation or authentication failure, fix the reported issue and run
`npm run cv:sync -- --publish`, or restart the watcher. It does not repeatedly
spend Codex usage retrying an unchanged failing CV.

Publication requires `main` and no unrelated pending or unpushed work. Only the
CV and explicitly listed generated artifacts are committed. Conflicts and
rejected pushes stop the run; the tool does not force-push, pull, or rebase.
Success is recorded only after pushing. Pull published changes before running
the workflow on another computer.

The stable résumé URL is
[danielyu.app/static/resume.pdf](https://danielyu.app/static/resume.pdf). Add it
once to LinkedIn's Featured section with the title **Daniel Yu — Resume**. New
portfolio deployments update the linked PDF; an uploaded LinkedIn document is
a separate copy and does not update with this workflow.

## Validation and production build

```sh
npm run test:cv
npm run typecheck
npm run lint
npm run build
npm run preview
```

Cross-platform CI runs the mocked workflow tests and frontend checks under Node
26 on macOS, Windows, and Linux without AI credentials or deployment access.
Before enabling automatic publication on a new setup, run the real generation
pipeline and visually inspect both PDF pages and the website at desktop/mobile
sizes. The watcher requires that successful setup verification.

The build checks application TypeScript before generating `dist/`. Native anchor
navigation, keyboard-accessible disclosure panels, and reduced-motion support
require no animation libraries. The site has no contact backend.
