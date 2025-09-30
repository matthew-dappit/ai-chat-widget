# Webflow Integration

This folder contains the footer custom-code used to integrate the chat widget into the Webflow site.

## Files

- `webflow-footer-custom-code.html` — The current footer custom-code used in production
- `original-webflow-footer-custom-code.html` — Reference/original footer custom-code
- `custom-code.html` — Placeholder for a consolidated snippet you can paste into Webflow

## Where To Paste In Webflow

- Project Settings → Custom Code → Footer
- Or Page Settings → Custom Code → Footer (for page‑specific overrides)

Place the chat widget snippet near the end of the Footer block so core scripts load first.

## Recommended Snippet

```html
<script>
(function () {
  var JS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.5/dist/chat-widget.js";
  var CSS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.5/dist/chat-widget.css";
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

## Updating Versions

- Bump the `@vX.Y.Z` in the CDN URLs when you create a new Git tag
- Test in a staging page first; roll forward as needed

## Notes

- The footer already includes Google Tag Manager noscript and SmoothScroll; keep this chat snippet after those
- Ensure no conflicting global CSS resets affect the `#ai-chat-root` overlay
- For ad blockers or privacy tools, ensure the chat API domain is reachable
