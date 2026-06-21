// ===== Grab DOM elements =====
const responseInput = document.getElementById("responseInput");
const sourceModel = document.getElementById("sourceModel");
const analyzeBtn = document.getElementById("analyzeBtn");

const loadingIndicator = document.getElementById("loadingIndicator");
const errorBox = document.getElementById("errorBox");
const resultsSection = document.getElementById("resultsSection");

const trustScoreValue = document.getElementById("trustScoreValue");
const hallucinationValue = document.getElementById("hallucinationValue");
const contentTypeValue = document.getElementById("contentTypeValue");

const whyOutput = document.getElementById("whyOutput");
const assumptionsOutput = document.getElementById("assumptionsOutput");
const trustedOutput = document.getElementById("trustedOutput");
const verifyOutput = document.getElementById("verifyOutput");
const missingContextOutput = document.getElementById("missingContextOutput");
const biasOutput = document.getElementById("biasOutput");
const altViewOutput = document.getElementById("altViewOutput");

// ===== UI helpers =====
function showLoading() {
  loadingIndicator.classList.remove("hidden");
  errorBox.classList.add("hidden");
  resultsSection.classList.add("hidden");
  analyzeBtn.disabled = true;
}

function hideLoading() {
  loadingIndicator.classList.add("hidden");
  analyzeBtn.disabled = false;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resultsSection.classList.add("hidden");
}

function fillList(ulElement, items) {
  ulElement.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ulElement.appendChild(li);
  });
}

function renderResults(data) {
  trustScoreValue.textContent = data.trustScore + "/100";
  hallucinationValue.textContent = data.hallucinationRisk;
  contentTypeValue.textContent = data.contentType;

  whyOutput.textContent = data.whyGenerated;

  fillList(assumptionsOutput, data.assumptions);
  fillList(trustedOutput, data.trustedParts);
  fillList(verifyOutput, data.verifyParts);
  fillList(missingContextOutput, data.missingContext);
  fillList(biasOutput, data.biases);
  fillList(altViewOutput, data.alternativeViewpoints);

  resultsSection.classList.remove("hidden");
}

// ===== Prompt builder =====
function buildPrompt(text, model) {
  return `You are ResponseXray, an AI response auditor. Analyze the following AI-generated text (it was produced by: ${model}).

Respond with ONLY a valid JSON object — no markdown, no backticks, no extra commentary — matching exactly this schema:

{
  "trustScore": <integer 0-100, overall trustworthiness>,
  "hallucinationRisk": "<Low | Medium | High>",
  "contentType": "<Fact | Opinion | Recommendation | Prediction | Mixed>",
  "whyGenerated": "<1-3 sentences explaining why the AI likely produced this response>",
  "assumptions": ["<assumption 1>", "<assumption 2>", "..."],
  "trustedParts": ["<part that can likely be trusted>", "..."],
  "verifyParts": ["<part that should be fact-checked>", "..."],
  "missingContext": ["<important context the response leaves out>", "..."],
  "biases": ["<potential bias, if any>", "..."],
  "alternativeViewpoints": ["<a viewpoint the response doesn't mention>", "..."]
}

If a category has nothing relevant, return an empty array for it (not null).

TEXT TO ANALYZE:
"""
${text}
"""`;
}

// ===== Real Gemini API call =====
async function analyzeResponse(text, model) {
  const prompt = buildPrompt(text, model);

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Server error:", errText);
    throw new Error(`Server error (status ${response.status}): ${errText}`);
  }

  const data = await response.json();
  
  // Log the full response for debugging
  console.log(" Raw Gemini response:", JSON.stringify(data, null, 2));

  // Check for API errors from the server
  if (data.error) {
    throw new Error(data.error);
  }

  // Extract the text from Gemini's response structure
  let rawText;
  try {
    rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      console.error("❌ Could not find text in response:", JSON.stringify(data, null, 2));
      throw new Error("Gemini returned empty response. Try again or check your API key.");
    }

    console.log(" Raw text from Gemini:", rawText);

    // Clean up just in case the model wraps it in ```json fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    console.log("🧹 Cleaned text:", cleaned);

    // Parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", cleaned);
      console.error("Parse error:", e.message);
      throw new Error("Could not parse the analysis. Response might be invalid JSON.");
    }

    // Validate the response has required fields
    if (!parsed.trustScore && parsed.trustScore !== 0) {
      throw new Error("Response missing trustScore field");
    }

    // Fill in safe defaults for any missing fields
    return {
      trustScore: parsed.trustScore ?? 0,
      hallucinationRisk: parsed.hallucinationRisk ?? "Unknown",
      contentType: parsed.contentType ?? "Unknown",
      whyGenerated: parsed.whyGenerated ?? "Unable to generate explanation",
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      trustedParts: Array.isArray(parsed.trustedParts) ? parsed.trustedParts : [],
      verifyParts: Array.isArray(parsed.verifyParts) ? parsed.verifyParts : [],
      missingContext: Array.isArray(parsed.missingContext) ? parsed.missingContext : [],
      biases: Array.isArray(parsed.biases) ? parsed.biases : [],
      alternativeViewpoints: Array.isArray(parsed.alternativeViewpoints) ? parsed.alternativeViewpoints : [],
    };
  } catch (err) {
    console.error("❌ Error processing response:", err);
    throw err;
  }
}

// ===== Button click handler =====
analyzeBtn.addEventListener("click", async () => {
  const text = responseInput.value.trim();
  const model = sourceModel.value;

  if (!text) {
    showError("Please paste an AI response before analyzing.");
    return;
  }

  showLoading();

  try {
    const data = await analyzeResponse(text, model);
    console.log("Analysis complete:", data);
    renderResults(data);
  } catch (err) {
    console.error("❌ Analysis failed:", err);
    showError(err.message || "Something went wrong while analyzing. Please try again.");
  } finally {
    hideLoading();
  }
});

lucide.createIcons();