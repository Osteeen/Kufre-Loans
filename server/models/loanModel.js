const { query } = require('../config/database');

// ---------------------------------------------------------------------------
// calculateEligibility
// ---------------------------------------------------------------------------

/**
 * Determine a user's loan eligibility based on their history and tier.
 *
 * Tier logic:
 *  - Active loan present → not eligible
 *  - No completed loans   → Tier 1
 *  - 1 completed loan with acceptable repayment history → Tier 2
 *  - 2+ completed loans with perfect history → Tier 3 (progressive)
 *
 * @param {number} userId
 * @returns {Promise<{ eligible: boolean, tier?: number, maxAmount?: number, tierMaxAmount?: number, reason?: string }>}
 */
async function calculateEligibility(userId) {
  // --- 1. Check for active loan ---
  const activeLoanResult = await query(
    `SELECT id FROM loan_applications
     WHERE user_id = $1 AND status IN ('approved', 'disbursed')
     LIMIT 1`,
    [userId]
  );

  if (activeLoanResult.rows.length > 0) {
    return {
      eligible: false,
      reason: 'You have an active loan. Please complete your current loan before applying for a new one.',
    };
  }

  // --- 2. Fetch tenant settings for tier limits ---
  const settingsResult = await query(
    `SELECT ts.tier1_max_amount, ts.tier2_max_amount, ts.tier3_max_amount
     FROM users u
     JOIN tenant_settings ts ON ts.tenant_id = u.tenant_id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  const settings = settingsResult.rows[0] || {
    tier1_max_amount: 50000000,
    tier2_max_amount: 150000000,
    tier3_max_amount: 500000000,
  };

  // --- 3. Count completed loans ---
  const completedLoansResult = await query(
    `SELECT id FROM loan_applications
     WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );

  const completedLoans = completedLoansResult.rows;
  const completedCount = completedLoans.length;

  // --- 4. Tier 1 — no completed loans ---
  if (completedCount === 0) {
    return {
      eligible: true,
      tier: 1,
      maxAmount: Number(settings.tier1_max_amount),
      tierMaxAmount: Number(settings.tier1_max_amount),
    };
  }

  // --- 5. Analyse repayment history for completed loans ---
  const loanIds = completedLoans.map((l) => l.id);
  const repaymentResult = await query(
    `SELECT status FROM repayment_schedule
     WHERE loan_id = ANY($1::int[])`,
    [loanIds]
  );

  const totalRepayments = repaymentResult.rows.length;
  const failedRepayments = repaymentResult.rows.filter((r) =>
    ['failed', 'overdue'].includes(r.status)
  ).length;

  const onTimeRate = totalRepayments > 0 ? (totalRepayments - failedRepayments) / totalRepayments : 1;

  // --- 6. Tier 2 — 1 completed loan, on-time rate >= 80% ---
  if (completedCount === 1) {
    if (onTimeRate >= 0.8) {
      return {
        eligible: true,
        tier: 2,
        maxAmount: Number(settings.tier2_max_amount),
        tierMaxAmount: Number(settings.tier2_max_amount),
      };
    }
    // Completed 1 loan but poor repayment history → stay at Tier 1
    return {
      eligible: true,
      tier: 1,
      maxAmount: Number(settings.tier1_max_amount),
      tierMaxAmount: Number(settings.tier1_max_amount),
    };
  }

  // --- 7. Tier 3 — 2+ completed loans, perfect history ---
  if (completedCount >= 2) {
    if (onTimeRate === 1.0) {
      // Progressive increase: each additional perfect loan adds 10% to the max (capped at tier3_max)
      const progressiveBonus = Math.min(
        completedCount - 2,
        5 // cap at 50% bonus beyond tier3 base
      );
      const progressiveMax = Math.floor(
        Number(settings.tier3_max_amount) * (1 + progressiveBonus * 0.1)
      );
      const cappedMax = Math.min(progressiveMax, Number(settings.tier3_max_amount) * 1.5);

      return {
        eligible: true,
        tier: 3,
        maxAmount: cappedMax,
        tierMaxAmount: Number(settings.tier3_max_amount),
      };
    }

    if (onTimeRate >= 0.8) {
      return {
        eligible: true,
        tier: 2,
        maxAmount: Number(settings.tier2_max_amount),
        tierMaxAmount: Number(settings.tier2_max_amount),
      };
    }

    // 2+ loans but poor history → Tier 1
    return {
      eligible: true,
      tier: 1,
      maxAmount: Number(settings.tier1_max_amount),
      tierMaxAmount: Number(settings.tier1_max_amount),
    };
  }

  // Fallback
  return {
    eligible: true,
    tier: 1,
    maxAmount: Number(settings.tier1_max_amount),
    tierMaxAmount: Number(settings.tier1_max_amount),
  };
}

// ---------------------------------------------------------------------------
// generateRepaymentSchedule
// ---------------------------------------------------------------------------

/**
 * Generate and insert a flat-rate repayment schedule for a loan.
 *
 * Flat interest calculation:
 *   interestPerMonth  = Math.round((approvedAmount * interestRate) / 100)
 *   principalPerMonth = Math.round(approvedAmount / tenorMonths)
 *   totalPerMonth     = principalPerMonth + interestPerMonth
 *   due_date          = disbursedAt + (monthNumber * 30 days)
 *
 * All amounts are in kobo (integers).
 *
 * @param {number} loanId
 * @param {number} approvedAmount  - In kobo
 * @param {number} interestRate    - Percentage per month (e.g. 5 for 5%)
 * @param {number} tenorMonths
 * @param {Date|string} disbursedAt
 * @returns {Promise<Array>} Inserted schedule rows
 */
async function generateRepaymentSchedule(loanId, approvedAmount, interestRate, tenorMonths, disbursedAt) {
  // Delete any existing schedule for this loan (idempotent regeneration)
  await query('DELETE FROM repayment_schedule WHERE loan_id = $1', [loanId]);

  const startDate = disbursedAt instanceof Date ? disbursedAt : new Date(disbursedAt);
  const interestPerMonth = Math.round((approvedAmount * interestRate) / 100);
  const basePrincipalPerMonth = Math.floor(approvedAmount / tenorMonths);

  const rows = [];

  for (let month = 1; month <= tenorMonths; month++) {
    // On the last month, absorb any rounding remainder in the principal
    const isLastMonth = month === tenorMonths;
    const principalAlreadyScheduled = basePrincipalPerMonth * (tenorMonths - 1);
    const principal = isLastMonth
      ? approvedAmount - principalAlreadyScheduled
      : basePrincipalPerMonth;

    const total = principal + interestPerMonth;

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + month * 30);
    const dueDateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const insertResult = await query(
      `INSERT INTO repayment_schedule
         (loan_id, month_number, due_date, principal_amount, interest_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [loanId, month, dueDateStr, principal, interestPerMonth, total]
    );

    rows.push(insertResult.rows[0]);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// updateUserTier
// ---------------------------------------------------------------------------

/**
 * Recalculate and update a user's tier after a loan is completed.
 *
 * @param {number} userId
 * @returns {Promise<number>} The new tier value
 */
async function updateUserTier(userId) {
  const eligibility = await calculateEligibility(userId);
  const newTier = eligibility.tier || 1;

  await query('UPDATE users SET tier = $1 WHERE id = $2', [newTier, userId]);

  return newTier;
}

// ---------------------------------------------------------------------------
// createAuditLog
// ---------------------------------------------------------------------------

/**
 * Insert an audit log entry.
 *
 * @param {number} tenantId
 * @param {number|null} actorId   - The user performing the action (null for system)
 * @param {string} action         - Human-readable action string, e.g. "loan.approved"
 * @param {string} targetType     - e.g. "loan", "user", "settings"
 * @param {number|null} targetId  - ID of the target record
 * @param {Object|null} meta      - Arbitrary JSON metadata
 * @returns {Promise<Object>} The created audit log row
 */
async function createAuditLog(tenantId, actorId, action, targetType, targetId, meta) {
  const result = await query(
    `INSERT INTO audit_logs (tenant_id, actor_id, action, target_type, target_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, actorId || null, action, targetType, targetId || null, meta ? JSON.stringify(meta) : null]
  );
  return result.rows[0];
}

module.exports = {
  calculateEligibility,
  generateRepaymentSchedule,
  updateUserTier,
  createAuditLog,
};
