(function () {
	const STYLE_ID = "ai-chat-widget-css";
	function loadCSS(href) {
		if (document.getElementById(STYLE_ID)) return;
		const l = document.createElement("link");
		l.id = STYLE_ID; l.rel = "stylesheet"; l.href = href;
		document.head.appendChild(l);
	}
	function mountChat(opts) {
		if (document.getElementById("ai-chat-root")) return;
		const root = document.createElement("div");
		root.id = "ai-chat-root";
		root.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: white;
			z-index: 2147483646;
			display: flex;
			flex-direction: column;
		`;
		
		// Header with close button
		const header = document.createElement("div");
		header.style.cssText = `
			padding: 12px 16px;
			border-bottom: 1px solid #eee;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #f8f9fa;
		`;
		header.innerHTML = `
			<span style="font-weight: 600; color: #333;">AI Chat</span>
			<button id="ai-chat-close" style="
				background: none;
				border: none;
				font-size: 18px;
				cursor: pointer;
				padding: 4px;
				color: #666;
			">×</button>
		`;
		
		// Centered search bar area
		const centerArea = document.createElement("div");
		centerArea.style.cssText = `
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			background: white;
		`;
        
		const searchContainer = document.createElement("div");
		searchContainer.style.cssText = `
			width: 100%;
			max-width: 480px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 24px;
		`;
        
		const welcomeText = document.createElement("div");
		welcomeText.textContent = "Welcome! Type a message below to start chatting.";
		welcomeText.style.cssText = `
			color: #666;
			font-size: 18px;
			text-align: center;
		`;
        
		const input = document.createElement("input");
		input.type = "text";
		input.placeholder = "Type your message...";
		input.style.cssText = `
			width: 100%;
			padding: 16px 18px;
			border: 1px solid #ddd;
			border-radius: 8px;
			outline: none;
			box-sizing: border-box;
			font-size: 16px;
		`;
        
		searchContainer.appendChild(welcomeText);
		searchContainer.appendChild(input);
		centerArea.appendChild(searchContainer);
		root.appendChild(header);
		root.appendChild(centerArea);
		document.body.appendChild(root);
		
		// Close button functionality
		document.getElementById("ai-chat-close").addEventListener("click", function() {
			root.remove();
		});
		
		// ESC key to close
		function handleEscape(e) {
			if (e.key === "Escape") {
				root.remove();
				document.removeEventListener("keydown", handleEscape);
			}
		}
		document.addEventListener("keydown", handleEscape);
		
		// Focus the input
		input.focus();
	}
	window.AIChatWidget = { loadCSS, mountChat };
})();
