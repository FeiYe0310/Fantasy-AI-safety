# Continuous olive camera pipeline

The production chain is intentionally sequential. It never submits all shots from independent stills.

1. `npm run video:chain -- --plan` validates the five targets without uploading or spending credit.
2. `npm run video:chain` generates shot 01, extracts its actual final frame, and supplies that frame as shot 02's exact start image. The same handoff repeats through shot 05.
3. `npm run frames:build-chain` extracts every completed clip at 18 fps, encodes the result as 1280px WebP frames, then builds the final retimed timeline.
4. `npm run pipeline:continuous` performs generation and frame packaging in one command when the account has enough credit.

The shot prompts live in `seedance-video-v27-continuous.json`. Each transition hides the lens with soil, bark, or a leaf so the model can change space while preserving camera direction. All five prompts lock the olive identity, upper-left light, clockwise movement, lens character, and classical oil-painting treatment.

The final packaging pass is free and deterministic: `npm run frames:retime` trims only the stalled tail/head frames at the four joins, creates one or two short channel-linear bridge frames where needed, and writes a flat global frame list. It never calls a generation API. Run `npm run frames:analyze` to inspect source-boundary motion and retiming choices; add `-- --sheets /tmp/olive-boundary-sheets` for visual contact sheets.

The website reads the flat `frames` timeline in `site-public/olive-core-v27/sequence.json`. The scroll engine maps one smoothed global progress value directly to one global frame index; segment lookup and MP4 seeking are absent from the playback path. The decoded-frame cache preloads in the travel direction and holds the last cinematic frame when an exact frame is not ready, so the initial static fallback is never reintroduced after playback begins.
