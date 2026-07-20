const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { message, history = [] } = req.body;
        if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

        const messages = [...history];
        messages.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            id: Math.random().toString(36).substring(2, 10)
        });

        const payload = JSON.stringify({
            messages: messages,
            localTime: new Date().toLocaleString('en-US', {
                month: 'numeric', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
            })
        });

        const result = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'my-honcho.plasticlabs.workers.dev',
                port: 443,
                path: '/api/chat/guest-turn',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const apiReq = https.request(options, (apiRes) => {
                let data = '';
                let fullContent = '';

                apiRes.on('data', (chunk) => {
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

                apiRes.on('end', () => {
                    if (fullContent) resolve(fullContent);
                    else reject(new Error('No response from Honcho'));
                });
            });

            apiReq.on('error', reject);
            apiReq.setTimeout(60000, () => { apiReq.destroy(); reject(new Error('Timeout')); });
            apiReq.write(payload);
            apiReq.end();
        });

        const cleanResult = result.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, '    ').replace(/\\"/g, '"').trim();

        messages.push({
            role: 'assistant',
            content: cleanResult,
            timestamp: new Date().toISOString(),
            id: Math.random().toString(36).substring(2, 10)
        });

        return res.status(200).json({
            success: true,
            author: 'BINTANG',
            creator: 'BINTANG',
            data: {
                model: 'claude-sonnet-4-5-20250929',
                message: message,
                reply: cleanResult,
                messages: messages
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
