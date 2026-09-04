# L4 Rewrite Development Progress

## Definition

L4 means an algorithm-level rewrite. The original runtime captures, screenshots, and assets may remain as reference truth, but the runtime must no longer depend on the original bundle, extracted shader, or original framework implementation. Every input, mathematical step, timing window, and output must be explainable.

This project is currently hybrid: the React page structure, Road timeline, Canvas logic, and calibration panel were rebuilt, while the Hero fragment shader lives at `src/glsl/hero_main_fragment.glsl`. That is a port, not an L4 rewrite.

## Current Layers

| Module | Current state | L4 state | Notes |
| --- | --- | --- | --- |
| Hero video and opening mask | Port + React driver | Not started | Uses the extracted shader implementation |
| Hero transition modes | Port | Not started | Several modes remain in one fragment shader |
| Paper / Plan / Tree | Port + parameter reconstruction | Not started | CPU timing exists; algorithms are not independently verified |
| Fly / Transition sequences | React Canvas reconstruction | Partial | Drawing logic is independent; assets remain mirrored |
| Footer WebGL transition | Port + React driver | Not started | Still follows extracted transition shader semantics |
| Ink SVG filter | React/SVG reconstruction | Partial | Alpha chain is understood; standalone demo is missing |
| Application 3D form | React/CSS reconstruction | Partial | Interaction is independent; no standalone principle demo |
| Road timeline | Reconstruction | Partial | Constants are still spread across components |

## Remaining Work

### P0: Establish an auditable L4 baseline

- [ ] Preserve original screenshots, runtime shaders, uniform snapshots, and scroll positions as `SOURCE` truth.
- [ ] Create one start / hold / exit table and centralize it in scene configuration.
- [ ] Label code as `SOURCE`, `PORT`, or `REWRITE`.
- [ ] Add fixed viewport, fixed hero film, and fixed-time verification scripts.
- [ ] Record known differences instead of treating visual similarity as algorithmic equivalence.

### P1: Rewrite the Hero shader

- [ ] Split coordinate, cover, noise, mask, color, and compositing logic into independent functions.
- [ ] Give each `uMode` its own pass or standalone demo: breathe, slabs, halftone, noise warp, and diagonal burn.
- [ ] Replace packed vec4 parameters such as `uRay1` and `uEndF` with typed parameter objects.
- [ ] Document every parameter's unit, range, source, and timing window.
- [ ] Rebuild at least one core effect with native WebGL2 without importing the extracted fragment shader.
- [ ] Validate coordinates, noise, mask fronts, and color compositing with fixed seeds and boundary frames.

### P1: Rewrite Canvas and sequence playback

- [ ] Separate frame indexing, preloading, nearest-frame fallback, crossfade, and chroma-key masking.
- [ ] Document the `idle -> preload -> active -> fallback -> ready` state machine.
- [ ] Define one logical frame progress with separate desktop/mobile resource tier selection.
- [ ] Test first frame, final frame, missing frames, fast scroll, and delayed resources with offline fixtures.

### P2: Rewrite Footer, Ink, and Application

- [ ] Turn the Footer transition into a standalone WebGL demo with documented texture inputs and compositing.
- [ ] Turn the Ink filter into a standalone SVG/WebGL demo explaining noise, threshold, displacement, and alpha compositing.
- [ ] Split Application perspective, hover depth, orbit geometry, and submit state into learnable modules.
- [ ] Provide an original screenshot, rewritten result, and difference note for each module.

### P2: Make the code teachable

- [ ] Split the one-line `src/index.css` into tokens, layout, navigation, scene, application, and responsive files.
- [ ] Move repeated values such as `5350`, `3900`, and `4650` into one `scene-config.js`.
- [ ] Document each component's inputs, outputs, timeline interval, render layer, and asset dependencies.
- [ ] Add a uniform table, coordinate diagram, pseudocode, and function-level notes for each shader.
- [ ] Add unit tests, fixed screenshot tests, and asset-closure checks.

## L4 Acceptance Criteria

A module may be marked `L4 / REWRITE` only when all of these are true:

1. It does not load the original bundle or directly import an extracted shader at runtime.
2. Its algorithm, coordinate transforms, time progression, noise/mask/compositing steps are documented.
3. It has fixed-viewport comparisons for the first, middle, and boundary frames.
4. Delayed assets, missing frames, mobile, and reduced-motion states are verified.
5. Differences are stated honestly as algorithmic parity or behavioral similarity.
6. The rewritten demo runs independently of the Pear.No page.

## Recommended Structure

```text
recon/
  evidence/             # original screenshots, uniforms, shaders, network evidence
  docs/                 # component principles and provenance
ports/
  hero-breathe/         # standalone L4 rewrite demo
  hero-burn/
  footer-transition/
  ink-reveal/
src/
  reconstruction/       # page-level recreation code
  shaders/              # explained rewritten shaders
```

The recommended first milestone is one standalone `hero-breathe` or `hero-burn` L4 demo, then applying the same process to Canvas, Footer, and Application. Renaming and formatting the entire codebase without a verifiable algorithm rewrite should not be counted as L4.
