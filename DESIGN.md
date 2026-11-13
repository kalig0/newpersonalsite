---
name: Daniel Yu — Engineering Journal
description: A paper-and-ink engineering portfolio with editorial type and readable system diagrams.
colors:
  paper: "#f8f6f0"
  ink: "#191c1b"
  muted: "#4d514c"
  accent: "#bf3d22"
  line: "#a8aaa2"
  workflow-green: "#263f36"
  research-blue: "#333e4b"
  about-paper: "#eae7df"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(64px, 6.7vw, 96px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(52px, 5.3vw, 76px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(44px, 4.5vw, 64px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Serif, serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.1
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.65
  detail:
    fontFamily: "Manrope, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
rounded:
  square: "0px"
  circle: "50%"
spacing:
  small: "12px"
  compact: "20px"
  regular: "24px"
  roomy: "32px"
  wide: "64px"
  section: "120px"
components:
  resume-link:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "14px 20px"
  resume-link-hover:
    backgroundColor: "{colors.accent}"
  text-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  engineering-disclosure:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "12px 0 24px"
  engineering-disclosure-open:
    textColor: "{colors.accent}"
  system-band:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    padding: "30px 0 22px"
  system-symbol:
    rounded: "{rounded.circle}"
    width: "72px"
    height: "72px"
---

# Design System: Daniel Yu — Engineering Journal

## Overview

**Creative North Star: "Engineering Journal"**

Engineering Journal treats engineering work as readable evidence. Warm paper, dark ink, editorial serif headings, and quiet sans-serif explanations give the portfolio the character of a considered technical publication. Broad colored system bands make relationships visible without competing with the supplied project facts.

The system is code-led: open layouts, fine rules, native disclosures, and inline SVG carry its identity. The existing portrait serves as a small personal signature; it does not establish an image-heavy visual language.

**Key Characteristics:**

- Oversized serif headings with precise sans-serif reading type.
- Flat paper surfaces, open rules, and broad project-colored system bands.
- Native disclosures, visible keyboard focus, and restrained motion.

## Colors

The palette combines warm paper and sober ink with a sharp vermilion accent and two dark project colors. The frontmatter holds the canonical values; source CSS is `src/index.css`.

### Primary

- **Journal Vermilion** (`accent`): first project system band, link hover, open disclosure labels, job-role emphasis, selection, and keyboard outlines.

### Secondary

- **Workflow Forest** (`workflow-green`): the AI workflow system band.
- **Research Slate** (`research-blue`): the ASSISTments research system band.

### Neutral

- **Warm Paper** (`paper`): page canvas, mobile navigation background, and reversed text on dark and colored surfaces.
- **Journal Ink** (`ink`): principal text, masthead rule, and filled résumé action.
- **Quiet Graphite** (`muted`): supporting explanations, metadata, and footer copy.
- **Pencil Rule** (`line`): disclosure, experience, skills, and footer dividers.
- **Inset Paper** (`about-paper`): full-width background for the about section.

**The Paper and Ink Rule.** Keep reading surfaces on paper with ink or muted text; use vermilion for emphasis and interaction, and project colors for the corresponding system bands.

## Typography

**Display Font:** Instrument Serif, with serif fallback.
**Body Font:** Manrope, with sans-serif fallback.

The serif has a large, literary presence; Manrope gives technical explanations and navigation a clear, even texture. Fonts load through Google Fonts in `index.html`; there is no separate monospaced or all-caps label face.

### Hierarchy

- **Display:** the personal masthead uses the display token. On mobile it is fixed at (64px).
- **Headline:** the lead project uses the headline token, with mobile size (52px). Section and later project headings use the section token, with mobile project size (44px).
- **Title:** employer names use the title token. System step titles use Manrope (24px, weight 500, line-height 1.25), reducing at intermediate widths and becoming (22px) on mobile.
- **Body:** ownership and challenge columns use the body token, with a maximum width (70ch), reducing to (16px) on mobile. Other body passages vary between (16–18px) according to context.
- **Detail:** case-study and experience lists use the detail token and a maximum reading width (75ch), reducing to (16px) on mobile.
- **Label:** navigation and disclosure summaries use the label token; metadata varies between (12–16px). Preserve natural casing.

## Layout

The centered container has maximum width (1440px). Its width is the viewport minus (112px) on wide screens, minus (64px) at widths up to (1150px), and minus (40px) at widths up to (767px). Body minimum width is (320px). Full-width system and about bands contain the same aligned inner container.

The desktop header is a horizontal identity/navigation row with minimum height (166px); tablet widths (768–1023px) use tighter header spacing. Mobile uses a minimum header height (136px), stacked identity text, and a menu disclosure. Major sections begin after (120px), reducing to (76px) on mobile. Adjacent case studies separate by (100px), reducing to (64px).

System paths use three equal columns, circular symbols, and fine horizontal connectors. At mobile widths the path becomes a single column with vertical connectors. Ownership/challenge columns use a (1:1.2) proportion; experience uses a (280px) metadata rail plus flexible content; about uses equal columns. These all stack at the mobile breakpoint. The contact row becomes vertical already at the intermediate breakpoint.

## Elevation & Depth

No box shadows are used. Flat background bands, typography, spacing, and thin rules express hierarchy. The mobile navigation overlays following content with the paper background and a dark bottom rule; it is not a floating card.

**The Open Journal Rule.** Separate content with space and fine rules rather than raised card shells.

## Shapes

The recurring geometry is square-edged text and bands, fine (1px) rules, and circular diagram symbols. The existing portrait is clipped to a circle (72px). System symbols are circles (72px) on wide screens and (54px) at intermediate and mobile widths, with inline SVG illustrations (36px). Arrows are thin inline SVG (18px); decorative linework inherits the text color. There is no rounded-card vocabulary.

## Components

### Navigation and résumé action

The masthead combines the large name, role, and horizontal anchor links. The résumé anchor is a square ink rectangle with paper text and a diagonal arrow; it turns vermilion on hover. Ordinary links turn vermilion. At mobile widths a native button reveals an absolutely positioned vertical menu; items have minimum height (44px). Choosing a navigation link, clicking outside, pressing Escape, or returning to desktop closes the menu; Escape returns focus to its button.

### Text links and project index

Inline contact/profile links pair natural-case text with thin arrows. The project index is an open two-column list with title and smaller muted technology line, stacking on mobile. The email link is larger and underlined by a fine rule. These remain anchors, rather than filled button variants.

### Engineering disclosure

Native `details` and `summary` reveal case-study content in place. A bottom rule defines the closed row. The label becomes vermilion on hover and while open; a CSS plus becomes a minus by rotating its vertical stroke. The transition is (250ms) with easing (`cubic-bezier(.16,1,.3,1)`). The revealed copy stays muted and constrained to the detail reading measure.

### System band

A flat project-colored band contains an introductory line, a three-stage ordered path, and a small caption. Each stage combines its circular SVG symbol and text. Voice, workflow, and research projects have distinct symbols and corresponding band colors. The small “System overview” label hides on mobile while the diagram remains readable.

### Experience rows

Open list rows use fine top rules, a date/location rail, serif employer title, vermilion role, and muted bullet copy. The final row also has a bottom rule. There is no independent card background or hover elevation.

### Shared interaction treatment

Interactive elements receive a visible vermilion outline (2px) with offset (5px). The skip link moves into view when focused. Anchor scrolling is smooth by default with scroll padding (24px). Reduced-motion preferences disable smooth scrolling, transitions, and animations. No input fields, chips, tooltips, or modal component families are implemented.

## Do's and Don'ts

### Do:

- **Do** pair Instrument Serif headings with Manrope reading and navigation text.
- **Do** use paper and ink as the default canvas, reserving colored bands for system explanations.
- **Do** preserve native disclosure semantics, keyboard focus, and reduced-motion support.
- **Do** keep diagrams as legible HTML and inline SVG that reflow vertically on mobile.

### Don't:

- **Don't** wrap open journal sections in rounded, elevated cards.
- **Don't** replace project-specific diagram symbols with unrelated decorative icons.
- **Don't** use project bands as a rainbow of arbitrary interface states.
- **Don't** add unsupported achievements or imagery that implies new factual evidence.
