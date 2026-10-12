# Agentic Consensus · project website

![Agentic Consensus: Build with agents. Keep the project understood.](assets/agentic-consensus-og.png)

A research website for **Agentic Consensus**, a shared, versioned project state for human and AI coding collaboration, and **Consensus Control**, its local review workspace.

[**Visit the website**](https://tianfuwang.tech/agentic-consensus-site/) · [Read the paper](https://arxiv.org/abs/2604.17883) · [Run the implementation](https://github.com/GeminiLight/agentic-consensus)

## The project, in three places

| Repository | Purpose |
| --- | --- |
| [agentic-consensus](https://github.com/GeminiLight/agentic-consensus) | Runnable software, local setup, implementation, and tests |
| agentic-consensus-paper | Private manuscript source and research working files; the public PDF is linked above |
| [agentic-consensus-site](https://github.com/GeminiLight/agentic-consensus-site) | This website, interactive explanation, and public-facing resources |

## What visitors can explore

- A four-step capability-migration walkthrough: intent, changed code, evidence, and an authorized decision.
- The versioned relationship between intent, commitments, artifacts, and evidence.
- Real workspace captures, with separate views for meaning, changes, and decisions.
- The arXiv preprint, current research agenda, local setup, and a copyable citation.

The walkthrough is illustrative. The website reflects current research and implementation; the linked arXiv preprint is an earlier version, with an update forthcoming. Human-study results are intentionally omitted. The site does not imply conference acceptance or claim a measured comparative improvement.

## Preview locally

```bash
python3 -m http.server 8924 --bind 127.0.0.1
```

Open `http://127.0.0.1:8924`. The site is plain HTML, CSS, and JavaScript. Fonts and assets are served locally; there is no build step, tracking, or third-party script.

## Verify

```bash
SITE_URL=https://tianfuwang.tech/agentic-consensus-site python3 scripts/verify-site-seo.py
python3 scripts/verify-content.py
node --check script.js
# With agent-browser installed and the preview server running:
node scripts/verify-browser.cjs http://127.0.0.1:8924
```

The browser check covers responsive widths, the two tab groups, keyboard selection, mobile navigation, clipboard feedback and its failure path, local images, and page errors. See [the design and verification notes](docs/showcase.md) for content provenance and release details.

## Deployment

GitHub Pages serves the root of `gh-pages`. Changes are developed on a separate branch and verified before publication. Paper actions link to arXiv:2604.17883 and the alphaXiv reader. The legacy PDF asset mirrors the public arXiv version, not a private draft.

Fonts are bundled under the SIL Open Font License; see [the font notices](assets/fonts/). Existing research figures remain available at their previous asset URLs.
