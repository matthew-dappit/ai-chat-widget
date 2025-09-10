(function () {
  const STYLE_ID = "ai-chat-widget-css";
  const STORAGE_KEY = "ai-chat.conversation"; // stores { conversation_id, messages }

  function loadCSS(href) {
    if (document.getElementById(STYLE_ID)) return;
    const l = document.createElement("link");
    l.id = STYLE_ID;
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { conversation_id: null, messages: [] };
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.messages)) return { conversation_id: null, messages: [] };
      return { conversation_id: parsed.conversation_id || null, messages: parsed.messages };
    } catch (_) {
      return { conversation_id: null, messages: [] };
    }
  }

  function writeState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // ignore storage write failures
    }
  }

  function el(tag, style, text) {
    const e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }

  // Minimal safe markdown to HTML: supports **bold** and newlines
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function markdownToHTML(str) {
    let s = escapeHTML(str);
    // Bold: **text** (non-greedy, across lines)
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1<\/strong>');
    // Newlines
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  function mountChat(opts) {
    if (document.getElementById("ai-chat-root")) return;

    const endpointUrl = (opts && (opts.endpointUrl || opts.backendUrl)) || "";
    const apiKey = (opts && (opts.apiKey || localStorage.getItem("ai-chat.apiKey"))) || "";

    // Root overlay
    const root = el(
      "div",
      `position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:2147483646;display:flex;flex-direction:column;`
    );
    root.id = "ai-chat-root";
    // Emit helper
    function emit(name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
    }

    // Header
    const header = el(
      "div",
      `padding:12px 16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;`
    );
    const title = el("span", "font-weight:600;color:#333;", "AI Chat");
    const closeBtn = el(
      "button",
      `background:none;border:none;font-size:18px;cursor:pointer;padding:4px;color:#666;`,
      "×"
    );
    closeBtn.id = "ai-chat-close";
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Messages area
    const messagesArea = el(
      "div",
      `flex:1;overflow:auto;background:#ffffff;padding:16px;display:flex;flex-direction:column;gap:12px;`
    );

    // Input area
    const inputBar = el(
      "div",
      `padding:12px;border-top:1px solid #eee;display:flex;gap:8px;background:#f8f9fa;`
    );
    const input = el(
      "input",
      `flex:1;padding:12px 14px;border:1px solid #ddd;border-radius:8px;outline:none;font-size:16px;`
    );
    input.type = "text";
    input.placeholder = "Type your message...";
    const sendBtn = el(
      "button",
      `padding:12px 16px;border:0;border-radius:8px;background:#2d3748;color:#fff;font-weight:600;cursor:pointer;`,
      "Send"
    );
    inputBar.appendChild(input);
    inputBar.appendChild(sendBtn);

    // Compose DOM
    root.appendChild(header);
    root.appendChild(messagesArea);
    root.appendChild(inputBar);
    document.body.appendChild(root);
    emit('ai-chat:open');

    // Close behavior
    function doClose() {
      root.remove();
      document.removeEventListener("keydown", handleEscape);
      emit('ai-chat:close');
    }
    closeBtn.addEventListener("click", doClose);
    function handleEscape(e) {
      if (e.key === "Escape") doClose();
    }
    document.addEventListener("keydown", handleEscape);

    // Render helpers
    function renderMessage(msg) {
      const isUser = msg.role === "user";
      const wrap = el(
        "div",
        `display:flex;${isUser ? "justify-content:flex-end" : "justify-content:flex-start"};`
      );
      const bubble = el(
        "div",
        `max-width:75%;padding:10px 12px;border-radius:12px;line-height:1.4;white-space:pre-wrap;` +
          (isUser
            ? "background:#2d3748;color:#fff;border-top-right-radius:4px;"
            : "background:#f1f5f9;color:#111827;border-top-left-radius:4px;")
      );
      const html = markdownToHTML(msg.content || "");
      bubble.innerHTML = html;
      wrap.appendChild(bubble);
      messagesArea.appendChild(wrap);
    }

    function renderAll(messages) {
      messagesArea.innerHTML = "";
      if (!messages || !messages.length) {
        const welcome = el(
          "div",
          "color:#6b7280;text-align:center;margin-top:12px;",
          "Welcome! Ask a question to get started."
        );
        messagesArea.appendChild(welcome);
      } else {
        messages.forEach(renderMessage);
      }
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // State
    let state = readState();
    renderAll(state.messages);

    // Networking
    let pending = false;
    function setPending(v) {
      pending = v;
      input.disabled = v;
      sendBtn.disabled = v;
      sendBtn.style.opacity = v ? "0.7" : "1";
      sendBtn.style.cursor = v ? "default" : "pointer";
    }

    function showError(text) {
      const wrap = el("div", "display:flex;justify-content:center;");
      const tag = el(
        "div",
        "background:#fee2e2;color:#991b1b;padding:8px 10px;border-radius:8px;font-size:14px;",
        text
      );
      wrap.appendChild(tag);
      messagesArea.appendChild(wrap);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    async function sendToBackend() {
      if (!endpointUrl) {
        showError("Missing endpointUrl. Configure when mounting.");
        return;
      }

      const body = {
        conversation_id: state.conversation_id || null,
        messages: state.messages.map(m => ({ role: m.role, content: m.content }))
      };

      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `ApiKey ${apiKey}`;

      try {
        setPending(true);
        const res = await fetch(endpointUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !data.new_message) throw new Error("Invalid response body");

        state.conversation_id = data.conversation_id || state.conversation_id || null;
        state.messages.push({ role: "assistant", content: data.new_message.content || "" });
        writeState(state);
        renderAll(state.messages);
      } catch (err) {
        showError("Failed to contact support. Please try again.");
        // Optionally log to console for debugging
        try { console.error("AI chat error:", err); } catch (_) {}
      } finally {
        setPending(false);
      }
    }

    function handleSend() {
      const text = (input.value || "").trim();
      if (!text || pending) return;
      // Append user message
      state.messages.push({ role: "user", content: text });
      writeState(state);
      renderAll(state.messages);
      input.value = "";
      // Call backend
      sendToBackend();
    }

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Focus input on open
    setTimeout(() => input.focus(), 0);
  }

  window.AIChatWidget = { loadCSS, mountChat };
})();
