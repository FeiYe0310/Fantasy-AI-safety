<div align="center">

# Fantasy AI Safety

**Abundant verification tokens for powerful AI.**

[Live site](https://fantasy-ai-safety.feiye0310.chatgpt.site/) · [Research questions](https://github.com/FeiYe0310/Fantasy-AI-safety/issues?q=is%3Aissue+label%3Aresearch) · [Join us](https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml)

</div>

## Mission

Powerful AI systems receive abundant compute to generate an answer, but far less budget to challenge, verify, and repair it.

Fantasy AI Safety works toward systems where every consequential action can carry enough independent checks, counterarguments, causal evidence, and recovery steps before it reaches the world. We use **verification tokens** as a research framing for the compute and evidence budget devoted to critique, monitoring, interpretation, and correction—not as a claim about a specific API token type.

## The guardian

The site tells this thesis through Nüwa, the Chinese creator and mender of the broken sky. She represents locating failure, repairing structure, and preserving the ability to recover when no boundary can anticipate everything.

The olive carries the argument through every chapter: one fruit becomes a pit, a verified root system, a monitored tree, five coloured leaves that mend the sky, and finally a branch carried by a white dove.

The story carries the project's central claim:

> Creation without verification becomes dangerous.
>
> A repair is trustworthy only when evidence can grow through it.

## Research directions

### Scalable verification

Verifier models, process supervision, multi-model critique, debate, and evidence-carrying outputs.

### Agent monitoring and control

Runtime monitors, tool permissions, audit trails, tripwires, safe interruption, and staged authorization.

### Mechanistic auditing and repair

Mechanistic interpretability, causal localization, anomalous representations, goal-drift signals, and evidence-grounded interventions.

## Experience

The homepage is a continuous scroll-driven story built around one living object: an olive.

1. The final olive remains beneath a sky fractured by unchecked action.
2. Nüwa catches its pit and pauses before repairing the visible wound.
3. Five independent colours test the pit, then become verification roots beneath the soil.
4. The olive grows only as fast as its evidence and safeguards can grow with it.
5. Five olive leaves enter the fractures and mend the sky.
6. A mature olive tree offers a branch to a white dove, carrying accountable power toward peace.

Fourteen 1672×941 oil-painting keyframes and nine 1280×720 H.264 motion bridges share one scroll-controlled timeline. The still paintings remain visible at every seam while the videos provide real camera movement and organic growth between them. The experience also includes a readable `prefers-reduced-motion` version and responsive layouts for desktop and mobile.

## Video pipeline

The original reproducible English prompt pack is in [`prompts/seedance-video-v1.json`](prompts/seedance-video-v1.json). The object-orbit continuation is recorded in [`prompts/seedance-video-v2-orbit.json`](prompts/seedance-video-v2-orbit.json), including the tree-growth arc, leaf-plucking orbit, and sky-mending follow shot.

The local generation utility is [`scripts/seedance-generate.mjs`](scripts/seedance-generate.mjs). It uploads and caches reference images, creates one task per selected shot, polls without duplicating requests, downloads successful videos, and enforces a 50 CNY estimated-cost ceiling. Copy `.env.example` to the ignored `.env.local`, add a restricted API token, and run `pnpm video:generate -- --shot=01-olive-breath` (or `--all`). Credentials are never shipped to the browser.

## Development

Requirements: Node.js 20+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
pnpm preview
```

The Vite build uses a relative base path so the same `dist` works on the public Sites deployment and GitHub Pages. Generated videos are fast-start MP4 files under `site-public/olive-oil-story-v1/video/`.

## Contributing

You can contribute through three paths:

- **Research** — propose open questions, reproduce experiments, and publish notes.
- **Build** — implement verifiers, evaluations, monitors, and interpretability tools.
- **Challenge** — find failure modes, design red-team tasks, and audit assumptions.

[Introduce yourself with the public Join Us form](https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml).

## Status

The project is in formation. Research claims, experiments, and results will be linked from the repository as they become independently inspectable. The site intentionally does not present placeholder publications or fabricated metrics.
