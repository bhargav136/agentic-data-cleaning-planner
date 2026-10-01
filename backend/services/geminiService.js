/**
 * ==============================================================================
 * CLEAN AGENT - GOOGLE GEMINI AI SEMANTIC AUDITING SERVICE
 * File: backend/services/geminiService.js
 * ==============================================================================
 * This service leverages Google Gemini (Gemini 1.5 Flash / Gemini 3.5 Flash)
 * to perform deep semantic inference, detecting subtle domain-specific errors,
 * contextual spelling mistakes, and implicit schema violations.
 * 
 * It securely reads the API key from:
 * 1. process.env.GEMINI_API_KEY (configured in .env)
 * 2. Or a runtime override provided by the client request
 * ==============================================================================
 */

/**
 * Runs a Gemini semantic audit on a text or tabular sample
 * @param {string} sampleText - Data representation or text snippet
 * @param {string} userApiKey - Optional runtime key override
 * @returns {Promise<Array<Object>>} Structured semantic findings
 */
async function callGeminiSemanticAnalysis(sampleText, userApiKey = null) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in .env and was not provided in the request.',
      findings: []
    };
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const prompt = `You are Clean Agent, a Lead Data Architect and Enterprise Data Quality Specialist.
Examine this sample dataset snippet and identify true data quality anomalies.

Find:
1. Typos, misspelled words, or phonetic corruptions (e.g. 'markting' -> 'Marketing').
2. Inconsistent category representations (e.g. 'US', 'USA', 'United States').
3. Contextual impossibilities or formatting errors.
4. Redundant or duplicate records.

Dataset Sample:
${sampleText.slice(0, 4000)}

Respond ONLY with valid JSON in this exact structure:
[
  {
    "category": "Spelling Mistake" | "Category Inconsistency" | "Syntax Error" | "Semantic Anomaly",
    "original": "exact text from sample",
    "replacement": "corrected text",
    "why": "Clear explanation of the error and correction rationale",
    "severity": "Critical" | "Moderate" | "Low",
    "estimatedLoss": 0.0
  }
]`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Parse JSON safely
    let findings = [];
    try {
      findings = JSON.parse(candidateText);
    } catch (parseErr) {
      // Fallback: extract JSON array substring
      const jsonMatch = candidateText.match(/\[[\s\S]*\]/);
      if (jsonMatch) findings = JSON.parse(jsonMatch[0]);
    }

    return {
      success: true,
      modelUsed: model,
      findings: Array.isArray(findings) ? findings : []
    };
  } catch (error) {
    console.error('[GeminiService] Error during semantic analysis:', error.message);
    return {
      success: false,
      error: error.message,
      findings: []
    };
  }
}

module.exports = {
  callGeminiSemanticAnalysis
};
