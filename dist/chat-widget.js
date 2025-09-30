(function () {
  const STYLE_ID = "ai-chat-widget-css";
  const FONT_STYLESHEET_ID = "ai-chat-widget-fonts";
  const FONT_PRECONNECT_ID = "ai-chat-widget-fonts-preconnect";
  const FONT_PRECONNECT_STATIC_ID = "ai-chat-widget-fonts-preconnect-static";
  const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;700&family=Mulish:wght@400;700&display=swap";
  const CHATS_STORAGE_KEY = "ai-chat.chats"; // stores array of chat objects
  const ACTIVE_CHAT_KEY = "ai-chat.activeChat"; // stores active chat id
  const LANGUAGE_STORAGE_KEY = "ai-chat.language";
  const SUPPORTED_LANGUAGES = ["en", "de"];
  const DEFAULT_LANGUAGE = "de";

  const TRANSLATIONS = {
    chatHistory: {
      en: "Chat History",
      de: "Chat-Verlauf"
    },
    newChat: {
      en: "New Chat",
      de: "Neuer Chat"
    },
    assistantSubtitle: {
      en: "AI Support Assistant",
      de: "AI Support Assistent"
    },
    leaveChat: {
      en: "Leave Chat",
      de: "Chat verlassen"
    },
    searchHeading: {
      en: "Hey, how can I help you?",
      de: "Hey, wie kann ich dir helfen?"
    },
    searchInputPlaceholder: {
      en: "Ask Matchi anything!",
      de: "Frag Matchi, was du willst!"
    },
    chatInputPlaceholder: {
      en: "Type your message...",
      de: "Schreibe deine Nachricht..."
    },
    searchSuggestions: {
      en: [
        "How is my commission paid out?",
        "What exactly is Robethood?",
        "I receive €100, what does my teammate get?",
        "What is a betting expert?",
        "How much does a betting expert \"earn\"?"
      ],
      de: [
        "Wie wird meine Provision ausgezahlt?",
        "Was ist Robethood überhaupt?",
        "Ich kriege 100€, was kriegt der Mitspieler?",
        "Was ist ein Wettexperte?",
        "Wie viel \"verdient\" ein Wettexperte?"
      ]
    },
    sourceSingular: {
      en: "Source",
      de: "Quelle"
    },
    sourcePlural: {
      en: "Sources",
      de: "Quellen"
    },
    deleteChatTitle: {
      en: "Delete chat",
      de: "Chat löschen"
    },
    deleteChatPrompt: {
      en: "Are you sure you want to permanently delete this chat?",
      de: "Möchtest du diesen Chat dauerhaft löschen?"
    },
    deleteChatConfirm: {
      en: "Delete",
      de: "Löschen"
    },
    deleteChatCancel: {
      en: "Cancel",
      de: "Abbrechen"
    }
  };

  function getStoredLanguage() {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
    } catch (_) {}
    return DEFAULT_LANGUAGE;
  }

  let currentLanguage = getStoredLanguage();

  function storeLanguage(lang) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (_) {}
  }

  function translate(key) {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    const fallback = entry[DEFAULT_LANGUAGE] != null ? entry[DEFAULT_LANGUAGE] : Object.values(entry)[0];
    const value = entry[currentLanguage];
    const resolved = value != null ? value : fallback;
    if (Array.isArray(resolved)) {
      return resolved.slice();
    }
    return resolved;
  }

  function getSourceLabel(count, options = {}) {
    const { plus = false } = options;
    const isPlural = typeof count === "number" && count !== 1;
    const base = translate(isPlural ? "sourcePlural" : "sourceSingular");
    if (plus && typeof count === "number") {
      return `${base} ${count}+`;
    }
    return base;
  }

  // API Configuration
  const API_ENDPOINT = "https://api.robethood.net/api:zwntye2i/dev/website/matchi";
  const API_KEY = "KlUKmJF7-VsDg-4s7J-8Y9Q-JSybzsF3HW1YyfuPhUlGPI9qGuIdJAKwp-i5rJsH4nTjMMvjcnSmZ1ZS7euU2-xCcmm2Z5YtkN6bg2ADteKngs2-n-B1m4TestjpFO9cUmtnCig2lLxNFBMCz8cTTe1rj6F9dPPL1GK3ozXNV3_D_LMYFtZY6SIFNEmYOBAK3P8";
  const AVATAR_VERSION = "20240117";

  const SCRIPT_BASE_URL = (() => {
    try {
      const currentScript = document.currentScript;
      if (currentScript && currentScript.src) {
        return currentScript.src;
      }

      const scripts = document.getElementsByTagName("script");
      for (let i = scripts.length - 1; i >= 0; i -= 1) {
        const candidate = scripts[i];
        if (candidate && candidate.src) {
          return candidate.src;
        }
      }
    } catch (_) {}

    return null;
  })();

  function resolveAssetPath(fileName) {
    if (!SCRIPT_BASE_URL) return fileName;

    try {
      return new URL(fileName, SCRIPT_BASE_URL).toString();
    } catch (_) {
      return fileName;
    }
  }

  let activeSourceClickHandler = null;

  function ensureGoogleFonts() {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;

    if (!document.getElementById(FONT_PRECONNECT_ID)) {
      const preconnect = document.createElement("link");
      preconnect.id = FONT_PRECONNECT_ID;
      preconnect.rel = "preconnect";
      preconnect.href = "https://fonts.googleapis.com";
      head.appendChild(preconnect);
    }

    if (!document.getElementById(FONT_PRECONNECT_STATIC_ID)) {
      const preconnectStatic = document.createElement("link");
      preconnectStatic.id = FONT_PRECONNECT_STATIC_ID;
      preconnectStatic.rel = "preconnect";
      preconnectStatic.href = "https://fonts.gstatic.com";
      preconnectStatic.crossOrigin = "";
      head.appendChild(preconnectStatic);
    }

    if (!document.getElementById(FONT_STYLESHEET_ID)) {
      const fontStylesheet = document.createElement("link");
      fontStylesheet.id = FONT_STYLESHEET_ID;
      fontStylesheet.rel = "stylesheet";
      fontStylesheet.href = GOOGLE_FONTS_URL;
      head.appendChild(fontStylesheet);
    }
  }

  function loadCSS(href) {
    ensureGoogleFonts();
    if (document.getElementById(STYLE_ID)) return;
    const l = document.createElement("link");
    l.id = STYLE_ID;
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  // Chat management functions
  function getAllChats() {
    try {
      const raw = localStorage.getItem(CHATS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveChats(chats) {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    } catch (_) {}
  }

  function getActiveChat() {
    try {
      const chatId = localStorage.getItem(ACTIVE_CHAT_KEY);
      if (!chatId) return null;
      const chats = getAllChats();
      return chats.find(chat => chat.id === chatId) || null;
    } catch (_) {
      return null;
    }
  }

  function setActiveChat(chatId) {
    try {
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    } catch (_) {}
  }

  function createNewChat(initialMessage = null) {
    const chatId = generateChatId();
    const chat = {
      id: chatId,
      conversation_id: null,
      messages: initialMessage ? [{ role: "user", content: initialMessage }] : [],
      title: initialMessage ? truncateTitle(initialMessage) : translate("newChat"),
      createdAt: Date.now()
    };

    const chats = getAllChats();
    chats.unshift(chat);
    saveChats(chats);
    setActiveChat(chatId);

    return chat;
  }

  function updateChat(chatId, updates) {
    const chats = getAllChats();
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex === -1) return null;

    chats[chatIndex] = { ...chats[chatIndex], ...updates };
    saveChats(chats);
    return chats[chatIndex];
  }

  function deleteChat(chatId) {
    const chats = getAllChats();
    const filteredChats = chats.filter(chat => chat.id !== chatId);
    saveChats(filteredChats);

    const activeChat = getActiveChat();
    if (activeChat && activeChat.id === chatId) {
      if (filteredChats.length > 0) {
        setActiveChat(filteredChats[0].id);
      } else {
        const newChat = createNewChat();
        setActiveChat(newChat.id);
      }
    }
    return filteredChats.length;
  }

  function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function truncateTitle(text, maxLength = 25) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }

  // Legacy functions for compatibility
  function readState() {
    const activeChat = getActiveChat();
    if (!activeChat) return { conversation_id: null, messages: [] };
    return {
      conversation_id: activeChat.conversation_id,
      messages: activeChat.messages
    };
  }

  function writeState(state) {
    const activeChat = getActiveChat();
    if (activeChat) {
      updateChat(activeChat.id, {
        conversation_id: state.conversation_id,
        messages: state.messages
      });
    }
  }

  function normalizeMessagesForRequest(messages) {
    if (!Array.isArray(messages)) return [];
    return messages.map(message => {
      if (!message || typeof message !== "object") return message;

      const normalized = { ...message };
      const rawContent = normalized.content;

      if (rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)) {
        normalized.content = rawContent.message || "";
      }

      return normalized;
    });
  }

  // API function to send message to Matchi
  async function sendMessageToMatchi(conversationId, messageHistory, handlers = {}) {
    const { onMessage, onDone } = handlers;

    try {
      const normalizedMessages = normalizeMessagesForRequest(messageHistory);
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${API_KEY}`
        },
        body: JSON.stringify({
          'conversation_id': conversationId,
          'messages': normalizedMessages,
          'language': currentLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      if (!response.body || typeof response.body.getReader !== "function") {
        const data = await response.json();
        if (onMessage) onMessage(data);
        if (onDone) onDone(data);
        return data;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamFinished = false;
      let latestPayload = null;
      let pendingDataLines = [];

      function emitPayload(payload) {
        latestPayload = payload;
        if (onMessage) onMessage(payload);
      }

      function flushPendingData({ isFinalFlush = false } = {}) {
        if (pendingDataLines.length === 0) return true;
        const dataString = pendingDataLines.join("\n");
        pendingDataLines = [];

        const trimmedData = dataString.trim();
        if (!trimmedData) return true;

        if (trimmedData === "[DONE]") {
          streamFinished = true;
          if (onDone) onDone(latestPayload);
          return true;
        }

        try {
          const payload = JSON.parse(dataString);
          emitPayload(payload);
          return true;
        } catch (error) {
          if (isFinalFlush) {
            console.warn("Failed to parse streamed SSE payload:", dataString);
            return true;
          }
          return false;
        }
      }

      function tryHandleLine(rawLine) {
        const line = rawLine.replace(/\r$/, "");
        const trimmedLine = line.trim();

        if (!line || trimmedLine === "") {
          return flushPendingData();
        }

        if (trimmedLine === "[DONE]") {
          streamFinished = true;
          if (onDone) onDone(latestPayload);
          return true;
        }

        if (line.startsWith("data:")) {
          const dataPart = line.slice(5).replace(/^\s*/, "");
          pendingDataLines.push(dataPart);
          return true;
        }

        if (line.startsWith("id:")) {
          // Ignore SSE id lines; no client-side use for now
          return true;
        }

        if (pendingDataLines.length > 0) {
          // Unexpected non-data line while accumulating SSE data
          const handled = flushPendingData();
          if (!handled) return false;
        }

        try {
          const payload = JSON.parse(trimmedLine);
          emitPayload(payload);
          return true;
        } catch (error) {
          return false;
        }
      }

      function processBuffer({ flush = false } = {}) {
        while (true) {
          const newlineIndex = buffer.indexOf("\n");
          if (newlineIndex === -1) break;
          const potentialLine = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!tryHandleLine(potentialLine)) {
            buffer = potentialLine + "\n" + buffer;
            break;
          }
          if (streamFinished) {
            buffer = "";
            pendingDataLines = [];
            return;
          }
        }

        if (flush) {
          const remaining = buffer;
          buffer = "";
          if (remaining.trim().length > 0 && !tryHandleLine(remaining)) {
            console.warn("Failed to parse streamed payload:", remaining);
          }
          flushPendingData({ isFinalFlush: true });
        }
      }

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          processBuffer();
        }
        if (done) {
          buffer += decoder.decode();
          processBuffer({ flush: true });
          if (!streamFinished && onDone) {
            onDone(latestPayload);
          }
          break;
        }
      }

      return latestPayload;

    } catch (error) {
      console.error("Error communicating with the AI chatbot:", error);
      if (handlers && typeof handlers.onError === "function") {
        handlers.onError(error);
      }
      return null;
    }
  }

  function el(tag, style, text) {
    const e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }

  // Minimal safe markdown to HTML
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
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1<\/strong>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  function mountChat(opts) {
    if (document.getElementById("ai-chat-root")) return;

    // Root overlay
    const root = el(
      "div",
      `position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:2147483646;display:flex;overflow:hidden;`
    );
    root.id = "ai-chat-root";

    // Prevent page scroll while widget is open
    const _prevHtmlOverflow = document.documentElement.style.overflow;
    const _prevBodyOverflow = document.body.style.overflow;
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (_) {}

    let currentView = 'search';
    let activeConfirmDialog = null;

    function rerenderForLanguageChange() {
      updateSidebar();
      if (currentView === 'chat') {
        const activeChat = getActiveChat();
        if (activeChat && activeChat.messages && activeChat.messages.length > 0) {
          createChatView(null, activeChat);
        } else {
          createSearchView();
        }
      } else {
        createSearchView();
      }
    }

    function closeActiveConfirmDialog() {
      if (!activeConfirmDialog) return;
      const { overlay, keyHandler } = activeConfirmDialog;
      overlay.classList.remove("visible");
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 200);
      if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
      }
      activeConfirmDialog = null;
    }

    function showConfirmDialog(options) {
      closeActiveConfirmDialog();

      const {
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm,
        onCancel
      } = options;

      const overlay = el("div", "");
      overlay.className = "chat-confirm-overlay";

      const dialog = el("div", "");
      dialog.className = "chat-confirm-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      overlay.appendChild(dialog);

      if (title) {
        dialog.setAttribute("aria-label", title);
      }

      if (message) {
        const copy = el("p", "", message);
        copy.className = "chat-confirm-message";
        const messageId = "chat-confirm-message-" + Date.now();
        copy.id = messageId;
        dialog.appendChild(copy);
        dialog.setAttribute("aria-describedby", messageId);
      }

      const actions = el("div", "");
      actions.className = "chat-confirm-actions";

      const cancelButton = el("button", "", cancelLabel || "Cancel");
      cancelButton.type = "button";
      cancelButton.className = "chat-confirm-button chat-confirm-cancel";

      const confirmButton = el("button", "", confirmLabel || "Confirm");
      confirmButton.type = "button";
      confirmButton.className = "chat-confirm-button chat-confirm-confirm";

      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      dialog.appendChild(actions);

      const keyHandler = function(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          if (typeof onCancel === "function") {
            onCancel();
          }
          closeActiveConfirmDialog();
        }
      };

      cancelButton.addEventListener("click", function() {
        if (typeof onCancel === "function") {
          onCancel();
        }
        closeActiveConfirmDialog();
      });

      confirmButton.addEventListener("click", function() {
        closeActiveConfirmDialog();
        if (typeof onConfirm === "function") {
          onConfirm();
        }
      });

      overlay.addEventListener("click", function(event) {
        if (event.target === overlay) {
          if (typeof onCancel === "function") {
            onCancel();
          }
          closeActiveConfirmDialog();
        }
      });

      document.addEventListener("keydown", keyHandler);

      root.appendChild(overlay);

      requestAnimationFrame(function() {
        overlay.classList.add("visible");
        confirmButton.focus();
      });

      activeConfirmDialog = {
        overlay,
        keyHandler
      };
    }

    function handleLanguageChange(lang) {
      if (!SUPPORTED_LANGUAGES.includes(lang) || lang === currentLanguage) {
        return;
      }
      currentLanguage = lang;
      storeLanguage(lang);
      rerenderForLanguageChange();
    }

    function updateToggleActive(toggle) {
      if (!toggle) return;
      const buttons = toggle.querySelectorAll('.language-toggle-option');
      buttons.forEach(button => {
        const lang = button.getAttribute('data-lang');
        const isActive = lang === currentLanguage;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function createLanguageToggle(options = {}) {
      const { variant = 'chat' } = options;
      const container = el('div', '');
      container.className = 'language-toggle';
      if (variant === 'search') {
        container.classList.add('language-toggle--floating');
      }
      container.setAttribute('role', 'group');
      container.setAttribute('aria-label', currentLanguage === 'de' ? 'Sprachauswahl' : 'Language selection');

      function createButton(langCode) {
        const label = langCode.toLowerCase();
        const button = el('button', '', label);
        button.type = 'button';
        button.className = 'language-toggle-option';
        button.setAttribute('data-lang', langCode);
        button.setAttribute('aria-label', langCode === 'de' ? 'Deutsch' : 'English');
        button.addEventListener('click', function () {
          handleLanguageChange(langCode);
        });
        return button;
      }

      const enButton = createButton('en');
      const separator = el('span', '', '|');
      separator.className = 'language-toggle-separator';
      const deButton = createButton('de');

      container.appendChild(enButton);
      container.appendChild(separator);
      container.appendChild(deButton);

      updateToggleActive(container);

      return container;
    }

    function emit(name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
    }

    // Sidebar
    const sidebar = el("div", "");
    sidebar.className = "chat-history-sidebar";

    function updateSidebar() {
      sidebar.innerHTML = "";

      const sidebarTitle = el("div", "", translate("chatHistory"));
      sidebarTitle.className = "chat-history-title";
      sidebar.appendChild(sidebarTitle);

      const newChatBtn = el("button", "");
      newChatBtn.className = "chat-history-item";
      const newChatText = el("span", "", translate("newChat"));
      newChatText.className = "chat-history-text";
      newChatBtn.appendChild(newChatText);
      newChatBtn.addEventListener("click", function() {
        createNewChatHandler();
      });
      sidebar.appendChild(newChatBtn);

      const chats = getAllChats();
      const activeChat = getActiveChat();

      chats.forEach(chat => {
        const item = el("div", "");
        item.className = "chat-history-item-container";
        if (activeChat && chat.id === activeChat.id) {
          item.classList.add("active");
        }

        const chatButton = el("button", "");
        chatButton.className = "chat-history-button";

        const itemText = el("span", "", chat.title);
        itemText.className = "chat-history-text";
        chatButton.appendChild(itemText);

        chatButton.addEventListener("click", function() {
          switchToChat(chat.id);
        });

        const deleteButton = el("button");
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5"/></svg>`;
        deleteButton.className = "chat-delete-button";
        const deleteLabel = translate("deleteChatTitle");
        deleteButton.title = deleteLabel;
        deleteButton.setAttribute("aria-label", deleteLabel);
        deleteButton.addEventListener("click", function(e) {
          e.stopPropagation();
          deleteChatHandler(chat.id, chat.title);
        });

        item.appendChild(chatButton);
        item.appendChild(deleteButton);
        sidebar.appendChild(item);
      });
    }

    function createNewChatHandler() {
      createNewChat();
      updateSidebar();
      createSearchView();
      currentView = 'search';
    }

    function switchToChat(chatId) {
      setActiveChat(chatId);
      const chat = getActiveChat();
      if (chat && chat.messages.length > 0) {
        createChatView(null, chat);
        currentView = 'chat';
      } else {
        createSearchView();
        currentView = 'search';
      }
      updateSidebar();
    }

    function deleteChatHandler(chatId, chatTitle) {
      showConfirmDialog({
        title: translate("deleteChatTitle"),
        message: translate("deleteChatPrompt"),
        confirmLabel: translate("deleteChatConfirm"),
        cancelLabel: translate("deleteChatCancel"),
        onConfirm: function() {
          const remaining = deleteChat(chatId);
          updateSidebar();

          const activeChat = getActiveChat();
          if (activeChat) {
            if (activeChat.messages.length > 0) {
              createChatView(null, activeChat);
              currentView = 'chat';
            } else {
              createSearchView();
              currentView = 'search';
            }
          } else {
            createSearchView();
            currentView = 'search';
          }
        }
      });
    }

    // Main content column
    const mainContent = el("div", "");
    mainContent.className = "main-content";

    // Search view
    function createSearchView() {
      if (activeSourceClickHandler) {
        document.removeEventListener("click", activeSourceClickHandler);
        activeSourceClickHandler = null;
      }

      mainContent.innerHTML = "";
      mainContent.className = "main-content search-mode";


      const searchContainer = el("div", "");
      searchContainer.className = "search-container";
      // Remove relative positioning so close button can be absolutely positioned to the overlay
      searchContainer.style.position = "";

      // --- Add Close Button ---
      const closeBtn = el("button", "");
      closeBtn.className = "search-close-button";
      closeBtn.setAttribute("aria-label", "Close chat");
      closeBtn.innerHTML = "&times;";
      // All styling handled by .search-close-button CSS class
      function doClose() {
        try {
          document.documentElement.style.overflow = _prevHtmlOverflow || '';
          document.body.style.overflow = _prevBodyOverflow || '';
        } catch (_) {}
        if (activeSourceClickHandler) {
          document.removeEventListener("click", activeSourceClickHandler);
          activeSourceClickHandler = null;
        }
        root.remove();
        document.removeEventListener("keydown", handleEscape);
        emit('ai-chat:close');
      }
      closeBtn.addEventListener("click", doClose);
      function handleEscape(e) {
        if (e.key === "Escape") doClose();
      }
      document.addEventListener("keydown", handleEscape);
      // Remove any existing search close button before adding a new one
      var searchCloseBtn = root.querySelector('.search-close-button');
      if (searchCloseBtn) searchCloseBtn.remove();
      var existingFloatingToggle = root.querySelector('.language-toggle--floating');
      if (existingFloatingToggle) existingFloatingToggle.remove();
      const searchLanguageToggle = createLanguageToggle({ variant: 'search' });
      root.appendChild(searchLanguageToggle);
      root.appendChild(closeBtn);

      const heading = el("h1", "", translate("searchHeading"));
      heading.className = "main-heading";

      const searchSection = el("div", "");
      searchSection.className = "search-section";

      const searchInputContainer = el("div", "");
      searchInputContainer.className = "search-input-container";

      const searchInput = el("input", "");
      searchInput.className = "search-input";
      searchInput.type = "text";
      searchInput.placeholder = translate("searchInputPlaceholder");

      const submitButton = el("button", "");
      submitButton.className = "search-submit-button";
      submitButton.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12L12 5L19 12M12 19V6V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

      searchInputContainer.appendChild(searchInput);
      searchInputContainer.appendChild(submitButton);

      const faqContainer = el("div", "");
      faqContainer.className = "faq-container";

      const faqQuestions = translate("searchSuggestions");

      (Array.isArray(faqQuestions) ? faqQuestions : []).forEach(question => {
        const faqBtn = el("button", "", question);
        faqBtn.className = "faq-button";
        faqBtn.addEventListener("click", function() {
          searchInput.value = question;
          handleSearch(question);
        });
        faqContainer.appendChild(faqBtn);
      });

      searchSection.appendChild(searchInputContainer);
      searchSection.appendChild(faqContainer);

      searchContainer.appendChild(heading);
      searchContainer.appendChild(searchSection);

      mainContent.appendChild(searchContainer);

      setTimeout(() => { if (searchInput) searchInput.focus(); }, 0);

      function handleSearch(query) {
        if (!query) query = searchInput.value.trim();
        if (!query) return;

        let activeChat = getActiveChat();
        if (!activeChat || activeChat.messages.length > 0) {
          activeChat = createNewChat();
        }

        activeChat.title = truncateTitle(query);
        updateChat(activeChat.id, { title: activeChat.title });

        updateSidebar();
        createChatView(query, activeChat);
      }

      submitButton.addEventListener("click", () => handleSearch());
      searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSearch();
        }
      });

      return searchContainer;
    }

    // Chat view
    function createChatView(initialQuery, chat = null) {
      currentView = 'chat';

      // Remove search close button if present (should only show in search view)
      var searchCloseBtn = root.querySelector('.search-close-button');
      if (searchCloseBtn) searchCloseBtn.remove();
      var floatingToggle = root.querySelector('.language-toggle--floating');
      if (floatingToggle) floatingToggle.remove();

      if (activeSourceClickHandler) {
        document.removeEventListener("click", activeSourceClickHandler);
        activeSourceClickHandler = null;
      }

      let activeChat = chat || getActiveChat();
      if (!activeChat) {
        activeChat = createNewChat(initialQuery);
        updateSidebar();
      }

      mainContent.innerHTML = "";
      mainContent.className = "main-content chat-mode";

      // Wrapper
      const chatWrapper = el("div", "");
      chatWrapper.className = "chat-wrapper";

      // Header (now contains the Close button on the right)
      const chatHeader = el("div", "");
      chatHeader.className = "chat-header";

      const headerProfile = el("div", "");
      headerProfile.className = "chat-header-profile";

      const headerAvatar = el("img");
      headerAvatar.className = "chat-header-avatar";
      headerAvatar.src = resolveAssetPath(`matchi-avatar.png?v=${AVATAR_VERSION}`);
      headerAvatar.alt = "Matchi AI support avatar";

      const headerInfo = el("div", "");
      headerInfo.className = "chat-header-info";

      const headerTitle = el("h3", "", "Matchi");
      headerTitle.className = "chat-header-title";

      const headerSubtitle = el("p", "", translate("assistantSubtitle"));
      headerSubtitle.className = "chat-header-subtitle";

      headerInfo.appendChild(headerTitle);
      headerInfo.appendChild(headerSubtitle);
      headerProfile.appendChild(headerAvatar);
      headerProfile.appendChild(headerInfo);

      // Header actions (Leave chat button, etc.)
      const headerActions = el("div", "");
      headerActions.className = "chat-header-actions";

      const closeBtn = el("button", "");
      closeBtn.type = "button";
      closeBtn.className = "leave-chat-button";
      closeBtn.id = "ai-chat-close";
      closeBtn.setAttribute("aria-label", "Close chat");
      closeBtn.innerHTML = translate("leaveChat");

      const languageToggle = createLanguageToggle({ variant: 'chat' });

      headerActions.appendChild(languageToggle);

      headerActions.appendChild(closeBtn);

      chatHeader.appendChild(headerProfile);
      chatHeader.appendChild(headerActions);

      // Chat container
      const chatContainer = el("div", "");
      chatContainer.className = "chat-container";

      // Messages area
      const messagesArea = el("div", "");
      messagesArea.className = "messages-area";

      // Input area
      const inputArea = el("div", "");
      inputArea.className = "chat-input-area";

      const inputContainer = el("div", "");
      inputContainer.className = "chat-input-container";

      const input = el("input", "");
      input.className = "chat-input";
      input.type = "text";
      input.placeholder = translate("chatInputPlaceholder");

      const sendBtn = el("button", "");
      sendBtn.className = "chat-send-button";
      sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
      </svg>`;

      inputContainer.appendChild(input);
      inputContainer.appendChild(sendBtn);
      inputArea.appendChild(inputContainer);

      chatContainer.appendChild(messagesArea);
      chatContainer.appendChild(inputArea);

      chatWrapper.appendChild(chatHeader);
      chatWrapper.appendChild(chatContainer);

      mainContent.appendChild(chatWrapper);

      const multiSourceWrappers = new Set();

      function scrollToBottom({ behavior = "auto" } = {}) {
        if (!messagesArea) return;
        try {
          if (typeof messagesArea.scrollTo === "function") {
            messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior });
            return;
          }
        } catch (_) {}
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }

      function isScrolledToBottom(element, threshold = 6) {
        if (!element) return false;
        const distance = element.scrollHeight - (element.scrollTop + element.clientHeight);
        return distance <= threshold;
      }

      function stickToBottomIfNeeded(shouldStick, options = {}) {
        if (!shouldStick) return;

        const {
          behavior = "auto",
          waitFor = null,
          waitTimeout = 350
        } = options;

        let executed = false;
        const runScroll = () => {
          if (executed) return;
          executed = true;
          scrollToBottom({ behavior });
        };

        if (waitFor && typeof waitFor.addEventListener === "function") {
          const handleTransitionEnd = event => {
            if (event.target !== waitFor) return;
            waitFor.removeEventListener("transitionend", handleTransitionEnd);
            runScroll();
          };
          waitFor.addEventListener("transitionend", handleTransitionEnd);
          if (typeof waitTimeout === "number") {
            setTimeout(() => {
              waitFor.removeEventListener("transitionend", handleTransitionEnd);
              runScroll();
            }, waitTimeout);
          }
          requestAnimationFrame(() => {
            scrollToBottom({ behavior: "auto" });
          });
        } else {
          requestAnimationFrame(runScroll);
        }
      }

      function cleanLinkText(link) {
        try {
          const url = new URL(link);
          const trimmedPath = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
          const query = url.search || "";
          return `${url.host}${trimmedPath}${query}` || url.host;
        } catch (_) {
          return link.replace(/^https?:\/\//i, '').replace(/\/$/, '');
        }
      }

      function normalizeLinkKey(link) {
        if (!link) return "";
        try {
          const url = new URL(link);
          const host = url.host.toLowerCase();
          const path = url.pathname.replace(/\/$/, '').toLowerCase();
          const query = url.search || "";
          const hash = url.hash ? url.hash.toLowerCase() : "";
          return `${host}${path}${query}${hash}`;
        } catch (_) {
          return link.trim().replace(/\/$/, '').toLowerCase();
        }
      }

      function isRobethoodContactUrl(link) {
        if (!link) return false;
        try {
          const url = new URL(link);
          if (url.host.toLowerCase() !== "www.robethood.net") return false;
          const path = url.pathname.replace(/\/$/, '').toLowerCase();
          return path === "/kontakt";
        } catch (_) {
          const normalized = link.trim().replace(/\/$/, '').toLowerCase();
          return normalized === "https://www.robethood.net/kontakt" || normalized === "http://www.robethood.net/kontakt";
        }
      }

      function getKnowledgeLinkLabel(link) {
        if (!link || typeof link !== "object") return "";
        const { url, name } = link;
        if (isRobethoodContactUrl(url)) {
          return currentLanguage === "de" ? "Kontaktiere Uns" : "Contact Us";
        }
        if (typeof name === "string" && name.trim() !== "") {
          return name.trim();
        }
        return cleanLinkText(url || "");
      }

      function createSourceButton(label, options = {}) {
        const { showIcon = true } = options;
        const button = el("button", "");
        button.type = "button";
        button.className = "message-link";

        if (showIcon) {
          const icon = el("span", "");
          icon.className = "material-symbols--link";
          icon.setAttribute("aria-hidden", "true");
          button.appendChild(icon);
        }

        const textSpan = el("span", "");
        textSpan.className = "message-link-text";
        textSpan.textContent = label;
        button.appendChild(textSpan);

        return button;
      }

      function collapseMultiSourceWrapper(wrapper) {
        if (!wrapper) return;
        wrapper.dataset.state = "collapsed";
        const toggleButton = wrapper.querySelector(".message-link-toggle");
        const listContainer = wrapper.querySelector(".message-link-list");
        if (toggleButton) {
          toggleButton.setAttribute("aria-expanded", "false");
        }
        if (listContainer) {
          listContainer.setAttribute("aria-hidden", "true");
        }
      }

      function collapseAllMultiSourceWrappers(exceptWrapper = null) {
        const rootIsConnected = root && root.isConnected;
        multiSourceWrappers.forEach(wrapper => {
          if (!wrapper) {
            multiSourceWrappers.delete(wrapper);
            return;
          }
          if (rootIsConnected && !wrapper.isConnected) {
            multiSourceWrappers.delete(wrapper);
            return;
          }
          if (exceptWrapper && wrapper === exceptWrapper) return;
          if (wrapper.dataset.state === "expanded") {
            collapseMultiSourceWrapper(wrapper);
          }
        });
      }

      function expandMultiSourceWrapper(wrapper) {
        if (!wrapper) return;
        collapseAllMultiSourceWrappers(wrapper);
        wrapper.dataset.state = "expanded";
        const toggleButton = wrapper.querySelector(".message-link-toggle");
        const listContainer = wrapper.querySelector(".message-link-list");
        if (toggleButton) {
          toggleButton.setAttribute("aria-expanded", "true");
        }
        if (listContainer) {
          listContainer.setAttribute("aria-hidden", "false");
        }
      }

      function uniqueSanitizedLinks(links) {
        if (!Array.isArray(links)) return [];

        const uniqueLinks = [];
        const seenLinks = new Set();

        links.forEach(link => {
          let url = "";
          let name = "";

          if (typeof link === "string") {
            url = link.trim();
          } else if (link && typeof link === "object") {
            if (typeof link.url === "string") {
              url = link.url.trim();
            } else if (typeof link.href === "string") {
              url = link.href.trim();
            } else if (typeof link.link === "string") {
              url = link.link.trim();
            }

            if (link.display_name != null) {
              name = String(link.display_name).trim();
            } else if (link.name != null) {
              name = String(link.name).trim();
            } else if (link.label != null) {
              name = String(link.label).trim();
            } else if (link.title != null) {
              name = String(link.title).trim();
            }
          }

          if (!url) return;

          const dedupeKey = normalizeLinkKey(url);
          if (!dedupeKey || seenLinks.has(dedupeKey)) return;

          seenLinks.add(dedupeKey);
          if (!name) {
            name = cleanLinkText(url);
          }

          uniqueLinks.push({ url, name });
        });

        return uniqueLinks;
      }

      function createLinksWrapperFromList(linkList) {
        const uniqueLinks = uniqueSanitizedLinks(linkList);
        if (uniqueLinks.length === 0) return null;

        const linksWrapper = el("div", "");
        linksWrapper.className = "message-links";

        if (uniqueLinks.length === 1) {
          const singleLink = uniqueLinks[0];
          const singleLabel = getKnowledgeLinkLabel(singleLink) || getSourceLabel(1);
          const singleButton = createSourceButton(singleLabel);
          singleButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            const targetUrl = singleLink.url;
            try {
              window.open(targetUrl, "_blank", "noopener");
            } catch (_) {
              window.location.href = targetUrl;
            }
            collapseAllMultiSourceWrappers();
          });
          linksWrapper.appendChild(singleButton);
        } else {
          const listId = `message-link-list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const listContainer = el("div", "");
          listContainer.className = "message-link-list";
          listContainer.id = listId;
          listContainer.setAttribute("aria-hidden", "true");

          uniqueLinks.forEach(link => {
            const linkLabel = getKnowledgeLinkLabel(link) || getSourceLabel(1);
            const linkButton = createSourceButton(linkLabel);
            linkButton.classList.add("message-link-url");
            linkButton.addEventListener("click", function(event) {
              event.preventDefault();
              event.stopPropagation();
              const targetUrl = link.url;
              try {
                window.open(targetUrl, "_blank", "noopener");
              } catch (_) {
                window.location.href = targetUrl;
              }
              collapseAllMultiSourceWrappers();
            });
            listContainer.appendChild(linkButton);
          });

          const toggleButton = createSourceButton(getSourceLabel(uniqueLinks.length, { plus: true }));
          toggleButton.classList.add("message-link-toggle");
          toggleButton.setAttribute("aria-expanded", "false");
          toggleButton.setAttribute("aria-controls", listId);
          toggleButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            const shouldStick = isScrolledToBottom(messagesArea);
            const isExpanding = linksWrapper.dataset.state !== "expanded";
            const disableTransition = shouldStick && isExpanding;

            if (!isExpanding) {
              if (shouldStick) {
                listContainer.classList.add("no-transition");
              }
              collapseMultiSourceWrapper(linksWrapper);
              stickToBottomIfNeeded(shouldStick);
              if (shouldStick) {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    listContainer.classList.remove("no-transition");
                  });
                });
              }
            } else {
              if (disableTransition) {
                listContainer.classList.add("no-transition");
              }
              expandMultiSourceWrapper(linksWrapper);
              if (disableTransition) {
                stickToBottomIfNeeded(shouldStick);
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    listContainer.classList.remove("no-transition");
                  });
                });
              } else {
                stickToBottomIfNeeded(shouldStick, {
                  waitFor: listContainer,
                  waitTimeout: 400,
                  behavior: "smooth"
                });
              }
            }
          });

          linksWrapper.appendChild(toggleButton);
          linksWrapper.appendChild(listContainer);
          multiSourceWrappers.add(linksWrapper);
          collapseMultiSourceWrapper(linksWrapper);
        }

        return linksWrapper;
      }

      function extractMessageContent(rawContent) {
        if (rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)) {
          const message = rawContent.message == null ? "" : String(rawContent.message);
          const linkSource = rawContent.knowledge_links != null ? rawContent.knowledge_links : rawContent.links;
          const links = uniqueSanitizedLinks(linkSource);
          return { text: message, links };
        }

        const fallbackText = rawContent == null ? "" : String(rawContent);
        return { text: fallbackText, links: [] };
      }

      const handleDocumentClick = function(event) {
        if (multiSourceWrappers.size === 0) return;
        const wrapper = event.target.closest(".message-links");
        if (wrapper && multiSourceWrappers.has(wrapper)) return;
        collapseAllMultiSourceWrappers();
      };

      document.addEventListener("click", handleDocumentClick);
      activeSourceClickHandler = handleDocumentClick;

      // Load existing messages
      activeChat.messages.forEach(message => {
        addMessage(message);
      });

      scrollToBottom();
      stickToBottomIfNeeded(true);

      if (initialQuery && !activeChat.messages.find(m => m.content === initialQuery)) {
        activeChat.messages.push({ role: "user", content: initialQuery });
        updateChat(activeChat.id, { messages: activeChat.messages });

        addMessage({ role: "user", content: initialQuery });
        sendMessageToAI(initialQuery);
      }

      function createTypingIndicator() {
        const messageContainer = el("div", "");
        messageContainer.className = "message-container assistant";

        const messageContent = el("div", "");
        messageContent.className = "message-content";

        const bubble = el("div", "");
        bubble.className = "message-bubble typing-indicator";
        bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

        messageContent.appendChild(bubble);
        messageContainer.appendChild(messageContent);
        messagesArea.appendChild(messageContainer);
        scrollToBottom();
        return messageContainer;
      }

      function addMessage(messageOrRole, maybeContent) {
        const message = (messageOrRole && typeof messageOrRole === "object" && !Array.isArray(messageOrRole))
          ? messageOrRole
          : { role: messageOrRole, content: maybeContent };

        const role = message.role || "assistant";
        const { text: displayText, links: linkList } = extractMessageContent(message.content);

        const messageContainer = el("div", "");
        messageContainer.className = `message-container ${role}`;

        const messageContent = el("div", "");
        messageContent.className = "message-content";

        const bubble = el("div", "");
        bubble.className = `message-bubble ${role}`;
        bubble.innerHTML = markdownToHTML(displayText);

        messageContent.appendChild(bubble);

        collapseAllMultiSourceWrappers();

        let linksWrapper = null;
        if (linkList.length > 0) {
          linksWrapper = createLinksWrapperFromList(linkList);
          if (linksWrapper) {
            messageContent.appendChild(linksWrapper);
          }
        }

        messageContainer.appendChild(messageContent);

        messagesArea.appendChild(messageContainer);
        scrollToBottom();

        function updateMessage(nextMessage, options = {}) {
          const nextRole = (nextMessage && nextMessage.role) || role || "assistant";
          const { text: nextText, links: nextLinks } = extractMessageContent(nextMessage ? nextMessage.content : "");
          const shouldStick = options.shouldStick ?? isScrolledToBottom(messagesArea);

          messageContainer.className = `message-container ${nextRole}`;
          bubble.className = `message-bubble ${nextRole}`;
          bubble.innerHTML = markdownToHTML(nextText);

          if (linksWrapper) {
            if (multiSourceWrappers.has(linksWrapper)) {
              multiSourceWrappers.delete(linksWrapper);
            }
            linksWrapper.remove();
            linksWrapper = null;
          }

          if (nextLinks.length > 0) {
            collapseAllMultiSourceWrappers();
            linksWrapper = createLinksWrapperFromList(nextLinks);
            if (linksWrapper) {
              messageContent.appendChild(linksWrapper);
            }
          }

          stickToBottomIfNeeded(shouldStick);
        }

        return {
          container: messageContainer,
          update: updateMessage
        };
      }

      function normalizeAssistantChunk(payload) {
        if (!payload || typeof payload !== "object") {
          return null;
        }

        if (payload.new_message) {
          const { new_message: newMessage } = payload;
          if (!newMessage || typeof newMessage !== "object") {
            return null;
          }

          const conversationId = payload.conversation_id ?? newMessage.conversation_id ?? null;
          const role = newMessage.role || "assistant";
          const content = newMessage.content != null ? newMessage.content : newMessage;

          return { conversationId, role, content };
        }

        if (payload.delta) {
          // Support potential { delta: { content: ... } } envelopes
          return normalizeAssistantChunk(payload.delta);
        }

        if (payload.data) {
          return normalizeAssistantChunk(payload.data);
        }

        const conversationId = payload.conversation_id ?? payload.conversationId ?? null;
        const role = payload.role || (payload.content && payload.content.role) || "assistant";

        if (payload.content != null) {
          return { conversationId, role, content: payload.content };
        }

        if (payload.message != null || payload.links != null || payload.knowledge_links != null) {
          const knowledgeLinks = payload.knowledge_links != null ? payload.knowledge_links : payload.links;
          return {
            conversationId,
            role,
            content: {
              message: payload.message,
              knowledge_links: Array.isArray(knowledgeLinks) ? knowledgeLinks : [],
              links: Array.isArray(knowledgeLinks) ? knowledgeLinks : [],
              support_links: Array.isArray(payload.support_links) ? payload.support_links : []
            }
          };
        }

        return { conversationId, role, content: payload };
      }

      async function sendMessageToAI(userMessage) {
        const typingIndicator = createTypingIndicator();
        let typingRemoved = false;

        function removeTypingIndicator() {
          if (typingRemoved) return;
          typingRemoved = true;
          if (typingIndicator && typeof typingIndicator.remove === "function") {
            typingIndicator.remove();
          }
        }

        try {
          const currentChat = getActiveChat();
          if (!currentChat) {
            removeTypingIndicator();
            return;
          }

          const chatId = currentChat.id;
          let messageHistory = Array.isArray(currentChat.messages) ? [...currentChat.messages] : [];
          let latestConversationId = currentChat.conversation_id || null;
          let assistantMessageData = null;
          let assistantMessageRenderer = null;

          const handleAssistantPayload = payload => {
            const normalized = normalizeAssistantChunk(payload);
            if (!normalized) return;

            latestConversationId = normalized.conversationId ?? latestConversationId ?? null;

            const contentParts = extractMessageContent(normalized.content);
            const nextContent = {
              message: contentParts.text,
              knowledge_links: contentParts.links,
              links: contentParts.links,
              support_links: []
            };

            const shouldStick = isScrolledToBottom(messagesArea);
            removeTypingIndicator();

            if (!assistantMessageData) {
              assistantMessageData = {
                role: normalized.role || "assistant",
                content: nextContent
              };
              messageHistory = [...messageHistory, assistantMessageData];
              assistantMessageRenderer = addMessage(assistantMessageData);
              if (assistantMessageRenderer && typeof assistantMessageRenderer.update === "function") {
                assistantMessageRenderer.update(assistantMessageData, { shouldStick });
              }
            } else {
              assistantMessageData.role = normalized.role || assistantMessageData.role || "assistant";
              assistantMessageData.content = nextContent;
              if (assistantMessageRenderer && typeof assistantMessageRenderer.update === "function") {
                assistantMessageRenderer.update(assistantMessageData, { shouldStick });
              }
            }

            updateChat(chatId, {
              conversation_id: latestConversationId,
              messages: messageHistory
            });
          };

          await sendMessageToMatchi(
            latestConversationId,
            messageHistory,
            {
              onMessage: handleAssistantPayload,
              onDone: () => {
                removeTypingIndicator();
                if (assistantMessageData) {
                  updateSidebar();
                }
              },
              onError: error => {
                console.error("Error streaming message:", error);
              }
            }
          );

          if (!assistantMessageData) {
            removeTypingIndicator();
            addMessage({
              role: "assistant",
              content: {
                message: "Sorry, I'm having trouble responding right now. Please try again.",
                knowledge_links: [],
                links: [],
                support_links: []
              }
            });
          }

        } catch (error) {
          removeTypingIndicator();
          console.error("Error sending message:", error);
          addMessage({
            role: "assistant",
            content: {
              message: "Sorry, I'm having trouble responding right now. Please try again.",
              knowledge_links: [],
              links: [],
              support_links: []
            }
          });
        }
      }

      function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        const userMessage = { role: "user", content: text };
        addMessage(userMessage);
        input.value = "";

        const currentChat = getActiveChat();
        const updatedMessages = [...currentChat.messages, userMessage];
        updateChat(currentChat.id, { messages: updatedMessages });

        updateSidebar();
        sendMessageToAI(text);
      }

      sendBtn.addEventListener("click", handleSend);
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSend();
        }
      });

      setTimeout(() => input.focus(), 0);

      // Close behavior
      function doClose() {
        try {
          document.documentElement.style.overflow = _prevHtmlOverflow || '';
          document.body.style.overflow = _prevBodyOverflow || '';
        } catch (_) {}
        root.remove();
        document.removeEventListener("keydown", handleEscape);
        emit('ai-chat:close');
      }
      closeBtn.addEventListener("click", doClose);
      function handleEscape(e) {
        if (e.key === "Escape") doClose();
      }
      document.addEventListener("keydown", handleEscape);
    }

    // Initialize with search view or active chat
    let activeChat = getActiveChat();
    if (activeChat && activeChat.messages.length > 0) {
      createChatView(null, activeChat);
    } else {
      if (!activeChat) {
        createNewChat();
      }
      const searchView = createSearchView();
      mainContent.appendChild(searchView);
    }

    // Initialize sidebar
    updateSidebar();

    // Compose DOM
    root.appendChild(sidebar);
    root.appendChild(mainContent);
    document.body.appendChild(root);
    emit('ai-chat:open');

    // Focus search input on open
    setTimeout(() => {
      const searchInput = root.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }, 0);
  }

  window.AIChatWidget = { loadCSS, mountChat };
})();
