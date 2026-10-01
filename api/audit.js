const { runAutonomousAudit } = require('../backend/services/auditEngine');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { rows, columns } = req.body || {};
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Requires rows array.' });
    }

    const result = runAutonomousAudit(rows, columns);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
