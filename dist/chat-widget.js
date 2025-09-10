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
		
		// Chat area
		const chatArea = document.createElement("div");
		chatArea.style.cssText = `
			flex: 1;
			padding: 16px;
			overflow-y: auto;
			background: white;
		`;
		chatArea.innerHTML = `
			<div style="color: #666; text-align: center; margin-top: 50px;">
				Welcome! Type a message below to start chatting.
			</div>
		`;
		
		// Input area
		const inputArea = document.createElement("div");
		inputArea.style.cssText = `
			padding: 12px 16px;
			border-top: 1px solid #eee;
			background: white;
		`;
		
		const input = document.createElement("input");
		input.type = "text";
		input.placeholder = "Type your message...";
		input.style.cssText = `
			width: 100%;
			padding: 8px 12px;
			border: 1px solid #ddd;
			border-radius: 4px;
			outline: none;
			box-sizing: border-box;
		`;
		
		inputArea.appendChild(input);
		root.appendChild(header);
		root.appendChild(chatArea);
		root.appendChild(inputArea);
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
