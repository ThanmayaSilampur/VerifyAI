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
            temperature: 0.3,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Analysis failed"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});