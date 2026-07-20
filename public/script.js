/**
 * PROJECT      : DexTerAi - Frontend Logic
 * AUTHOR       : BINTANG
 */

class DexTerChat {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.charCount = document.getElementById('charCount');
        
        this.messages = [];
        this.isLoading = false;

        this.init();
    }

    init() {
        // Event listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.resetBtn.addEventListener('click', () => this.resetChat());
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
            this.autoResize();
        });

        // Suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-msg');
                this.messageInput.value = message;
                this.updateSendButton();
                this.sendMessage();
            });
        });

        // Focus input on load
        this.messageInput.focus();
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = `${count}/2000`;
    }

    updateSendButton() {
        this.sendBtn.disabled = this.messageInput.value.trim() === '' || this.isLoading;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        // Remove welcome message if exists
        const welcome = this.chatContainer.querySelector('.welcome-message');
        if (welcome) {
            welcome.remove();
        }

        // Add user message to UI
        this.addMessage('user', message);

        // Clear input
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.messageInput.style.height = 'auto';

        // Show loading
        this.showLoading(true);

        try {
            // Send to API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.messages
                })
            });

            const result = await response.json();

            if (result.success) {
                // Add assistant message
                this.addMessage('assistant', result.data.reply);
                
                // Update message history
                this.messages = result.data.messages;
            } else {
                this.addMessage('assistant', `❌ Error: ${result.error || 'Unknown error'}`);
            }

        } catch (error) {
            this.addMessage('assistant', `❌ Error: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Format content (basic markdown support)
        const formattedContent = this.formatMessage(content);
        contentDiv.innerHTML = formattedContent;

        messageDiv.appendChild(contentDiv);
        this.chatContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    formatMessage(text) {
        // Convert code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        if (!text.includes('<pre>') && !text.includes('<code>')) {
            text = `<p>${text}</p>`;
        }
        
        return text;
    }

    showLoading(show) {
        this.isLoading = show;
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        this.updateSendButton();
    }

    resetChat() {
        if (confirm('Apakah Anda yakin ingin mereset chat?')) {
            this.messages = [];
            this.chatContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">✨</div>
                    <h2>Chat Direset!</h2>
                    <p>Mulai percakapan baru</p>
                    <div class="suggestions">
                        <button class="suggestion-btn" data-msg="Jelaskan tentang quantum computing">
                            💡 Jelaskan quantum computing
                        </button>
                        <button class="suggestion-btn" data-msg="Buatkan kode Python untuk web scraping">
                            💻 Bantu coding Python
                        </button>
                        <button class="suggestion-btn" data-msg="Tulis puisi tentang teknologi">
                            ✍️ Tulis puisi
                        </button>
                    </div>
                </div>
            `;

            // Re-attach suggestion listeners
            this.chatContainer.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const message = btn.getAttribute('data-msg');
                    this.messageInput.value = message;
                    this.updateSendButton();
                    this.sendMessage();
                });
            });
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new DexTerChat();
});
