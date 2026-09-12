# Continuous olive camera pipeline

The production chain is intentionally sequential. It never submits all shots from independent stills.

1. `npm run video:chain -- --plan` validates the five targets without uploading or spending credit.
2. `npm run video:chain` generates shot 01, extracts its actual final frame, and supplies that frame as shot 02's exact start image. The same handoff repeats through shot 05.
3. `npm run frames:build-chain` extracts every completed clip at 18 fps and encodes the result as 1280px WebP frames.
4. `npm run pipeline:continuous` performs generation and frame packaging in one command when the account has enough credit.

The shot prompts live in `seedance-video-v27-continuous.json`. Each transition hides the lens with soil, bark, or a leaf so the model can change space while preserving camera direction. All five prompts lock the olive identity, upper-left light, clockwise movement, lens character, and classical oil-painting treatment.

The website reads `site-public/olive-core-v27/sequence.json`. A segment with `count: 0` uses its still fallback. Once a generated clip is packaged, the frame builder writes the frame count and directory automatically; the player needs no MP4 seeking and no source-code edit.
