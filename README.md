# AI Chat Widget

A lightweight, CDN-delivered chat widget used on a Webflow site. This repo contains:

- Production distribution files (served via CDN)
- Local development environment to test the widget end-to-end
- Webflow footer custom-code snippets used for live integration
- Design assets, CSS exports, and templates for designers

See `IMPLEMENTATION_SUMMARY.md` for a deeper walkthrough of the UI and behavior implemented in `dist/chat-widget.js` and `dist/chat-widget.css`.

## Repository Structure

- `dist/` — Production bundle distributed via CDN (JavaScript, CSS, assets)
- `dev/` — Local dev environment and simple server for testing
- `webflow/` — Footer custom-code snippets used in the Webflow site
- `design-guide/` — Figma CSS exports, design templates, and assets for designers
- `IMPLEMENTATION_SUMMARY.md` — Notes on implementation details and UI mapping

## Quick Start (Development)

- Python: `cd dev && python3 server.py` (opens `/dev/index.html`)
- Node: `cd dev && npx http-server . -p 8000 -o`
- VS Code: Right‑click `dev/index.html` → Open with Live Server

The dev server serves from the repo root so `/dist` assets are available at `/dist/*`. See `dev/README.md` for details and testing checklist.

## Production Usage (CDN)

1) Include the widget on your site (Webflow or any static site):

```html
<script>
(function () {
  var JS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.7/dist/chat-widget.js";
  var CSS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.7/dist/chat-widget.css";
  function ready(fn){/in/.test(document.readyState)?setTimeout(function(){ready(fn)},9):fn()}
  function load(src, onload){var s=document.createElement("script"); s.src=src; s.async=true; s.onload=onload; document.head.appendChild(s)}
  ready(function(){
    var btn=document.createElement("button");
    btn.id="ai-chat-launcher"; btn.type="button"; btn.setAttribute("aria-label","Open support chat");
    btn.style.cssText="position:fixed;left:20px;bottom:20px;z-index:2147483647;padding:14px 18px;border-radius:50px;border:0;cursor:pointer;background:#4a5d23;color:white;font-weight:600;box-shadow:0 4px 16px rgba(74,93,35,0.3);";
    btn.innerHTML = "💬 Support Chat"; document.body.appendChild(btn);
    btn.addEventListener("click", function(){
      btn.style.display = 'none';
      if (!window.AIChatWidget) {
        load(JS, function(){
          window.AIChatWidget.loadCSS(CSS);
          window.AIChatWidget.mountChat({ endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi" });
        });
      } else {
        window.AIChatWidget.mountChat({ endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi" });
      }
    });
    window.addEventListener('ai-chat:close', function(){ btn.style.display = '' });
  });
})();
</script>
```

2) For Webflow, paste this into Project Settings → Custom Code → Footer (or in a specific page’s Footer). See `webflow/README.md`.

## Widget API (Runtime)

The script exposes a global `window.AIChatWidget`:

- `loadCSS(href)` — Injects the CSS once using a stable id
- `mountChat(options)` — Mounts the full‑screen chat UI
  - `options.endpointUrl` (alias `backendUrl`): backend POST endpoint
  - `options.apiKey`: optional override; otherwise uses built‑in key or `localStorage("ai-chat.apiKey")`

Events are emitted on `window`:

- `ai-chat:open` — When the chat opens
- `ai-chat:close` — When the chat is closed

### Assistant Link Rendering

Assistant replies can include `knowledge_links` (array of objects). The widget:

- sends the currently selected `language` (`"de"` or `"en"`) with each request so the backend can localize link metadata.
- shows each returned link as a button; the button text prefers `display_name`/`name`/`label` from the payload, falling back to the URL if none is provided.
- treats `https://www.robethood.net/kontakt` as a special case, rendering the label as `Kontaktiere Uns` (DE) or `Contact Us` (EN).
- keeps the link icon on the left of every button and opens each link in a new tab.
- collapses duplicate URLs (case-insensitive, including query/fragment) so users never see repeated entries.

## Persistence

The widget stores chat state in `localStorage`:

- `ai-chat.chats` — Array of chats, each with `id`, `conversation_id`, `messages`, `title`, `createdAt`
- `ai-chat.activeChat` — Active chat id

This enables simple history and multi‑chat management directly in the client.

## Styling

The CSS (`dist/chat-widget.css`) includes a design‑system layer and uses CSS variables for quick theming:

- `--primary-green`, `--background-white`, `--light-background`
- `--text-primary`, `--text-secondary`, `--text-chat-history`
- `--border-light`, `--shadow-main`
- `--font-primary`, `--font-secondary`

For layout and component details, see `IMPLEMENTATION_SUMMARY.md`.

## Releasing & CDN Versioning

- Tag a release in GitHub using semver (e.g., `v0.1.7`).
- jsDelivr will serve `@tag` versions from the repo, e.g.:
  - `https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.7/dist/chat-widget.js`
  - `https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.7/dist/chat-widget.css`
- Update your Webflow footer code to pin to the desired version.

## Security Notes

- The distribution build includes a frontend API key to reach the chat backend. Treat it as public and protect on the server side (rate limiting, domain allow‑list, token rotation). If needed, pass `apiKey` at runtime via `mountChat({ apiKey: "..." })` or proxy requests through your server.
- No PII is intentionally stored; message history persists locally in the browser until cleared.

## Folder READMEs

- `dev/README.md` — Local testing and sharing
- `webflow/README.md` — How to add this to Webflow
- `dist/README.md` — Distribution artifacts, API surface, and customization
- `design-guide/README.md` — Design assets and usage guidance for designers
