Product Specification: Meme-jacker (Demo Edition)
Project Name: Meme-jacker Tech Stack: Node.js (Express), rss-parser (for News), memegen.link (for Image Generation), Vanilla JS (Frontend).

1. Product Goal
   Build a web dashboard that pulls real-time trending news headlines and allows a user to instantly generate a meme that contextually bridges the news headline with their brand's specific niche.

2. Directory Structure
   The project must follow this exact file structure:

Plaintext

/
├── package.json
├── server.js # Handles RSS fetching and meme URL construction
├── samples/ # JSON files containing sample brand profiles
├── outputs/ # JSON files storing history of generated memes
└── public/ # Static frontend files
├── index.html
├── style.css
└── script.js 3. Functional Requirements
A. Backend (server.js)

Trend Watcher (News Source):

Use the rss-parser library.

Fetch "Top Stories" from a public RSS feed (e.g., BBC News or CNN) to get real-time headlines without needing a paid NewsAPI key.

Endpoint: GET /api/trends – Returns a list of top 5 current headlines.

The "Jacker" Engine (Meme Generator):

Endpoint: POST /api/jack

Input: { headline, brandContext, templateId }

Logic:

Take the Headline (e.g., "Gas prices soar to record highs").

Take the Brand Context (e.g., "We sell electric bikes").

Construct a Meme URL: Use the public API memegen.link.

Format: https://api.memegen.link/images/{template}/{top_text}/{bottom_text}.png

Auto-Captioning (Demo Logic):

Top Text: The News Headline (shortened).

Bottom Text: A punchline related to the Brand Context.

Logging:

Save every generated meme details (timestamp, headline, brand, final URL) into a JSON file in the outputs/ folder.

B. Frontend (public/index.html)

Dashboard View:

Left Column: "Trending Now" – A list of live news headlines fetched from the server.

Right Column: "Brand Config" – A simple input box for "What does your brand do?" (e.g., "I sell spicy hot sauce").

Interaction:

User clicks a Headline → It auto-fills a "Selected Trend" box.

User clicks "Jack this Trend" button.

Result:

Display the generated meme image prominently.

Provide a "Download" or "Save" button.

4. Technical Implementation Logic (Pseudocode)
   Use this logic for the backend meme construction:

JavaScript

// server.js
const Parser = require('rss-parser');
const parser = new Parser();

// 1. Fetch News
app.get('/api/trends', async (req, res) => {
try {
// Public RSS feed (No API Key needed)
const feed = await parser.parseURL('http://feeds.bbci.co.uk/news/rss.xml');
const topStories = feed.items.slice(0, 5).map(item => ({
title: item.title,
link: item.link
}));
res.json(topStories);
} catch (error) {
res.status(500).json({ error: "Failed to fetch news" });
}
});

// 2. Generate Meme URL
app.post('/api/jack', (req, res) => {
const { headline, brand } = req.body;

    // In a real production app, an LLM (OpenAI) would write the joke here.
    // For this DEMO, we format the inputs to fit the URL structure.

    // Clean strings for URL (replace spaces with underscores, etc)
    const topText = headline.split(' ').slice(0, 6).join('_'); // First 6 words of news
    const bottomText = `But_${brand.replace(/ /g, '_')}_is_forever`; // Simple punchline

    // Use the 'drake' template or 'disastergirl'
    const memeUrl = `https://api.memegen.link/images/drake/${topText}/${bottomText}.png`;

    res.json({ url: memeUrl });

});
Why this stack?
rss-parser: It is robust and bypasses the need for complex API keys (like NewsAPI/Google Trends) which often block new users or require credit cards.

memegen.link: It is a public, URL-based image generator. You don't need to install heavy image processing libraries (like Canvas/Sharp) or manage assets. You just build a string, and the image exists.

Scalability: If you want to make the jokes "smarter" later, you simply add an OpenAI API call inside the /api/jack route to rewrite the bottomText variable, but the rest of the app stays the same.
