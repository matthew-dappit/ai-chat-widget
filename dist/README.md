# Distribution (`dist/`)

Production assets served by the CDN. These files are referenced by Webflow and any other sites embedding the widget.

## Files

- `chat-widget.js` — Full widget logic; exposes `window.AIChatWidget`
- `chat-widget.css` — Production styling implementing the design system
- `matchi-profile.svg` — Placeholder for profile/avatar (empty file in repo)

## API Surface

Global object: `window.AIChatWidget` with:

- `loadCSS(href: string)` — Injects the stylesheet once using a stable id
- `mountChat(opts?: { endpointUrl?: string; backendUrl?: string; apiKey?: string; })`
  - `endpointUrl`/`backendUrl`: POST endpoint the widget uses for chat
  - `apiKey`: optional override of the built-in key; can also be set via `localStorage('ai-chat.apiKey')`

Events on `window`:

- `ai-chat:open` — Emitted after the chat overlay mounts
- `ai-chat:close` — Emitted when the chat overlay unmounts

## Persistence

The widget stores basic state in `localStorage`:

- `ai-chat.chats` — Array of chats: `{ id, conversation_id, messages, title, createdAt }`. Each message is `{ role, content }` where `content` is either a string or, for assistant replies, an object `{ message, links }` (links is an array of URLs). The widget flattens the object to `content.message` when replaying history to the API.
- `ai-chat.activeChat` — The active chat id

This enables multi‑chat history and simple resume across page loads.

## Styling & Theming

`chat-widget.css` defines CSS variables used across the UI:

- Colors: `--primary-green`, `--background-white`, `--light-background`, `--text-*`, `--border-light`
- Typography: `--font-primary` (Rajdhani), `--font-secondary` (Mulish)
- Effects: `--shadow-main`

To customize, override variables on the host page before `mountChat()` runs.

## Integration Example (CDN)

```html
<script>
(function () {
  var JS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.2/dist/chat-widget.js";
  var CSS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.2/dist/chat-widget.css";
  function ready(fn){/in/.test(document.readyState)?setTimeout(function(){ready(fn)},9):fn()}
  function load(src, onload){var s=document.createElement("script"); s.src=src; s.async=true; s.onload=onload; document.head.appendChild(s)}
  ready(function(){
    var btn=document.createElement("button"); btn.id="ai-chat-launcher"; btn.type="button"; btn.innerHTML = "💬 Support Chat"; document.body.appendChild(btn);
    btn.addEventListener("click", function(){
      if (!window.AIChatWidget) {
        load(JS, function(){ window.AIChatWidget.loadCSS(CSS); window.AIChatWidget.mountChat({ endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi" }); });
      } else {
        window.AIChatWidget.mountChat({ endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi" });
      }
    });
  });
})();
</script>
```

## Versioning

Use Git tags and pin CDN URLs to specific versions:

- `https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@vX.Y.Z/dist/chat-widget.js`
- `https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@vX.Y.Z/dist/chat-widget.css`

## Security Considerations

- The distribution includes a public API key for convenience; treat it as public. Protect server-side with domain allow‑listing, rate limits, and token rotation.
- For stricter control, pass `apiKey` at runtime or proxy through your server.

## Implementation Notes

A high-level description of UI structure, state, and flows is documented in `IMPLEMENTATION_SUMMARY.md`.
