// NOVA AI secure backend starter
// Keep your AI provider API key in an environment variable, never in index.html.
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-12) : [];
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service is not configured yet.' });
    }

    // OpenAI-compatible chat completions API. Check your provider's current API docs,
    // model availability, pricing, and age/payment requirements before using.
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are NOVA AI, a friendly personal and business assistant.
Explain things in simple language and guide the user step by step.
Help with technology, programming, AI, Web3, content creation, and realistic business planning.
Be honest about uncertainty. Never promise income or invent facts.
Use a respectful, clear tone. You may use Nigerian English or Nigerian Pidgin if the user does.`
          },
          ...messages.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
        ],
        temperature: 0.7
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('AI provider error:', data);
      return res.status(502).json({ error: 'The AI provider did not accept the request. Check your API setup.' });
    }
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: 'No reply was returned by the AI provider.' });
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`NOVA AI is running on port ${port}`));
      
