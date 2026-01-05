const express = require("express");
const Parser = require("rss-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const parser = new Parser();

const PORT = 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const Replicate = require("replicate");
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 1. Fetch News
app.get("/api/trends", async (req, res) => {
  try {
    // Public RSS feed (No API Key needed)
    const feed = await parser.parseURL("http://feeds.bbci.co.uk/news/rss.xml");
    console.log(feed);
    const topStories = feed.items.map((item) => ({
      title: item.title,
      link: item.link,
    }));
    res.json(topStories);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// 2. Generate Meme URL
// 2. Generate Meme URL
app.post("/api/jack", async (req, res) => {
  const { headline, brand, aspectRatio, resolution } = req.body;

  if (!headline || !brand) {
    return res
      .status(400)
      .json({ error: "Headline and brand context are required" });
  }

  // 1. Generate Prompt using OpenAI
  let visualPrompt;
  try {
    visualPrompt = await generatePromptText(headline, brand);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate meme prompt" });
  }

  // 2. Generate Meme Image using Replicate
  try {
    const memeUrl = await generateMeme(visualPrompt, aspectRatio, resolution);
    console.log("Generated Meme URL in api", memeUrl);

    res
      .status(200)
      .json({ url: memeUrl, message: "Meme generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate meme image" });
  }
});

const generatePromptText = async (headline, brand) => {
  const systemPrompt = `
    You are a creative meme generator. 
    Your task is to take a news headline and a brand description, and create a visual description for a meme image.
    The meme should be satirical or funny, relating the news headline to the brand in a clever way.
    Return ONLY the visual description for the image generation model.
  `;

  const userPrompt = `
    Headline: "${headline}"
    Brand: "${brand}"
    
    Create a detailed visual description for an image generator (like Midjourney or DALL-E) to create a funny meme image.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 200,
  });

  return response.choices[0].message.content.trim();
};

const generateMeme = async (
  prompt,
  aspectRatio = "16:9",
  resolution = "2048"
) => {
  const dimension = parseInt(resolution);
  const input = {
    size: "4K", // Keeping simple, or could map based on resolution?
    // Docs say 'size' can be 'square_hd', 'square', etc. or just width/height are prioritized.
    // For bytedance/seedream-4.5, let's stick to explicit width/height if supported or standard params.
    // Checking previous code: it sent size: "4K" and width/height.
    // I'll update width/height based on resolution.
    width: dimension,
    height: dimension, // This might distort if not careful?
    // Actually, usually one dimension is fixed or both define the bounding box.
    // Replicate models often take aspect_ratio and just need a rough size.
    // Let's pass the requested aspect_ratio.
    prompt: prompt,
    max_images: 1,
    image_input: [],
    aspect_ratio: aspectRatio,
    sequential_image_generation: "disabled",
  };

  const output = await replicate.run("bytedance/seedream-4.5", { input });
  const result = output[0].url().href;

  return result;
};

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
