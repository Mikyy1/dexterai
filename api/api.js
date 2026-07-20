/**
 * PROJECT      : DexTerAi - Vercel Serverless
 * AUTHOR       : BINTANG
 * CREATOR      : BINTANG
 * DESC         : API endpoint untuk Honcho AI (Claude Sonnet 4)
 */

const https = require('https');

class HonchoChat {
    constructor(messages = []) {
        this.baseURL = 'https://my-honcho.plasticlabs.workers.dev';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        this.messages = messages;
        this.model = 'claude-sonnet-4-5-20250929';
    }

    async chat(message) {
        try {
            this.messages.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                id: this.generateId()
            });

            const payload = {
                messages: this.messages,
                localTime: new Date().toLocaleString('en-US', {
                    month: 'numeric', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: 'numeric', second: 'numeric',
                    hour12: true
                })
            };

            const result = await this.sendRequest(payload);

            this.messages.push({
                role: 'assistant',
                content: result,
                timestamp: new Date().toISOString(),
                id: this.generateId()
            });

            return {
                success: true,
                model: this.model,
                reply: this.cleanText(result),
                messages: this.messages
            };
        } catch (error) {
            throw new Error(error.message || 'Unknown error');
        }
    }

    cleanText(text) {
        if (!text) return '';
        let cleaned = text;
        cleaned = cleaned.replace(/\\n/g, '\n');
        cleaned = cleaned.replace(/\\r/g, '');
        cleaned = cleaned.replace(/\\t/g, '    ');
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/\\'/g, "'");
        return cleaned.trim();
    }

    generateId() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    sendRequest(payload) {
        return new Promise((resolve, reject) => {
            const jsonPayload = JSON.stringify(payload);
            const options = {
                hostname: 'my-honcho.plasticlabs.workers.dev',
                port: 443,
                path: '/api/chat/guest-turn',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(jsonPayload),
                    'User-Agent': this.userAgent
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                let fullContent = '';

                res.on('data', (chunk) => {
                    data += chunk.toString();
                    const lines = data.split('\n');
                    data = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '[DONE]') continue;
                            try {
                                const event = JSON.parse(jsonStr);
                                if (event.type === 'content_block_delta') {
                                    fullContent += event.delta?.text || '';
                                }
                                if (event.type === 'finish') {
                                    resolve(event.outputContent || fullContent);
                                }
                            } catch (e) {}
                        }
                    }
                });

                res.on('end', () => {
                    if (fullContent) resolve(fullContent);
                    else reject(new Error('Tidak ada response dari Honcho'));
                });
            });

            req.on('error', reject);
            req.setTimeout(60000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.write(jsonPayload);
            req.end();
        });
    }
}

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const honcho = new HonchoChat(history);
        const result = await honcho.chat(message);

        return res.status(200).json({
            success: true,
            author: 'BINTANG',
            creator: 'BINTANG',
            data: {
                model: result.model,
                message: message,
                reply: result.reply,
                messages: result.messages
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            author: 'BINTANG',
            creator: 'BINTANG',
            error: error.message || 'Internal server error'
        });
    }
};
