const { callGeminiSemanticAnalysis } = require('../backend/services/geminiService');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { sampleText, apiKey } = req.body || {};
    if (!sampleText) {
      return res.status(400).json({ error: 'Requires sampleText string.' });
    }

    const result = await callGeminiSemanticAnalysis(sampleText, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
