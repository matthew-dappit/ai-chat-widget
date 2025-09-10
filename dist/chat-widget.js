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
      `position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:2147483646;display:flex;overflow:hidden;`
    );
    root.id = "ai-chat-root";
    // Prevent page scroll while widget is open — save previous values so we can restore on close
    const _prevHtmlOverflow = document.documentElement.style.overflow;
    const _prevBodyOverflow = document.body.style.overflow;
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    
    // State management
    let currentView = 'search'; // 'search' or 'chat'
    
    // Emit helper
    function emit(name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
    }

    // Create chat history sidebar
    const sidebar = el("div", "");
    sidebar.className = "chat-history-sidebar";
    
    const sidebarTitle = el("div", "", "Chat-Verlauf");
    sidebarTitle.className = "chat-history-title";
    sidebar.appendChild(sidebarTitle);
    
    // Sample chat history items
    const chatHistoryItems = [
      "Kostenlos 500€ not p...",
      "Wie wird meine Provision...",
      "Was ist Robethood überhaupt",
      "Ich kriege 100€, was kriegt..."
    ];
    
    chatHistoryItems.forEach(text => {
      const item = el("button", "");
      item.className = "chat-history-item";
      const itemText = el("span", "", text);
      itemText.className = "chat-history-text";
      item.appendChild(itemText);
      sidebar.appendChild(item);
    });

    // Create main content area
    const mainContent = el("div", "");
    mainContent.className = "main-content";

    // Close button
    const closeBtn = el("button", "", "×");
    closeBtn.className = "chat-close-button";
    closeBtn.id = "ai-chat-close";
    
    // Initial search view
    function createSearchView() {
      const searchContainer = el("div", "");
      searchContainer.className = "search-container";
      
      // Main heading
      const heading = el("h1", "", "Hey, wie kann ich dir helfen?");
      heading.className = "main-heading";
      
      // Search section
      const searchSection = el("div", "");
      searchSection.className = "search-section";
      
      // Search input container
      const searchInputContainer = el("div", "");
      searchInputContainer.className = "search-input-container";
      
      const searchInput = el("input", "");
      searchInput.className = "search-input";
      searchInput.type = "text";
      searchInput.placeholder = "Frag Matchi, was du willst!";
      
      const submitButton = el("button", "");
      submitButton.className = "search-submit-button";
      submitButton.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12L12 5L19 12M12 19V6V19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      
      searchInputContainer.appendChild(searchInput);
      searchInputContainer.appendChild(submitButton);
      
      // FAQ buttons
      const faqContainer = el("div", "");
      faqContainer.className = "faq-container";
      
      const faqQuestions = [
        "Wie wird meine Provision für ausbezahlt?",
        "Was ist Robethood überhaupt",
        "Ich kriege 100€, was kriegt der Mitspieler?",
        "Was ist ein Wettexperte?",
        "Wie viel \"verdient\" ein Wettexperte?"
      ];
      
      faqQuestions.forEach(question => {
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
      
      // Event handlers
      function handleSearch(query) {
        if (!query) query = searchInput.value.trim();
        if (!query) return;
        
        // Transition to chat view
        createChatView(query);
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
    
    // Chat view (simplified for now)
    function createChatView(initialQuery) {
      currentView = 'chat';
      
      // Clear main content
      mainContent.innerHTML = "";
      
      // Create simple chat interface
      const chatContainer = el("div", `flex:1;display:flex;flex-direction:column;padding:20px;`);
      
      const messagesArea = el("div", `flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px;`);
      messagesArea.className = "messages-area";
      
      const inputBar = el("div", `padding:12px;border-top:1px solid #eee;display:flex;gap:8px;`);
      
      const input = el("input", `flex:1;padding:12px 14px;border:1px solid #ddd;border-radius:8px;outline:none;font-size:16px;`);
      input.type = "text";
      input.placeholder = "Type your message...";
      input.value = initialQuery;
      
      const sendBtn = el("button", `padding:12px 16px;border:0;border-radius:8px;background:#375947;color:#fff;font-weight:600;cursor:pointer;`, "Send");
      
      inputBar.appendChild(input);
      inputBar.appendChild(sendBtn);
      
      chatContainer.appendChild(messagesArea);
      chatContainer.appendChild(inputBar);
      
      mainContent.appendChild(chatContainer);
      
      // Add initial message
      if (initialQuery) {
        addMessage("user", initialQuery);
        addMessage("assistant", "Thank you for your question. This is a basic response. The full chat functionality will be implemented next.");
      }
      
      function addMessage(role, content) {
        const messageDiv = el("div", `display:flex;${role === 'user' ? 'justify-content:flex-end' : 'justify-content:flex-start'};`);
        const bubble = el("div", "");
        bubble.className = `message-bubble ${role}`;
        bubble.textContent = content;
        messageDiv.appendChild(bubble);
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
      
      function handleSend() {
        const text = input.value.trim();
        if (!text) return;
        
        addMessage("user", text);
        input.value = "";
        
        // Basic response
        setTimeout(() => {
          addMessage("assistant", "This is a placeholder response. Full AI integration coming soon!");
        }, 500);
      }
      
      sendBtn.addEventListener("click", handleSend);
      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSend();
        }
      });
      
      setTimeout(() => input.focus(), 0);
    }

    // Initialize with search view
    const searchView = createSearchView();
    mainContent.appendChild(searchView);
    
    // Compose DOM
    root.appendChild(sidebar);
    root.appendChild(mainContent);
    root.appendChild(closeBtn);
    document.body.appendChild(root);
    emit('ai-chat:open');

    // Close behavior
    function doClose() {
      // Restore page scroll
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

    // Focus search input on open
    setTimeout(() => {
      const searchInput = root.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }, 0);
  }

  window.AIChatWidget = { loadCSS, mountChat };
})();
