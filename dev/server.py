#!/usr/bin/env python3
"""
AI Chat Widget Development Server
Serves the development environment for testing the chat widget.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
DEV_DIR = Path(__file__).parent

class DevServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DEV_DIR), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def main():
    print("🤖 AI Chat Widget Development Server")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), DevServerHandler) as httpd:
            local_url = f"http://localhost:{PORT}"
            
            print(f"✅ Server running at: {local_url}")
            print(f"📁 Serving files from: {DEV_DIR}")
            print(f"🌐 Share this URL with colleagues for testing")
            print(f"🔄 Press Ctrl+C to stop the server")
            print()
            
            # Try to open browser automatically
            try:
                webbrowser.open(local_url)
                print("🚀 Opening browser...")
            except:
                print("💡 Open your browser and navigate to the URL above")
            
            print()
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Have a great day!")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use.")
            print(f"💡 Try a different port or stop the existing server.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
