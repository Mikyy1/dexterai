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
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.resetBtn.addEventListener('click', () => this.resetChat());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
        });
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
            this.autoResize();
        });
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.messageInput.value = btn.getAttribute('data-msg');
                this.updateSendButton();
                this.sendMessage();
            });
        });
        this.messageInput.focus();
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateCharCount() {
        this.charCount.textContent = this.messageInput.value.length + '/2000';
    }

    updateSendButton() {
        this.sendBtn.disabled = this.messageInput.value.trim() === '' || this.isLoading;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        const welcome = this.chatContainer.querySelector('.welcome-message');
        if (welcome) welcome.remove();

        this.addMessage('user', message);
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.messageInput.style.height = 'auto';
        this.showLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, history: this.messages })
            });

            const contentType = response.headers.get('content-type') || '';

            if (!contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error('API tidak tersedia. Response: ' + text.substring(0, 100));
            }

            const result = await response.json();

            if (result.success) {
                this.addMessage('assistant', result.data.reply);
                this.messages = result.data.messages;
            } else {
                this.addMessage('assistant', 'Error: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            this.addMessage('assistant', 'Gagal terhubung ke server: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-' + role;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        messageDiv.appendChild(contentDiv);
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    formatMessage(text) {
        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        return '<p>' + text + '</p>';
    }

    showLoading(show) {
        this.isLoading = show;
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        this.updateSendButton();
    }

    resetChat() {
        if (confirm('Reset semua chat?')) {
            this.messages = [];
            this.chatContainer.innerHTML = '<div class="welcome-message"><div class="welcome-icon">✨</div><h2>Chat Direset!</h2><p>Mulai percakapan baru</p></div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { new DexTerChat(); });
