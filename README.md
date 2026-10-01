# Daniel Yu's portfolio

A responsive React + TypeScript portfolio focused on production AI engineering.

## Local development

```sh
npm install
npm run dev
```

## Content and résumé

Edit `src/content/portfolio.json` to update profile copy, case studies, experience,
education, and technical skills. Website and résumé use this same content; the
external source CV is not needed at runtime or build time.

After changing résumé content, regenerate the two-page PDF:

```sh
python3 -m pip install reportlab pypdf
npm run resume
```

In Codex, use the bundled Python runtime with these packages already installed.
The generator validates the page count and selectable text, and writes
`output/pdf/daniel-yu-resume.pdf` plus `public/static/resume.pdf`. Render and inspect
both pages after edits. Vite serves the web asset at `/static/resume.pdf` in local
and production builds.

## Validation and production build

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The build checks application TypeScript before generating `dist/`. Native anchor
navigation, keyboard-accessible disclosure panels, and reduced-motion support
require no animation libraries. The site is static and has no contact backend.
