<div align="center">

# Fantasy AI Safety

**Abundant verification tokens for powerful AI.**

[Live site](https://feiye0310.github.io/Fantasy-AI-safety/) · [Research questions](https://github.com/FeiYe0310/Fantasy-AI-safety/issues?q=is%3Aissue+label%3Aresearch) · [Join us](https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml)

</div>

## Mission

Powerful AI systems receive abundant compute to generate an answer, but far less budget to challenge, verify, and repair it.

Fantasy AI Safety works toward systems where every consequential action can carry enough independent checks, counterarguments, causal evidence, and recovery steps before it reaches the world. We use **verification tokens** as a research framing for the compute and evidence budget devoted to critique, monitoring, interpretation, and correction—not as a claim about a specific API token type.

## The guardians

The site tells this thesis through two mythic figures:

- **Soteria · The Boundary** — the Greek personification of safety and deliverance. She represents prevention, constraint, and verification before harm.
- **Nüwa · The Repair** — the Chinese creator and mender of the broken sky. She represents locating failure, repairing structure, and recovering when no boundary can anticipate everything.

Their fusion carries the project's central claim:

> Constraint without repair becomes brittle.
>
> Creation without verification becomes dangerous.
>
> Safety needs both.

## Research directions

### Scalable verification

Verifier models, process supervision, multi-model critique, debate, and evidence-carrying outputs.

### Agent monitoring and control

Runtime monitors, tool permissions, audit trails, tripwires, safe interruption, and staged authorization.

### Mechanistic auditing and repair

Mechanistic interpretability, causal localization, anomalous representations, goal-drift signals, and evidence-grounded interventions.

## Experience

The homepage is a scroll-driven cinematic narrative built with React and Canvas:

1. Soteria and Nüwa enter as separate visual systems—golden order and jade repair.
2. Their fingertips approach and complete a verification circuit.
3. A fused guardian reveals the shared method.
4. The story resolves into mission, research directions, and public contribution paths.

The experience includes a readable `prefers-reduced-motion` version and responsive layouts for desktop and mobile.

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

The Vite base path is configured for GitHub Pages at `/Fantasy-AI-safety/`. Pushes to `main` deploy through `.github/workflows/deploy.yml`.

Deployment status is tracked in the repository's GitHub Actions tab.

## Contributing

You can contribute through three paths:

- **Research** — propose open questions, reproduce experiments, and publish notes.
- **Build** — implement verifiers, evaluations, monitors, and interpretability tools.
- **Challenge** — find failure modes, design red-team tasks, and audit assumptions.

[Introduce yourself with the public Join Us form](https://github.com/FeiYe0310/Fantasy-AI-safety/issues/new?template=join-us.yml).

## Status

The project is in formation. Research claims, experiments, and results will be linked from the repository as they become independently inspectable. The site intentionally does not present placeholder publications or fabricated metrics.
