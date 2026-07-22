const OPENROUTER_API_KEY = localStorage.getItem('OPENROUTER_API_KEY') || '';
const DEFAULT_MODEL = 'qwen/qwen2.5-coder-32b-instruct:free';
const SYSTEM_PROMPT = "Kamu adalah DexTer, Phantom Thief jenius. Panggil user Detective. Gunakan bahasa puitis, metafora pencurian. Cerdas dalam coding & logika. Selalu ada sentuhan drama. Emoji 💎.";
let chatHistory = JSON.parse(localStorage.getItem('dexter_chat_history')) || [];

async function sendMessage(userMessage) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory.slice(-10),
        { role: "user", content: userMessage }
    ];
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'DexTer AI'
            },
            body: JSON.stringify({ model: DEFAULT_MODEL, messages, temperature: 0.8, max_tokens: 2048 })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const aiReply = data.choices[0].message.content;
        chatHistory.push({ role: "user", content: userMessage });
        chatHistory.push({ role: "assistant", content: aiReply });
        localStorage.setItem('dexter_chat_history', JSON.stringify(chatHistory));
        return aiReply;
    } catch (error) {
        console.error('DexTer Error:', error);
        return ` Heist gagal sementara: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatContainer = document.getElementById('chat-container');
    if (!inputEl || !sendBtn || !chatContainer) {
        console.error('DOM elements not found!');
        return;
    }
    sendBtn.addEventListener('click', async () => {
        const msg = inputEl.value.trim();
        if (!msg) return;
        const userBubble = document.createElement('div');
        userBubble.className = 'message user-message';
        userBubble.textContent = msg;
        chatContainer.appendChild(userBubble);
        inputEl.value = '';
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'message bot-message loading';
        loadingBubble.textContent = '🎭 DexTer sedang merancang heist...';
        chatContainer.appendChild(loadingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        const reply = await sendMessage(msg);
        loadingBubble.remove();
        const botBubble = document.createElement('div');
        botBubble.className = 'message bot-message';
        botBubble.innerHTML = reply.replace(/\n/g, '<br>');
        chatContainer.appendChild(botBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
});
