(function () {
  const STYLE_ID = "ai-chat-widget-css";
  const CHATS_STORAGE_KEY = "ai-chat.chats"; // stores array of chat objects
  const ACTIVE_CHAT_KEY = "ai-chat.activeChat"; // stores active chat id

  // API Configuration
  const API_ENDPOINT = "https://api.robethood.net/api:zwntye2i/ai_chats/website/matchi";
  const API_KEY = "KlUKmJF7-VsDg-4s7J-8Y9Q-JSybzsF3HW1YyfuPhUlGPI9qGuIdJAKwp-i5rJsH4nTjMMvjcnSmZ1ZS7euU2-xCcmm2Z5YtkN6bg2ADteKngs2-n-B1m4TestjpFO9cUmtnCig2lLxNFBMCz8cTTe1rj6F9dPPL1GK3ozXNV3_D_LMYFtZY6SIFNEmYOBAK3P8";

  function loadCSS(href) {
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
      title: initialMessage ? truncateTitle(initialMessage) : "New Chat",
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

  // API function to send message to Matchi
  async function sendMessageToMatchi(conversationId, messageHistory) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${API_KEY}`
        },
        body: JSON.stringify({
          'conversation_id': conversationId,
          'messages': messageHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Error communicating with the AI chatbot:", error);
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

    function emit(name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch (_) {}
    }

    // Sidebar
    const sidebar = el("div", "");
    sidebar.className = "chat-history-sidebar";

    function updateSidebar() {
      sidebar.innerHTML = "";

      const sidebarTitle = el("div", "", "Chat-Verlauf");
      sidebarTitle.className = "chat-history-title";
      sidebar.appendChild(sidebarTitle);

      const newChatBtn = el("button", "");
      newChatBtn.className = "chat-history-item";
      newChatBtn.innerHTML = '<span class="chat-history-text">New Chat</span>';
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
        deleteButton.title = "Delete chat";
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
      const confirmed = confirm(`Are you sure you want to delete the chat "${chatTitle}"?`);
      if (!confirmed) return;

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

    // Main content column
    const mainContent = el("div", "");
    mainContent.className = "main-content";

    // Search view
    function createSearchView() {
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
  root.appendChild(closeBtn);

      const heading = el("h1", "", "Hey, wie kann ich dir helfen?");
      heading.className = "main-heading";

      const searchSection = el("div", "");
      searchSection.className = "search-section";

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

      const headerAvatar = el("div", "");
      headerAvatar.className = "chat-header-avatar";
      headerAvatar.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#375947"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="16">M</text>
      </svg>`;

      const headerInfo = el("div", "");
      headerInfo.className = "chat-header-info";

      const headerTitle = el("h3", "", "Matchi");
      headerTitle.className = "chat-header-title";

      const headerSubtitle = el("p", "", "AI Support Assistant");
      headerSubtitle.className = "chat-header-subtitle";

      headerInfo.appendChild(headerTitle);
      headerInfo.appendChild(headerSubtitle);
      headerProfile.appendChild(headerAvatar);
      headerProfile.appendChild(headerInfo);

      // Spacer + Close button inside header
      const headerSpacer = el("div", "");
      headerSpacer.className = "chat-header-spacer";

      const closeBtn = el("button", "");
      closeBtn.className = "chat-close-button leave-chat-button";
      closeBtn.id = "ai-chat-close";
      closeBtn.setAttribute("aria-label", "Close chat");
      closeBtn.innerHTML = "Leave Chat";

      chatHeader.appendChild(headerProfile);
      chatHeader.appendChild(headerSpacer);
      chatHeader.appendChild(closeBtn);

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
      input.placeholder = "Schreibe deine Nachricht...";

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

      // Load existing messages
      activeChat.messages.forEach(message => {
        addMessage(message.role, message.content);
      });

      if (initialQuery && !activeChat.messages.find(m => m.content === initialQuery)) {
        activeChat.messages.push({ role: "user", content: initialQuery });
        updateChat(activeChat.id, { messages: activeChat.messages });

        addMessage("user", initialQuery);
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
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return messageContainer;
      }

      function addMessage(role, content) {
        const messageContainer = el("div", "");
        messageContainer.className = `message-container ${role}`;

        const messageContent = el("div", "");
        messageContent.className = "message-content";

        const bubble = el("div", "");
        bubble.className = `message-bubble ${role}`;
        bubble.innerHTML = markdownToHTML(content);

        messageContent.appendChild(bubble);
        messageContainer.appendChild(messageContent);

        messagesArea.appendChild(messageContainer);
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }

      async function sendMessageToAI(userMessage) {
        const typingIndicator = createTypingIndicator();

        try {
          const currentChat = getActiveChat();
          const response = await sendMessageToMatchi(
            currentChat.conversation_id,
            currentChat.messages
          );

          typingIndicator.remove();

          if (response && response.new_message) {
            addMessage("assistant", response.new_message.content);

            const updatedMessages = [...currentChat.messages, response.new_message];
            updateChat(currentChat.id, {
              conversation_id: response.conversation_id,
              messages: updatedMessages
            });

            updateSidebar();
          } else {
            addMessage("assistant", "Sorry, I'm having trouble responding right now. Please try again.");
          }
        } catch (error) {
          typingIndicator.remove();
          console.error("Error sending message:", error);
          addMessage("assistant", "Sorry, I'm having trouble responding right now. Please try again.");
        }
      }

      function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        addMessage("user", text);
        input.value = "";

        const currentChat = getActiveChat();
        const updatedMessages = [...currentChat.messages, { role: "user", content: text }];
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
