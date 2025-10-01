# AI Chat Widget - Development Guide

## Architecture Overview

**CDN-delivered embeddable chat widget** built with vanilla JavaScript as a self-contained IIFE (~1859 lines). Injects full-screen overlay into Webflow sites without dependencies.

### Directory Structure

- `dist/` — Production bundle (JS/CSS) served via jsDelivr CDN with git tag versioning
- `dev/` — Local testing environment with Python HTTP server (`server.py`)
- `webflow/` — Integration snippets for Webflow footer custom code
- `design-guide/` — Figma exports, CSS templates, design specs (reference only, not shipped)

### Data Flow Architecture

```
User clicks button → Load JS/CSS from CDN → mountChat() →
  ↓
Create #ai-chat-root overlay → Initialize localStorage state →
  ↓
Show search view OR restore active chat → User interaction →
  ↓
POST to Robethood API with history → Stream response →
  ↓
Parse SSE chunks → Render markdown → Update localStorage
```

## Critical Development Workflows

### Local Development & Testing

```bash
cd dev && python3 server.py  # Serves from repo root on :8000, auto-opens browser
```

**Important**: Dev server serves both `/dev` and `/dist` from repository root. The `dev/index.html` uses cache-busting query params (`?v=${Date.now()}`) to avoid CDN caching during development.

### Production Release Workflow

```bash
# 1. Edit dist/chat-widget.js or dist/chat-widget.css
# 2. Test changes locally
cd dev && python3 server.py

# 3. Commit and tag release
git add dist/
git commit -m "feat: description of changes"
git tag v0.1.6  # Increment from current version
git push origin main --tags

# 4. Update Webflow snippet version
# Edit webflow/webflow-footer-custom-code.html:
#   @v0.1.5 → @v0.1.6
# Paste updated snippet into Webflow Project Settings → Custom Code → Footer

# 5. jsDelivr automatically serves new version within minutes
# Verify at: https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.6/dist/chat-widget.js
```

### Testing Checklist

Run `dev/server.py` and verify:

- Button renders bottom-left with correct styling
- Initial search screen shows centered 839px container with sidebar
- FAQ buttons populate search input and transition to chat view
- Chat history persists across page reloads
- ESC key closes overlay and restores scroll
- Language toggle switches between DE/EN with i18n updates
- Assistant responses stream correctly with knowledge links
- Mobile responsive: sidebar hides <1200px, layout adapts <768px

## State Management Pattern

**Pure vanilla JS with localStorage persistence** — no frameworks, no build step.

### Storage Schema

```javascript
// Storage keys (defined at top of dist/chat-widget.js)
localStorage["ai-chat.chats"] = JSON.stringify([
  {
    id: "chat-123", // Generated timestamp ID
    conversation_id: "uuid", // Backend conversation ID
    title: "User's first message (truncated)",
    createdAt: 1696118400000, // Timestamp
    messages: [
      {role: "user", content: "string"},
      {
        role: "assistant",
        content: {
          message: "markdown string",
          knowledge_links: [{url, name}], // Normalized array
          support_links: [],
        },
      },
    ],
  },
]);
localStorage["ai-chat.activeChat"] = "chat-123";
localStorage["ai-chat.language"] = "de"; // "de" | "en"
```

### State Access Functions

```javascript
// Core functions in dist/chat-widget.js (lines ~200-240)
getChats(); // Returns array from localStorage
saveChats(chats); // Writes array to localStorage
getActiveChatId(); // Returns active chat ID
setActiveChatId(id); // Sets active chat ID
getActiveChat(); // Returns full active chat object
createNewChat(); // Creates new chat, sets as active
updateChat(id, updates); // Shallow merge updates into chat
deleteChat(id); // Removes chat, sets new active if needed
```

## UI View Architecture

### View State Machine

```
Initial Load → Search View (default)
                    ↓ (user submits or clicks FAQ)
               Chat View (header + messages + input)
                    ↓ (user clicks "New Chat")
               Back to Search View
```

### View Components

**Search View** (`createSearchView()` ~line 867-1050):

- Centered 839px container with heading, search input, FAQ buttons
- **Spotlight Animation Effect**: Interactive pitch lines with mouse-tracking radial light
  - Grey background layer (#FAF9F8) for pitch line visibility
  - Yellow radial gradient light follows mouse (responsive sizing)
  - Effect confined to search section (excludes sidebar)
  - Cleanup on view transition to prevent memory leaks
- Language toggle (floating top-right)
- Close button (top-right X)
- Transitions to chat view on submit/FAQ click

**Chat View** (`createChatView()` ~line 960-1850):

- Header: Matchi avatar (40px), title, subtitle, language toggle, close button
- Messages area: Scrollable container with user/assistant message bubbles
- Input area: Text input + send button (arrow icon)
- Auto-scrolls to bottom on new messages (smart sticky behavior)

**Sidebar** (`createSidebar()`, `updateSidebar()` ~line 240-400):

- Fixed 247px width, `#FAF9F8` background
- "New Chat" button (primary green)
- Chat history list with delete buttons
- Hidden on mobile (<1200px)

## Design System Implementation

### CSS Architecture

All styles in `dist/chat-widget.css` with **aggressive CSS isolation**:

```css
/* Root variables (lines 1-45) */
:root {
  --primary-green: #375947;
  --background-white: #ffffff;
  --light-background: #faf9f8;
  --font-primary: "Rajdhani", sans-serif; /* Headings */
  --font-secondary: "Mulish", sans-serif; /* Body */
}

/* Isolation strategy: !important on all #ai-chat-root descendants */
#ai-chat-root {
  position: fixed !important;
  z-index: 2147483646 !important;
  /* ... all properties with !important to override host page CSS */
}
```

### Design Specs from Figma

- Sidebar: Exactly 247px width, 48px top padding
- Search container: 839px max-width, centered with offset
- Search input: 76px height with shadow `0 -2px 3px 25px rgba(0,0,0,0.05)`
- Message bubbles: 8px border-radius, `#FAF9F8` background
- FAQ buttons: 12px font, 700 weight, 7.5px/15px padding

### Responsive Breakpoints

```css
@media (max-width: 1200px) {
  /* Hide sidebar, expand main */
}
@media (max-width: 768px) {
  /* Mobile: smaller avatars, adjust padding */
}
```

## Integration & External APIs

### Widget Public API

```javascript
// Exposed on window (line 1857)
window.AIChatWidget = {
  loadCSS(href),          // Injects stylesheet with stable ID, prevents duplicates
  mountChat(options)      // Creates overlay, initializes state
};

// Options for mountChat()
{
  endpointUrl: "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi",
  apiKey: "optional-override"  // Falls back to built-in or localStorage["ai-chat.apiKey"]
}

// Lifecycle events (emitted on window)
'ai-chat:open'   // After overlay mounted and visible
'ai-chat:close'  // After overlay unmounted and scroll restored
```

### Backend API Contract

**POST** to `endpointUrl` with JSON:

```javascript
{
  message: "user's message",
  conversation_id: "uuid-or-null",  // null for first message
  language: "de",                    // Current UI language
  history: [                         // Previous messages for context
    { role: "user", content: "string" },
    { role: "assistant", content: { message, knowledge_links } }
  ]
}

// Response: Server-Sent Events (SSE) stream
data: {"content": "partial text..."}
data: {"content": " more text"}
data: {"done": true, "conversation_id": "uuid", "knowledge_links": [...]}
```

### Internationalization (i18n)

**Bilingual DE/EN** with translation object at top of JS (lines 12-84):

```javascript
const TRANSLATIONS = {
  searchHeading: { en: "Hey, how can I help you?", de: "Hey, wie kann ich dir helfen?" },
  searchSuggestions: {
    de: ["Wie wird meine Provision ausgezahlt?", ...],
    en: ["How is my commission paid out?", ...]
  }
  // ... 15+ translation keys
};

function translate(key) {
  return TRANSLATIONS[key]?.[currentLanguage] || TRANSLATIONS[key]?.["de"] || "";
}
```

Language persists in `localStorage["ai-chat.language"]`, defaults to `"de"`.

## Code Patterns & Conventions

### DOM Construction Pattern

```javascript
// Helper function (line ~100)
function el(tag, style = "", text = "") {
  const element = document.createElement(tag);
  if (style) element.style.cssText = style;
  if (text) element.textContent = text;
  return element;
}

// Usage throughout codebase
const button = el("button", "padding:12px;", "Click me");
```

### Message Rendering with Markdown

```javascript
// Basic markdown support (lines ~505-510)
function markdownToHTML(str) {
  let s = escapeHTML(str);
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>"); // Bold
  s = s.replace(/\n/g, "<br>"); // Line breaks
  return s;
}
```

### Knowledge Link Deduplication

Links from API are normalized and deduplicated by URL:

```javascript
// Special case for contact page (lines ~1200-1250)
if (url === "https://www.robethood.net/kontakt") {
  displayName = currentLanguage === "de" ? "Kontaktiere Uns" : "Contact Us";
}
// Deduplication by lowercase URL including query/fragment
```

### Scroll Management

Smart scroll behavior for chat messages:

```javascript
// Auto-scroll only if user was already at bottom (lines ~1070-1110)
function stickToBottomIfNeeded(shouldStick, options = {}) {
  if (!shouldStick) return;
  // Checks scrollTop proximity before auto-scrolling
  scrollToBottom({behavior: options.behavior || "auto"});
}
```

## Common Pitfalls & Solutions

### CDN Version Mismatches

**Problem**: `dev/index.html` uses `@v0.1.5` but Webflow uses `@v0.1.3`  
**Solution**: Always sync version tags across `dev/index.html`, `webflow/webflow-footer-custom-code.html`, and `dist/README.md` before releasing

### jsDelivr Cache Issues

**Problem**: Changes don't appear after git tag push  
**Solution**: jsDelivr caches for 12-24h. Force refresh with `?v=timestamp` or use `@latest` for testing (never in production)

### CSS Isolation Failures

**Problem**: Host page CSS affects widget layout  
**Solution**: All widget CSS uses `!important` and specific selectors. Never rely on inheritance from body/html

### localStorage Quota Exceeded

**Problem**: Large chat history exceeds 5MB limit  
**Solution**: Implement chat pruning or archive old messages (not currently implemented, but planned)

### Mobile Testing Gaps

**Problem**: Desktop devtools don't catch touch/viewport issues  
**Solution**: Test on actual iOS/Android devices, especially Safari mobile for scroll behavior

## File Size Considerations

Current production bundle:

- `dist/chat-widget.js`: ~1859 lines, ~65KB minified
- `dist/chat-widget.css`: ~822 lines, ~18KB minified
- **No external dependencies** except Google Fonts (loaded separately)

Optimization opportunities:

- Consider terser/minification for smaller CDN payload
- Lazy-load Google Fonts only when widget opens
- Split CSS into critical (above-fold) and deferred chunks
