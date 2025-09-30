# 🤖 AI Chat Widget - Development Environment

This directory contains a local development environment for testing your AI chat widget.

## 🚀 Quick Start

### Option 1: Python Server (Recommended)
```bash
cd dev
python3 server.py
```
The server will automatically open your browser to `http://localhost:8000`

### Option 2: Node.js Server
```bash
cd dev
npx http-server . -p 8000 -o
```

### Option 3: VS Code Live Server
1. Install the "Live Server" extension
2. Right-click on `dev/index.html`
3. Select "Open with Live Server"

## 🌐 Sharing with Colleagues

### Local Network Sharing
1. Start the server with: `python3 server.py`
2. Find your computer's IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
3. Share: `http://YOUR_IP_ADDRESS:8000`

### Online Sharing Options
- **Ngrok**: `ngrok http 8000` (creates public tunnel)
- **Cloudflare Tunnel**: `cloudflared tunnel --url localhost:8000`
- **VS Code Port Forwarding**: Use VS Code's built-in port forwarding

## 🧪 Testing Features

The development environment includes:

- ✅ **Full-screen chat interface**
- ✅ **Version-locked CDN loading** 
- ✅ **Responsive design testing**
- ✅ **Real-time widget updates**
- ✅ **Cross-device compatibility**

## 🔄 Updating Widget Version

To test a new widget version:

1. Update the version in `dev/index.html`:
   ```javascript
  var JS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.5/dist/chat-widget.js";
  var CSS = "https://cdn.jsdelivr.net/gh/matthew-dappit/ai-chat-widget@v0.1.5/dist/chat-widget.css";
   ```

2. Refresh the browser (the CDN will automatically serve the new version)

## 📱 Mobile Testing

Test on mobile devices by:
1. Connecting to the same WiFi network
2. Using your computer's IP address: `http://YOUR_IP:8000`
3. Or using browser dev tools to simulate mobile devices

## 🎯 What to Test

- [ ] Chat button appears in bottom-left
- [ ] Click opens full-screen chat interface
- [ ] Text input field works
- [ ] Close button (×) works
- [ ] ESC key closes chat
- [ ] Interface is responsive on different screen sizes
- [ ] No console errors in browser dev tools
