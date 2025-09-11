# Design Guide

This folder supports designers and contains Figma exports, templates, and helper CSS. It is not shipped to production and is not loaded by the widget.

## Contents

- `style-guide.md` — Core design specs (colors, typography, spacing)
- `initial-search-clean.css` — Organized styles for the initial search view
- `chat-history-clean.css` — Sidebar styles for chat history
- `chat-header-css.css`, `matchi-chat-bubble-css.css`, `user-chat-bubble-css.css` — Focused CSS snippets matching design modules
- `*.png` — Screen templates used to align implementation with Figma
- `assets/` — Supporting assets used by the design team

## How It’s Used

- Serves as the source of truth for the design system used in `dist/chat-widget.css`
- Provides reference CSS to keep design and implementation aligned
- Not imported by the runtime; changes must be reflected in `dist/` when ready for production

## Updating From Figma

- Export CSS for updated components into new or existing files here
- Update `style-guide.md` with any token or component changes
- Port relevant changes into `dist/chat-widget.css` for production

## Notes

- Keep files small and modular to make mapping to production CSS straightforward
- Prefer CSS variables and consistent naming that match production (`--primary-green`, etc.)
- Do not add build steps or dependencies here — this folder is reference-only

