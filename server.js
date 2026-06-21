require("dotenv").config();

const express = require("express");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.static("."));
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3
          }
        })
      }
    );

    const data = await response.json();

    // Log the full response for debugging
    console.log("📤 Gemini response received:", JSON.stringify(data, null, 2));

    // Check for API errors
    if (data.error) {
      console.error("❌ Gemini API error:", JSON.stringify(data.error, null, 2));
      return res.status(400).json({
        error: `Gemini API error: ${data.error.message}`,
        details: data.error
      });
    }

    if (!response.ok) {
      console.error("❌ API response not OK:", response.status, JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: `API returned status ${response.status}`,
        details: data
      });
    }

    // Check if response is empty - this is the main issue
    if (!data.candidates || data.candidates.length === 0) {
      console.error("❌ Empty candidates array from Gemini");
      return res.status(400).json({
        error: "Gemini returned empty response - try again or verify your API key"
      });
    }

    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error("❌ No content in Gemini response:", JSON.stringify(data.candidates[0], null, 2));
      return res.status(400).json({
        error: "Gemini response has no content"
      });
    }

    console.log("✅ Valid response from Gemini");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Analysis failed: " + err.message
    });
  }
});

app.listen(port, () => {
  console.log("NEW SERVER VERSION LOADED");
  console.log(`http://localhost:${port}`);
});