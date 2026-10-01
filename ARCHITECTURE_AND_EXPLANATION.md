# 🚀 Clean Agent: Architecture, Backend Modules & Complete Function Guide

> **Official Technical & Architectural Documentation for Final Round Evaluation**  
> **Repository:** [https://github.com/bhargav136/agentic-data-cleaning-planner](https://github.com/bhargav136/agentic-data-cleaning-planner)  
> **Production Live URL:** [https://agenticdatacleaningplanner.vercel.app](https://agenticdatacleaningplanner.vercel.app)

---

## 📑 Table of Contents
1. [Project Overview & Architectural Design](#1-project-overview--architectural-design)
2. [File & Directory Structure (VS Code View)](#2-file--directory-structure-vs-code-view)
3. [Configuration & Environment (.env)](#3-configuration--environment-env)
4. [Backend Server & REST API (`backend/server.js`)](#4-backend-server--rest-api-backendserverjs)
5. [Autonomous Audit Engine (`backend/services/auditEngine.js`)](#5-autonomous-audit-engine-backendservicesauditenginejs)
6. [Google Gemini AI Semantic Service (`backend/services/geminiService.js`)](#6-google-gemini-ai-semantic-service-backendservicesgeminiservicejs)
7. [Deterministic Transformation Engine (`backend/services/cleanerEngine.js`)](#7-deterministic-transformation-engine-backendservicescleanerenginejs)
8. [Multi-Format Export Engine (`backend/services/exportEngine.js`)](#8-multi-format-export-engine-backendservicesexportenginejs)
9. [Frontend Review Interface (`index.html`)](#9-frontend-review-interface-indexhtml)
10. [How to Run & Present in VS Code](#10-how-to-run--present-in-vs-code)
11. [Talking Points & Answers for the Judges](#11-talking-points--answers-for-the-judges)

---

## 1. Project Overview & Architectural Design

**Clean Agent** is an enterprise-grade, loss-aware autonomous data cleaning planner and execution system. Unlike traditional "black-box" data cleaning scripts that silently drop rows or distort statistics, Clean Agent operates on **three strict engineering principles**:

1. **Zero Silent Distortion (Loss-Aware):** Every proposed transformation calculates an estimated information loss metric ($0.0\% - 100\%$) and shows the architectural tradeoff before execution.
2. **Deterministic State Machine & Bi-Directional Rollback:** The raw dataset (`originalRows`) is immutable. Every clean operation can be accepted, dismissed, customized, or undone with zero residue.
3. **Multi-Layered Anomaly Detection:** Combines mathematical statistical fences (IQR outliers), deterministic integrity checks (case-insensitive deduplication, schema validation, OCR typo correction), and generative semantic AI (Google Gemini 1.5/3.5 Flash).

```
                      ┌───────────────────────────────────────┐
                      │          Raw Messy Dataset            │
                      │       (Excel, CSV, Word, PDF)         │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │        Autonomous Audit Engine        │
                      │  - Null/Sparsity Profiler             │
                      │  - Case-Insensitive Deduplication     │
                      │  - IQR Statistical Outliers          │
                      │  - OCR Typo & Lexical Spellcheck      │
                      │  - Adversarial Formula Injection      │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    Gemini AI Semantic Co-Pilot        │
                      │  - Contextual Domain Typo Detection   │
                      │  - Category Normalization             │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │  Interactive Grammarly-Style Split UI │
                      │  - Live Paper Sheet with Highlights   │
                      │  - One-Click Accept / Undo / Custom   │
                      │  - Real-Time Information Loss Gauge   │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    Deterministic Cleaner Engine       │
                      │  - Recomputes state from Accepted Fixes│
                      │  - Exports Excel-Ready UTF-8 BOM CSV  │
                      │  - Generates Great Expectations Specs │
                      └───────────────────────────────────────┘
```

---

## 2. File & Directory Structure (VS Code View)

When you open this folder in **VS Code**, here is the clean, modular layout:

```
agentic-data-cleaning-planner/
│
├── .env                              # 🔑 Environment variables (API keys, ports)
├── .env.example                      # 📄 Template for environment variables
├── .gitignore                        # 🛡️ Prevents pushing .env, node_modules, and cache
├── package.json                      # 📦 Node.js dependencies and run scripts
├── ARCHITECTURE_AND_EXPLANATION.md   # 📖 This complete explanation document
│
├── backend/                          # ⚙️ BACKEND SERVICES & APIS
│   ├── server.js                     # 🌐 Express REST API server entrypoint
│   └── services/
│       ├── auditEngine.js            # 🧮 Statistical & heuristic anomaly detector
│       ├── geminiService.js          # 🤖 Google Gemini 1.5/3.5 Flash AI integration
│       ├── cleanerEngine.js          # 🔄 Deterministic state machine & undo pipeline
│       └── exportEngine.js           # 💾 UTF-8 BOM CSV, JSON plan & Markdown reporter
│
├── api/                              # ☁️ VERCEL SERVERLESS ENDPOINTS
│   ├── health.js                     # Health check serverless lambda
│   ├── audit.js                      # Serverless audit engine trigger
│   └── gemini.js                     # Serverless Gemini semantic trigger
│
├── clean_agent_symbol.png            # 🎨 Modern Clean Agent logo emblem
└── index.html                        # 🖥️ Interactive frontend interface
```

---

## 3. Configuration & Environment (`.env`)

### `.env` File
This file stores your sensitive secrets securely. It is ignored by Git to prevent leaks.

```env
# Port for the Node.js Express backend server
PORT=5000

# Google Gemini API Key for Semantic AI Auditing
GEMINI_API_KEY=your_gemini_api_key_here

# Model identifier
GEMINI_MODEL=gemini-1.5-flash

# Environment mode
NODE_ENV=development
```

### Why this matters to the judges:
- **Enterprise Security:** API keys are never hardcoded in source code or sent to client-side bundles.
- **Configurability:** Port, model name, and environment are fully externalized via standard `process.env`.

---

## 4. Backend Server & REST API (`backend/server.js`)

`backend/server.js` initializes an Express HTTP server with JSON body-parsing and CORS enabled.

### Key Blocks & Functions:

1. **`app.get('/api/health')`**
   - **Purpose:** Health check endpoint for uptime and service monitoring.
   - **Returns:** `{ status: 'ONLINE', version: '2.0.0', geminiKeyConfigured: true/false, uptime: ... }`.

2. **`app.post('/api/audit')`**
   - **Purpose:** Receives `{ rows, columns }` and runs the complete autonomous audit engine on the server.
   - **Returns:** Full profile, semantic rules, issues array, Great Expectations test contract, and quality scores.

3. **`app.post('/api/gemini-audit')`**
   - **Purpose:** Receives `{ sampleText, apiKey }` and triggers Google Gemini AI semantic analysis using `.env` key.
   - **Returns:** Structured JSON anomalies with category, proposed replacement, and rationale.

4. **`app.post('/api/clean')`**
   - **Purpose:** Applies approved transformations to original rows deterministically.
   - **Returns:** Transformed rows, number of rows removed, applied fixes count, and total information loss.

5. **`app.post('/api/export/csv')`**
   - **Purpose:** Converts rows into an Excel-ready UTF-8 BOM encoded CSV stream for download.

6. **`app.post('/api/export/report')`**
   - **Purpose:** Compiles a full audit and governance Markdown report ready for compliance teams.

---

## 5. Autonomous Audit Engine (`backend/services/auditEngine.js`)

This service contains the core intelligence for discovering data defects without human prompting.

### Key Blocks & Functions:

#### 1. `COMMON_TYPOS_MAP` (Lexical Knowledge Base)
A high-frequency enterprise dictionary mapping common clerical typos to their canonical forms (e.g. `"enginering"` $\rightarrow$ `"Engineering"`, `"markting"` $\rightarrow$ `"Marketing"`, `"fianance"` $\rightarrow$ `"Finance"`).

#### 2. `runAutonomousAudit(rows, cols, options)`
The main execution pipeline. Takes in dataset rows and columns and executes:

* **Column Profile & Null/Sparsity Analysis:**
  Computes null count, sparsity percentage, unique value cardinality, and min/max/average for numerical columns.
* **Interquartile Range (IQR) Outlier Detection:**
  Sorts all numerical values in column $C$ to find $Q1$ (25th percentile) and $Q3$ (75th percentile).
  $$\text{IQR} = Q3 - Q1$$
  $$\text{Lower Fence} = Q1 - 1.5 \times \text{IQR}$$
  $$\text{Upper Fence} = Q3 + 1.5 \times \text{IQR}$$
  Any row where value falls outside $[\text{Lower Fence}, \text{Upper Fence}]$ is flagged as a `Statistical Outlier`.
* **Mixed-Type Detection (Type Mismatch):**
  Identifies text strings mistakenly placed inside numerical columns (e.g. `"N/A"` or `"pending"` in a Salary column). Flagged as `Critical` because text causes `SUM` or `AVG` database functions to fail.
* **Case-Insensitive & Trimmed Duplicate Row Detection:**
  Builds a signature for each row:
  $$\text{sig} = \text{col}_1.\text{trim}().\text{toLowerCase}() + \text{"|||"} + \text{col}_2.\text{trim}().\text{toLowerCase}() \dots$$
  Identifies duplicates even if one row has `"John Doe "` and another has `"john doe"`. Flags subsequent duplicate rows for safe removal while preserving the first instance.
* **Optical Character Recognition (OCR) Typo Detection:**
  Identifies numeric figures where the capital letter `'O'` was substituted for digit `'0'` during scanning (e.g. `"$75,OOO"` $\rightarrow$ `"$75,000"`).
* **Hard Invariant Breach:**
  Enforces biological boundaries (e.g., $\text{Age} \ge 0$). Converts negative typo ages (like $-4$) into their absolute value ($4$) with full audit evidence.
* **RFC-5322 Email Syntax Normalization:**
  Catches double dots (`"..com"` $\rightarrow$ `".com"`) and invalid syntax.
* **Top-to-Bottom Ordering:**
  Sorts all detected anomalies strictly by their row position so the user reviews the dataset sequentially from top to bottom.

---

## 6. Google Gemini AI Semantic Service (`backend/services/geminiService.js`)

Handles agentic communication with Google's Gemini models.

### Key Function:
#### `callGeminiSemanticAnalysis(sampleText, userApiKey)`
- **Mechanism:**
  - Safely loads `process.env.GEMINI_API_KEY`.
  - Constructs a temperature-controlled prompt ($T=0.1$) with structured schema forcing JSON MIME output (`responseMimeType: "application/json"`).
  - Sends up to 15,000 characters of data context to Gemini.
  - Automatically parses the response into actionable anomaly objects with proposed replacements and confidence scores.
- **Fail-Safe Fallback:** If the API key is not supplied or network fails, the backend seamlessly falls back to the deterministic local pattern engine with zero crash.

---

## 7. Deterministic Transformation Engine (`backend/services/cleanerEngine.js`)

Controls how modifications are applied and reversed.

### Key Invariants & Functions:

#### `applyCleaningPipeline(originalRows, allIssues, acceptedIssueIds)`
- **Immutability Guarantee:** Clones `originalRows` using `JSON.parse(JSON.stringify(originalRows))` so the raw data is never mutated.
- **Step 1: Structural Deduplication:**
  Filters out row indices listed in `iss._duplicateRowIndices` for accepted duplicate issues.
- **Step 2: In-Place Transformations:**
  Iterates over accepted issues and invokes `applyFieldTransform` on the remaining rows.
- **Step 3: Information Loss Calculation:**
  Sums the estimated loss of accepted operations:
  $$\text{Total Loss} = \sum_{i \in \text{Accepted}} \text{EstimatedLoss}_i$$
- **Step 4: Returns Cleaned State:**
  Returns `{ rows, finalCount, rowsRemoved, appliedFixesCount, totalInformationLoss }`.

---

## 8. Multi-Format Export Engine (`backend/services/exportEngine.js`)

Formats the cleaned data for external systems.

### Key Functions:

#### 1. `generateCleanCsv(rows, columns)`
- Serializes rows into RFC-4180 compliant CSV.
- Quotes fields containing commas, line breaks, or quotation marks.
- **Prepends UTF-8 Byte Order Mark (`\uFEFF`):** Ensures that Microsoft Excel automatically recognizes international characters, accents, and currency symbols without display corruption.

#### 2. `generateAuditMarkdownReport(auditResult, datasetName, finalRowCount)`
- Builds an enterprise governance report including:
  - Executive summary and strategy tradeoffs
  - Full catalog of every identified issue with architectural rationale
  - Great Expectations automated validation test results

---

## 9. Frontend Review Interface (`index.html`)

A modern responsive web client with a Grammarly-inspired split-view workspace.

### Key Blocks & UI Components:

1. **Stackable Liquid Glass Background:** Light frosted-glass backdrop with CSS keyframe floating animations.
2. **Grammarly Split Workspace:**
   - **Left Panel (Paper Sheet Canvas):** Renders the document or tabular data with interactive wavy underlines for detected issues (Critical in rose, Warnings in amber, Cleaned in emerald).
   - **Right Panel (Assistant Feed):** Interactive cards displaying What, Why, Audit Evidence, and Reversibility.
3. **Bottom-Right Fullscreen Toggle (`⛶`):**
   - Click the `⛶` button at the bottom-right corner of the data view to expand it into a high-visibility, distraction-free fullscreen overlay. Press `✕` or `Escape` to exit.
4. **Interactive Anomaly Highlighting in Spreadsheet View:**
   - Red cell = Null/Missing value
   - Amber row (`⚠`) = Duplicate row
   - Orange cell = Statistical outlier (IQR)
5. **Bi-directional Undo / Rollback Engine:**
   - Click "Accept" $\rightarrow$ issue fix is applied in real-time.
   - Click "Undo" $\rightarrow$ issue reverts cleanly to pending state and table recalculates deterministically.
   - Click "Rollback Entire Pipeline" $\rightarrow$ resets dataset to raw uploaded baseline.

---

## 10. How to Run & Present in VS Code

### Step 1: Open the Project in VS Code
Launch VS Code in the project directory:
```bash
code "C:\Users\Bhargav sai vanama\.gemini\antigravity\scratch\agentic_data_cleaning_planner"
```

### Step 2: Configure `.env`
Open the `.env` file in VS Code and add your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
NODE_ENV=development
```

### Step 3: Install Dependencies
Open the VS Code integrated terminal (`Ctrl + \``) and run:
```bash
npm install
```

### Step 4: Start the Backend Server
Run:
```bash
npm start
```
You will see:
```
====================================================
🚀 Clean Agent Enterprise Backend running on port 5000
🌐 Local Web UI: http://localhost:5000
🔑 Gemini API Key configured in .env: YES (Loaded)
====================================================
```

### Step 5: Test the Application
Open your browser to:
[http://localhost:5000](http://localhost:5000)

Upload an Excel (`.xlsx`), CSV (`.csv`), or Word document (`.docx`) and watch Clean Agent autonomously profile, detect anomalies, and present a lossless cleaning plan!

---

## 11. Talking Points & Answers for the Judges

### Q1: "How does Clean Agent detect duplicate records when dirty data has typos or spacing?"
> *"Our duplicate detection engine builds normalized signatures by trimming leading/trailing whitespace and lowercasing all field values. For example, `'John Doe '` and `'john doe'` produce the identical signature `'john doe'`, allowing Clean Agent to catch duplicates that standard database exact matches miss, while preserving the first instance."*

### Q2: "How do you detect outliers without assuming normal distribution?"
> *"We implement the non-parametric Interquartile Range (IQR) method. By computing the 25th percentile ($Q1$) and 75th percentile ($Q3$), we calculate the IQR and define strict fences at $Q1 - 1.5 \times \text{IQR}$ and $Q3 + 1.5 \times \text{IQR}$. Any data point beyond these fences is flagged as a statistical outlier for human review rather than being silently dropped."*

### Q3: "What makes your pipeline safe against information loss?"
> *"Traditional cleaning tools automatically drop rows with nulls or outliers, which can destroy 5% to 20% of dataset variance. Clean Agent treats row removal as a last resort. We track estimated information loss on every single step, recommend median imputation when loss is $<0.5\%$, and provide a 100% reversible state machine with instant undo capability."*

### Q4: "Where are the backend files organized?"
> *"The backend is modularized under `/backend` with clean separation of concerns: `server.js` hosts the Express API, `auditEngine.js` performs mathematical & heuristic profiling, `geminiService.js` manages LLM semantic reasoning, `cleanerEngine.js` governs deterministic transformations, and `exportEngine.js` handles UTF-8 BOM CSV and Markdown report generation."*

---
*Built for the Enterprise Data Engineering & AI Hackathon Final Round.*
