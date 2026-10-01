/**
 * ==============================================================================
 * CLEAN AGENT - ENTERPRISE BACKEND REST API SERVER
 * File: backend/server.js
 * ==============================================================================
 * Primary entrypoint for the Clean Agent backend.
 * 
 * Features:
 * 1. Express REST API with CORS and JSON body-parser.
 * 2. Dotenv configuration for secure API key loading (.env).
 * 3. Modular services:
 *    - /api/audit: Autonomous statistical and heuristic data profiling
 *    - /api/gemini-audit: Google Gemini 1.5/3.5 Flash semantic reasoning
 *    - /api/clean: Deterministic state recomputation pipeline
 *    - /api/export/csv: Excel-ready UTF-8 BOM CSV generation
 *    - /api/export/report: Governance Markdown report generation
 * 4. Serves static frontend assets for seamless local development.
 * ==============================================================================
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Import Modular Services
const { runAutonomousAudit } = require('./services/auditEngine');
const { callGeminiSemanticAnalysis } = require('./services/geminiService');
const { applyCleaningPipeline } = require('./services/cleanerEngine');
const { generateCleanCsv, generateAuditMarkdownReport } = require('./services/exportEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve frontend static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// ------------------------------------------------------------------------------
// ROUTE: Health & Config Status Check
// ------------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    status: 'ONLINE',
    service: 'Clean Agent Enterprise Backend',
    version: '2.0.0',
    geminiKeyConfigured: hasGeminiKey,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    uptime: process.uptime()
  });
});

// ------------------------------------------------------------------------------
// ROUTE: Autonomous Data Audit
// ------------------------------------------------------------------------------
app.post('/api/audit', (req, res) => {
  try {
    const { rows, columns } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Request body must include an array of "rows".' });
    }

    const auditResult = runAutonomousAudit(rows, columns);
    res.json({ success: true, ...auditResult });
  } catch (error) {
    console.error('[API /api/audit] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------------------------------------------------------------------
// ROUTE: Google Gemini AI Semantic Audit
// ------------------------------------------------------------------------------
app.post('/api/gemini-audit', async (req, res) => {
  try {
    const { sampleText, apiKey } = req.body;
    if (!sampleText) {
      return res.status(400).json({ error: 'Request body must include "sampleText".' });
    }

    const result = await callGeminiSemanticAnalysis(sampleText, apiKey);
    res.json(result);
  } catch (error) {
    console.error('[API /api/gemini-audit] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------------------------------------------------------------------
// ROUTE: Apply Deterministic Cleaning Pipeline
// ------------------------------------------------------------------------------
app.post('/api/clean', (req, res) => {
  try {
    const { originalRows, issues, acceptedIssueIds } = req.body;
    if (!originalRows || !Array.isArray(originalRows)) {
      return res.status(400).json({ error: 'Requires originalRows array.' });
    }

    const result = applyCleaningPipeline(originalRows, issues || [], acceptedIssueIds || []);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[API /api/clean] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------------------------------------------------------------------
// ROUTE: Export Clean CSV
// ------------------------------------------------------------------------------
app.post('/api/export/csv', (req, res) => {
  try {
    const { rows, columns, filename } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Requires rows array.' });
    }

    const csvContent = generateCleanCsv(rows, columns);
    const downloadName = filename || 'Cleaned_Dataset.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('[API /api/export/csv] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------------------------------------------------------------------
// ROUTE: Export Governance Markdown Report
// ------------------------------------------------------------------------------
app.post('/api/export/report', (req, res) => {
  try {
    const { auditResult, datasetName, finalRowCount } = req.body;
    const markdown = generateAuditMarkdownReport(auditResult, datasetName, finalRowCount);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Audit_Report.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('[API /api/export/report] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Clean Agent Enterprise Backend running on port ${PORT}`);
  console.log(`🌐 Local Web UI: http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key configured in .env: ${process.env.GEMINI_API_KEY ? 'YES (Loaded)' : 'NO (Add in .env)'}`);
  console.log('====================================================');
});

module.exports = app;
