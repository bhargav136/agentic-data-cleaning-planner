/**
 * ==============================================================================
 * CLEAN AGENT - DETERMINISTIC STATE TRANSFORMATION ENGINE
 * File: backend/services/cleanerEngine.js
 * ==============================================================================
 * This service implements the deterministic state machine for dataset cleaning.
 * 
 * Invariants:
 * 1. Immutability: originalRows is NEVER mutated.
 * 2. Determinism: given originalRows + acceptedIssueIds, the resulting dataset
 *    is 100% reproducible and reversible.
 * 3. Exact Duplicate Deduplication: Removes subsequent identical records while
 *    preserving the first occurrence.
 * 4. Zero Data Loss Tracking: Incurred information loss is computed accurately.
 * ==============================================================================
 */

/**
 * Recomputes clean dataset rows from original rows and accepted issues
 * @param {Array<Object>} originalRows - Raw unaltered dataset rows
 * @param {Array<Object>} allIssues - Complete issue list from audit
 * @param {Array<number>} acceptedIssueIds - IDs of issues approved by user/agent
 * @returns {Object} Transformed dataset, applied operations, and information loss stats
 */
function applyCleaningPipeline(originalRows = [], allIssues = [], acceptedIssueIds = []) {
  if (!Array.isArray(originalRows)) {
    return { rows: [], appliedCount: 0, totalLoss: 0 };
  }

  // Deep clone baseline rows
  let transformedRows = JSON.parse(JSON.stringify(originalRows));

  const acceptedSet = new Set(acceptedIssueIds);
  const acceptedIssues = allIssues.filter(iss => acceptedSet.has(iss.id));

  // 1. DUPLICATE REMOVAL (Applied first to prune redundant rows)
  const dupIndicesToRemove = new Set();
  acceptedIssues.forEach(iss => {
    if (iss._duplicateRowIndices && Array.isArray(iss._duplicateRowIndices)) {
      iss._duplicateRowIndices.forEach(idx => dupIndicesToRemove.add(idx));
    }
  });

  if (dupIndicesToRemove.size > 0) {
    transformedRows = transformedRows.filter((_, idx) => !dupIndicesToRemove.has(idx));
  }

  // 2. IN-PLACE VALUE TRANSFORMATIONS
  let totalLoss = 0;
  acceptedIssues.forEach(iss => {
    // Skip duplicate issue since it was handled structurally above
    if (iss._duplicateRowIndices && Array.isArray(iss._duplicateRowIndices)) return;
    // Skip statistical outliers to preserve numbers and avoid text corruption
    if (iss.category === 'Statistical Outlier') return;

    totalLoss += parseFloat(iss.estimatedLoss) || 0;
    const target = iss.originalSnippet;
    const replacement = iss.customReplacement || iss.replacementSnippet;
    const col = iss.column;

    transformedRows.forEach(row => {
      // Column-specific transformation
      if (col && col !== 'All Columns' && row[col] !== undefined) {
        applyFieldTransform(row, col, target, replacement, iss.actionType);
      } else {
        // Global cross-column search-and-replace
        Object.keys(row).forEach(c => {
          applyFieldTransform(row, c, target, replacement, iss.actionType);
        });
      }
    });
  });

  return {
    rows: transformedRows,
    originalCount: originalRows.length,
    finalCount: transformedRows.length,
    rowsRemoved: originalRows.length - transformedRows.length,
    appliedFixesCount: acceptedIssues.length,
    totalInformationLoss: parseFloat(totalLoss.toFixed(2))
  };
}

/**
 * Helper to safely mutate a single row field according to the action type
 */
function applyFieldTransform(row, col, target, replacement, actionType) {
  const val = row[col];
  if (val === null || val === undefined) {
    if (target === 'null' || target === null || target === '') {
      row[col] = replacement;
    }
    return;
  }

  const strVal = String(val);

  switch (actionType) {
    case 'trim_whitespace':
      row[col] = strVal.trim().replace(/\s{2,}/g, ' ');
      break;

    case 'replace_ocr':
      if (typeof val === 'string') row[col] = strVal.replace(/O/g, '0');
      break;

    case 'abs_number':
      const n = parseFloat(strVal);
      if (!isNaN(n) && n < 0) row[col] = Math.abs(n);
      break;

    case 'normalize_dots':
      row[col] = strVal.replace(/\.\./g, '.');
      break;

    case 'median_impute':
      if (val === null || strVal === 'null' || strVal === '') {
        row[col] = replacement;
      }
      break;

    case 'null_invalid_numeric':
      const numTest = parseFloat(strVal.replace(/[\$,]/g, ''));
      if (isNaN(numTest) && !/^(null|none|n\/a|blank|undefined|-)$/i.test(strVal)) {
        row[col] = null;
      }
      break;

    case 'correct_spelling':
    default:
      if (target && strVal === String(target)) {
        row[col] = replacement;
      } else if (target && strVal.includes(String(target))) {
        row[col] = strVal.split(String(target)).join(replacement);
      }
      break;
  }
}

module.exports = {
  applyCleaningPipeline
};
