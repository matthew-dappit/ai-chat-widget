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
    } catch (_) {
      // ignore storage write failures
    }
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
    } catch (_) {
      // ignore storage write failures
    }
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
    chats.unshift(chat); // Add to beginning
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
    
    // If the deleted chat was active, set a new active chat
    const activeChat = getActiveChat();
    if (activeChat && activeChat.id === chatId) {
      if (filteredChats.length > 0) {
        setActiveChat(filteredChats[0].id);
      } else {
        // No chats left, create a new one
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
    
    function updateSidebar() {
      // Clear existing content
      sidebar.innerHTML = "";
      
      const sidebarTitle = el("div", "", "Chat-Verlauf");
      sidebarTitle.className = "chat-history-title";
      sidebar.appendChild(sidebarTitle);
      
      // New chat button
      const newChatBtn = el("button", "");
      newChatBtn.className = "chat-history-item new-chat-btn";
      newChatBtn.innerHTML = '<span class="chat-history-text">+ New Chat</span>';
      newChatBtn.addEventListener("click", function() {
        createNewChatHandler();
      });
      sidebar.appendChild(newChatBtn);
      
      // Chat history items from localStorage
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
        
        const deleteButton = el("button", "", "×");
        deleteButton.className = "chat-delete-button";
        deleteButton.title = "Delete chat";
        deleteButton.addEventListener("click", function(e) {
          e.stopPropagation(); // Prevent switching to chat
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
      // Show confirmation dialog
      const confirmed = confirm(`Are you sure you want to delete the chat "${chatTitle}"?`);
      if (!confirmed) return;
      
      const remainingChats = deleteChat(chatId);
      updateSidebar();
      
      // If we deleted the active chat, switch to search or another chat
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
        // No chats left, show search view
        createSearchView();
        currentView = 'search';
      }
    }

    // Create main content area
    const mainContent = el("div", "");
    mainContent.className = "main-content";

    // Close button
    const closeBtn = el("button", "", "×");
    closeBtn.className = "chat-close-button";
    closeBtn.id = "ai-chat-close";
    
    // Initial search view
    function createSearchView() {
      // Clear main content first
      mainContent.innerHTML = "";
      
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
      
      mainContent.appendChild(searchContainer);
      
      // Focus search input on open
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 0);
      
      // Event handlers
      function handleSearch(query) {
        if (!query) query = searchInput.value.trim();
        if (!query) return;
        
        // Create new chat or use existing empty chat
        let activeChat = getActiveChat();
        if (!activeChat || activeChat.messages.length > 0) {
          activeChat = createNewChat();
        }
        
        // Update chat title based on query
        activeChat.title = truncateTitle(query);
        updateChat(activeChat.id, { title: activeChat.title });
        
        updateSidebar();
        // Transition to chat view - let createChatView handle adding the message and sending to AI
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
      
      // Get or create active chat
      let activeChat = chat || getActiveChat();
      if (!activeChat) {
        activeChat = createNewChat(initialQuery);
        updateSidebar();
      }
      
      // Clear main content
      mainContent.innerHTML = "";
      
      // Create chat interface
      const chatContainer = el("div", `flex:1;display:flex;flex-direction:column;padding:20px;`);
      
      const messagesArea = el("div", `flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px;`);
      messagesArea.className = "messages-area";
      
      const inputBar = el("div", `padding:12px;border-top:1px solid #eee;display:flex;gap:8px;`);
      
      const input = el("input", `flex:1;padding:12px 14px;border:1px solid #ddd;border-radius:8px;outline:none;font-size:16px;`);
      input.type = "text";
      input.placeholder = "Type your message...";
      
      const sendBtn = el("button", `padding:12px 16px;border:0;border-radius:8px;background:#375947;color:#fff;font-weight:600;cursor:pointer;`, "Send");
      
      inputBar.appendChild(input);
      inputBar.appendChild(sendBtn);
      
      chatContainer.appendChild(messagesArea);
      chatContainer.appendChild(inputBar);
      
      mainContent.appendChild(chatContainer);
      
      // Load existing messages
      activeChat.messages.forEach(message => {
        addMessage(message.role, message.content);
      });
      
      // If there's an initial query and it's not already in messages, process it
      if (initialQuery && !activeChat.messages.find(m => m.content === initialQuery)) {
        // Add user message to chat
        activeChat.messages.push({ role: "user", content: initialQuery });
        updateChat(activeChat.id, { messages: activeChat.messages });
        
        // Add to UI and send to AI
        addMessage("user", initialQuery);
        sendMessageToAI(initialQuery);
      }
      
      // Create typing indicator
      function createTypingIndicator() {
        const messageDiv = el("div", `display:flex;justify-content:flex-start;`);
        const bubble = el("div", "");
        bubble.className = `message-bubble assistant typing-indicator`;
        bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        messageDiv.appendChild(bubble);
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        return messageDiv;
      }
      
      function addMessage(role, content) {
        const messageDiv = el("div", `display:flex;${role === 'user' ? 'justify-content:flex-end' : 'justify-content:flex-start'};`);
        const bubble = el("div", "");
        bubble.className = `message-bubble ${role}`;
        bubble.innerHTML = markdownToHTML(content);
        messageDiv.appendChild(bubble);
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
      
      async function sendMessageToAI(userMessage) {
        // Show typing indicator
        const typingIndicator = createTypingIndicator();
        
        try {
          // Get current chat state
          const currentChat = getActiveChat();
          const response = await sendMessageToMatchi(
            currentChat.conversation_id, 
            currentChat.messages
          );
          
          // Remove typing indicator
          typingIndicator.remove();
          
          if (response && response.new_message) {
            // Add assistant message to UI
            addMessage("assistant", response.new_message.content);
            
            // Update chat in storage
            const updatedMessages = [...currentChat.messages, response.new_message];
            updateChat(currentChat.id, {
              conversation_id: response.conversation_id,
              messages: updatedMessages
            });
            
            updateSidebar();
          } else {
            // Show error message
            addMessage("assistant", "Sorry, I'm having trouble responding right now. Please try again.");
          }
        } catch (error) {
          // Remove typing indicator
          typingIndicator.remove();
          console.error("Error sending message:", error);
          addMessage("assistant", "Sorry, I'm having trouble responding right now. Please try again.");
        }
      }
      
      function handleSend() {
        const text = input.value.trim();
        if (!text) return;
        
        // Add user message to UI
        addMessage("user", text);
        input.value = "";
        
        // Update chat in storage
        const currentChat = getActiveChat();
        const updatedMessages = [...currentChat.messages, { role: "user", content: text }];
        updateChat(currentChat.id, {
          messages: updatedMessages
        });
        
        updateSidebar();
        
        // Send to AI
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
    }

    // Initialize with search view or active chat
    let activeChat = getActiveChat();
    if (activeChat && activeChat.messages.length > 0) {
      createChatView(null, activeChat);
    } else {
      if (!activeChat) {
        // Create a new empty chat if none exists
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
