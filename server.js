// NOVA AI - Gemini secure backend

const express = require('express');
const path = require('path');

const app = express();

app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages.slice(-12)
      : [];

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API is not configured.'
      });
    }

    const contents = messages
      .filter(m =>
        ['user', 'assistant'].includes(m.role) &&
        typeof m.content === 'string'
      )
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are NOVA AI, a friendly personal and business assistant.
Explain things in simple language and guide users step by step.
Help with technology, programming, AI, Web3 and content creation.
Be honest about uncertainty. Never promise income or invent facts.
Use a respectful, clear tone. You may use Nigerian English or Nigerian Pidgin when appropriate.`
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7
          }
        })
      }
    );

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('Gemini error:', data);
      return res.status(502).json({
        error: 'Gemini could not process your request.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('');

    if (!reply) {
      return res.status(502).json({
        error: 'Gemini returned an empty response.'
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Unexpected server error.'
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`NOVA AI is running on port ${port}`);
});
