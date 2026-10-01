module.exports = (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Clean Agent Serverless API',
    version: '2.0.0',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '')
  });
};
