# AI Chat Widget - Development Guide

## Architecture Overview

This is a **CDN-delivered chat widget** that injects a full-screen overlay into Webflow sites. The architecture separates concerns across directories:

- `dist/` — Production files served via jsDelivr CDN (`@v0.1.3` versioning)
- `dev/` — Local testing environment with Python server
- `webflow/` — Integration snippets for Webflow footer
- `design-guide/` — Figma exports and design reference (not shipped)

## Critical Workflows

### Development & Testing

```bash
cd dev && python3 server.py  # Serves from repo root, opens browser
```

The dev server serves both `/dev` and `/dist` so you can test local builds. The dev environment loads with cache-busting (`?v=${Date.now()}`) to avoid CDN caching during development.

### CDN Release Process

1. Make changes in `dist/chat-widget.js` and `dist/chat-widget.css`
2. Test locally via `dev/server.py`
3. Tag release: `git tag v0.1.4 && git push --tags`
4. Update Webflow snippet version: `@v0.1.3` → `@v0.1.4`
5. jsDelivr automatically serves new version

### Webflow Integration

The widget integrates via a **self-contained IIFE** in `webflow/webflow-footer-custom-code.html`. It creates a floating button, loads the widget on-demand, and handles state via DOM events (`ai-chat:open`, `ai-chat:close`).

## Key Conventions

### Design System Implementation

- CSS variables defined in `:root` of `dist/chat-widget.css`:
  ```css
  --primary-green: #375947;
  --font-primary: "Rajdhani", sans-serif; /* Headings */
  --font-secondary: "Mulish", sans-serif; /* Body text */
  ```
- Components use `design-guide/` as source of truth, then port to `dist/`
- Exact pixel specifications from Figma: sidebar 247px, search input 76px height

### State Management

Vanilla JS with localStorage persistence:

```javascript
// Chat data structure
localStorage["ai-chat.chats"] = [
  {
    id,
    conversation_id,
    messages,
    title,
    createdAt,
  },
];
localStorage["ai-chat.activeChat"] = "chat-id";
```

### UI Views

1. **Initial Search** — Default view with sidebar + centered search container
2. **Chat View** — Header + message history + input (transitions from search)
3. **Full-screen overlay** — `position: fixed` covering entire viewport

## Essential Files

- `dist/chat-widget.js` — Complete widget logic (688 lines), exposes `window.AIChatWidget`
- `dist/chat-widget.css` — Production styles with design system variables (704 lines)
- `dev/index.html` — Integration testing environment with local asset loading
- `webflow/webflow-footer-custom-code.html` — Current production integration code

## Integration Points

### Widget API

```javascript
window.AIChatWidget.mountChat({
  endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi",
  apiKey: "optional-override", // Falls back to built-in key
});
```

### External Dependencies

- **jsDelivr CDN** — Asset delivery (`cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@{version}`)
- **Google Fonts** — Rajdhani/Mulish via CSS `@import`
- **Robethood API** — Backend chat endpoint with embedded API key

## Code Patterns

### Responsive Design

Mobile-first approach with specific breakpoints:

```css
@media (max-width: 1200px) {
  /* Hide sidebar */
}
@media (max-width: 768px) {
  /* Mobile adjustments */
}
```

### DOM Injection Strategy

Widget creates isolated DOM tree under `#ai-chat-root` with high z-index (2147483646). Uses `!important` declarations to prevent host page interference.

### Event-Driven Communication

```javascript
// Widget lifecycle
window.dispatchEvent(new CustomEvent("ai-chat:open"));
window.dispatchEvent(new CustomEvent("ai-chat:close"));
```

## Testing Strategy

Run `dev/server.py` and verify:

- [ ] Button appears in bottom-left
- [ ] Initial search screen matches `design-guide/initial-search-screen-template.png`
- [ ] FAQ buttons populate search field
- [ ] Chat transition preserves message history
- [ ] ESC key closes overlay
- [ ] Mobile responsive layout

For production testing, temporarily update version in `dev/index.html` to test CDN builds.

## Common Pitfalls

- **Version mismatches** — Ensure `webflow/` and `dev/` reference same `@v0.1.x`
- **Cache issues** — jsDelivr may cache for 24h; use `?v=timestamp` for immediate testing
- **CSS isolation** — Host page styles can leak; use specific selectors and `!important`
- **Mobile testing** — Test actual devices, not just browser devtools
- **API rate limits** — Backend endpoint includes rate limiting; handle gracefully
