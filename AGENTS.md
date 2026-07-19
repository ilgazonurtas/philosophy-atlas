# Philosophy Atlas Development Rules

## General

- Use TypeScript in strict mode.
- Do not use `any`.
- Keep components small and reusable.
- Run lint, typecheck and build after meaningful changes.
- Never invent historical facts.
- Every imported historical claim must retain its source.
- Do not directly publish AI-generated summaries.

## Data

- BCE years are represented as negative integers.
- Unknown values must be null, never guessed.
- Coordinates must include their source.
- Keep factual data separate from localized editorial content.
- Every image must retain creator, license and source information.

## UI

- Desktop philosopher details appear in a right-side panel.
- Mobile philosopher details appear in a bottom sheet.
- All interactive elements must support keyboard navigation.
- Turkish and English strings must not be hardcoded in components.

## Workflow

- Before large changes, explain the proposed approach.
- Do not rewrite unrelated files.
- After changes, summarize modified files and remaining limitations.