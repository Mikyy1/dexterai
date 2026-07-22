// ==========================================
// DEXTER AI - PHANTOM THIEF EDITION
// Powered by OpenRouter (No Fallback)
// ==========================================

const OPENROUTER_API_KEY = localStorage.getItem('OPENROUTER_API_KEY') || '';
const DEFAULT_MODEL = 'qwen/qwen2.5-coder-32b-instruct:free';
const FALLBACK_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

// Validasi Ketat: Hapus total fallback ke Puter.js
if (!OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API Key tidak ditemukan!');
    alert('️ API KEY BELUM DIATUR!\n\nDexTer AI membutuhkan OpenRouter API Key untuk berjalan.\n\nCara mengisi:\n1. Buka Inspect Element > Console\n2. Jalankan command:\n   localStorage.setItem("OPENROUTER_API_KEY", "sk-or-v1-APIKEY_KAMU");\n3. Refresh halaman.');
    throw new Error("Missing OpenRouter API Key. Please set it via localStorage.");
}

// Sistem Memory & Personality Phantom Thief
const SYSTEM_PROMPT = `
Kamu adalah DexTer, seorang Phantom Thief jenius dengan kepribadian misterius, elegan, dan sedikit nakal. 
Ciri-cirimu:
- Selalu memanggil user sebagai "Detective" atau "Partner"
- Menggunakan bahasa yang puitis, penuh metafora pencurian harta karun pengetahuan
- Sangat cerdas dalam coding, matematika, dan logika kompleks
- Tidak pernah memberikan jawaban membosankan; selalu ada sentuhan drama pencurian
- Jika ditanya soal coding, berikan kode yang rapi, efisien, dan jelaskan seperti sedang merancang heist plan
- Gunakan emoji 🎭💎 sesekali untuk memperkuat karakter
`;

let chatHistory = JSON.parse(localStorage.getItem('dexter_chat_history')) || [];

// Fungsi kirim pesan ke OpenRouter
async function sendMessage(userMessage) {
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory.slice(-10), // Batasi memory 10 pesan terakhir
        { role: "user", content: userMessage }
    ];

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'DexTer AI Phantom Thief'
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: messages,
                temperature: 0.8,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenRouter API Error');
        }

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        // Simpan ke memory lokal
        chatHistory.push({ role: "user", content: userMessage });
        chatHistory.push({ role: "assistant", content: aiReply });
        localStorage.setItem('dexter_chat_history', JSON.stringify(chatHistory));

        return aiReply;

    } catch (error) {
        console.error('DexTer Error:', error);
        return `🎭 Maaf Detective, heist kali ini gagal sementara. Pesan error: ${error.message}`;
    }
}

// Setup Event Listener untuk tombol kirim
document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.querySelector('#chat-input');
    const sendBtn = document.querySelector('#send-btn');
    const chatContainer = document.querySelector('#chat-container');

    if (inputEl && sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const msg = inputEl.value.trim();
            if (!msg) return;

            // Tampilkan pesan user
            const userBubble = document.createElement('div');
            userBubble.className = 'message user-message';
            userBubble.textContent = msg;
            chatContainer.appendChild(userBubble);
            inputEl.value = '';

            // Tampilkan loading
            const loadingBubble = document.createElement('div');
            loadingBubble.className = 'message bot-message loading';
            loadingBubble.textContent = '🎭 DexTer sedang merancang heist...';
            chatContainer.appendChild(loadingBubble);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Kirim dan tampilkan balasan
            const reply = await sendMessage(msg);
            loadingBubble.remove();

            const botBubble = document.createElement('div');
            botBubble.className = 'message bot-message';
            botBubble.innerHTML = reply.replace(/\n/g, '<br>');
            chatContainer.appendChild(botBubble);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendBtn.click();
        });
    }
});
