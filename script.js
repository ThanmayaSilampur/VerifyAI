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
    console.error("Gemini API error:", errText);
    throw new Error(`Gemini API request failed (status ${response.status})`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  // Clean up just in case the model wraps it in ```json fences
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", cleaned);
    throw new Error("Could not parse the analysis. Please try again.");
  }

  // Fill in safe defaults in case any field is missing
  return {
    trustScore: parsed.trustScore ?? 0,
    hallucinationRisk: parsed.hallucinationRisk ?? "Unknown",
    contentType: parsed.contentType ?? "Unknown",
    whyGenerated: parsed.whyGenerated ?? "",
    assumptions: parsed.assumptions ?? [],
    trustedParts: parsed.trustedParts ?? [],
    verifyParts: parsed.verifyParts ?? [],
    missingContext: parsed.missingContext ?? [],
    biases: parsed.biases ?? [],
    alternativeViewpoints: parsed.alternativeViewpoints ?? [],
  };
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
    renderResults(data);
  } catch (err) {
    console.error(err);
    showError(err.message || "Something went wrong while analyzing. Please try again.");
  } finally {
    hideLoading();
  }
});
lucide.createIcons();