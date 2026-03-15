const cron = require('node-cron');
const { query } = require('../config/database');
const bankAPI = require('../config/bankAPI');
const emailService = require('../config/emailService');
const { createAuditLog, updateUserTier } = require('../models/loanModel');

/**
 * REPAYMENT ENGINE
 *
 * Runs daily at 08:00 AM server time.
 *
 * Responsibilities:
 *  1. Debit customers for all repayments due today.
 *  2. Mark failed debit attempts as 'failed'.
 *  3. Mark past-due pending repayments as 'overdue'.
 *  4. Complete loans where all repayments are paid.
 *  5. Upgrade customer tier after loan completion.
 */

const CORPORATE_ACCOUNT = process.env.CORPORATE_ACCOUNT_NUMBER || '0000000000';
const SYSTEM_TENANT_ID = 1;

// ---------------------------------------------------------------------------
// runRepaymentEngine
// ---------------------------------------------------------------------------

async function runRepaymentEngine() {
  console.log(`[RepaymentEngine] Starting run at ${new Date().toISOString()}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // -----------------------------------------------------------------------
    // STEP 1: Mark past-due (strictly before today) pending repayments as overdue
    // -----------------------------------------------------------------------
    const overdueResult = await query(
      `UPDATE repayment_schedule
       SET status = 'overdue'
       WHERE status = 'pending' AND due_date < $1
       RETURNING id, loan_id`,
      [todayStr]
    );

    if (overdueResult.rows.length > 0) {
      console.log(`[RepaymentEngine] Marked ${overdueResult.rows.length} repayments as overdue.`);
    }

    // -----------------------------------------------------------------------
    // STEP 2: Find all repayments due today (pending or overdue, due_date <= today)
    // -----------------------------------------------------------------------
    const dueRepayments = await query(
      `SELECT rs.*,
              la.tenor_months,
              la.tenant_id,
              u.id          AS user_id,
              u.first_name,
              u.last_name,
              u.email,
              u.account_number
       FROM repayment_schedule rs
       JOIN loan_applications la ON la.id = rs.loan_id
       JOIN users u              ON u.id  = la.user_id
       WHERE rs.status IN ('pending','overdue')
         AND rs.due_date <= $1`,
      [todayStr]
    );

    console.log(`[RepaymentEngine] Processing ${dueRepayments.rows.length} due repayment(s).`);

    const processedLoanIds = new Set();

    for (const repayment of dueRepayments.rows) {
      await processRepayment(repayment);
      processedLoanIds.add(repayment.loan_id);
    }

    // -----------------------------------------------------------------------
    // STEP 3: After processing, check if any loans are now fully paid
    // -----------------------------------------------------------------------
    for (const loanId of processedLoanIds) {
      await checkLoanCompletion(loanId);
    }

    console.log(`[RepaymentEngine] Run complete at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[RepaymentEngine] Fatal error during run:', err.message);
  }
}

// ---------------------------------------------------------------------------
// processRepayment
// ---------------------------------------------------------------------------

async function processRepayment(repayment) {
  const {
    id: repaymentId,
    loan_id: loanId,
    month_number: monthNumber,
    principal_amount: principalAmount,
    interest_amount: interestAmount,
    total_amount: totalAmount,
    tenant_id: tenantId,
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email,
    account_number: accountNumber,
  } = repayment;

  const userInfo = { id: userId, first_name: firstName, last_name: lastName, email, account_number: accountNumber };

  console.log(
    `[RepaymentEngine] Processing repayment #${repaymentId} — Loan #${loanId} Month ${monthNumber} — User: ${email}`
  );

  if (!accountNumber) {
    console.warn(`[RepaymentEngine] Skipping repayment #${repaymentId}: user has no account number.`);
    await markRepaymentFailed(repaymentId, loanId, monthNumber, tenantId, userId, repayment, userInfo);
    return;
  }

  let principalDebitSuccess = false;
  let interestDebitSuccess = false;
  let principalRef = null;
  let interestRef = null;

  // --- Debit principal ---
  try {
    const principalResult = await bankAPI.debitAccount(
      accountNumber,
      Number(principalAmount),
      `Month ${monthNumber} Principal Repayment — Loan #${loanId}`
    );
    if (principalResult.status === 'success') {
      principalDebitSuccess = true;
      principalRef = principalResult.transactionRef;
    }
  } catch (err) {
    console.error(
      `[RepaymentEngine] Principal debit failed for repayment #${repaymentId}:`,
      err.message
    );
  }

  // --- Debit interest ---
  try {
    const interestResult = await bankAPI.debitAccount(
      accountNumber,
      Number(interestAmount),
      `Month ${monthNumber} Interest Repayment — Loan #${loanId}`
    );
    if (interestResult.status === 'success') {
      interestDebitSuccess = true;
      interestRef = interestResult.transactionRef;
    }
  } catch (err) {
    console.error(
      `[RepaymentEngine] Interest debit failed for repayment #${repaymentId}:`,
      err.message
    );
  }

  const allDebitsSuccessful = principalDebitSuccess && interestDebitSuccess;

  if (allDebitsSuccessful) {
    // --- Credit corporate account ---
    let corporateCreditRef = null;
    try {
      const creditResult = await bankAPI.creditAccount(
        CORPORATE_ACCOUNT,
        Number(totalAmount),
        `Loan Repayment — Loan #${loanId} Month ${monthNumber}`
      );
      corporateCreditRef = creditResult.transactionRef;
    } catch (err) {
      console.error(
        `[RepaymentEngine] Corporate credit failed for repayment #${repaymentId}:`,
        err.message
      );
      // Non-fatal: principal and interest already debited; log for manual reconciliation
    }

    // Mark repayment as paid
    await query(
      `UPDATE repayment_schedule SET status = 'paid', paid_at = NOW() WHERE id = $1`,
      [repaymentId]
    );

    // Audit log
    await createAuditLog(tenantId, null, 'repayment.paid', 'repayment_schedule', repaymentId, {
      loan_id: loanId,
      month_number: monthNumber,
      principal_ref: principalRef,
      interest_ref: interestRef,
      corporate_ref: corporateCreditRef,
    });

    // Fetch full loan for email context
    const loanResult = await query('SELECT * FROM loan_applications WHERE id = $1', [loanId]);
    const loan = loanResult.rows[0];

    // Send success email
    emailService.sendRepaymentSuccessful(userInfo, repayment, loan).catch(console.error);

    console.log(
      `[RepaymentEngine] Repayment #${repaymentId} marked PAID (Loan #${loanId} Month ${monthNumber}).`
    );
  } else {
    await markRepaymentFailed(repaymentId, loanId, monthNumber, tenantId, userId, repayment, userInfo);
  }
}

// ---------------------------------------------------------------------------
// markRepaymentFailed
// ---------------------------------------------------------------------------

async function markRepaymentFailed(repaymentId, loanId, monthNumber, tenantId, userId, repayment, userInfo) {
  await query(
    `UPDATE repayment_schedule SET status = 'failed' WHERE id = $1`,
    [repaymentId]
  );

  await createAuditLog(tenantId, null, 'repayment.failed', 'repayment_schedule', repaymentId, {
    loan_id: loanId,
    month_number: monthNumber,
  });

  // Fetch full loan for email context
  const loanResult = await query('SELECT * FROM loan_applications WHERE id = $1', [loanId]);
  const loan = loanResult.rows[0];

  // Email customer
  emailService.sendRepaymentFailed(userInfo, repayment, loan).catch(console.error);

  // Email all admins
  const adminsResult = await query(
    `SELECT email FROM users WHERE role IN ('super_admin','approver') AND tenant_id = $1`,
    [tenantId || SYSTEM_TENANT_ID]
  );
  for (const admin of adminsResult.rows) {
    emailService.sendAdminRepaymentFailed(admin.email, userInfo, repayment, loan).catch(console.error);
  }

  console.warn(
    `[RepaymentEngine] Repayment #${repaymentId} marked FAILED (Loan #${loanId} Month ${monthNumber}).`
  );
}

// ---------------------------------------------------------------------------
// checkLoanCompletion
// ---------------------------------------------------------------------------

async function checkLoanCompletion(loanId) {
  // Fetch all repayments for this loan
  const scheduleResult = await query(
    `SELECT status FROM repayment_schedule WHERE loan_id = $1`,
    [loanId]
  );

  const allRepayments = scheduleResult.rows;
  if (allRepayments.length === 0) return;

  const allPaid = allRepayments.every((r) => r.status === 'paid');

  if (allPaid) {
    const loanResult = await query(
      `SELECT la.*, u.id AS customer_user_id, u.tenant_id
       FROM loan_applications la
       JOIN users u ON u.id = la.user_id
       WHERE la.id = $1`,
      [loanId]
    );

    if (!loanResult.rows.length) return;
    const loan = loanResult.rows[0];

    if (loan.status === 'completed') return; // Already completed

    // Update loan status to completed
    await query(
      `UPDATE loan_applications SET status = 'completed' WHERE id = $1`,
      [loanId]
    );

    // Audit log
    await createAuditLog(
      loan.tenant_id || SYSTEM_TENANT_ID,
      null,
      'loan.completed',
      'loan',
      loanId,
      { completed_at: new Date().toISOString() }
    );

    // Update user tier
    const newTier = await updateUserTier(loan.customer_user_id);

    // Audit log for tier change
    await createAuditLog(
      loan.tenant_id || SYSTEM_TENANT_ID,
      null,
      'user.tier.updated',
      'user',
      loan.customer_user_id,
      { new_tier: newTier, reason: 'loan_completed', loan_id: loanId }
    );

    console.log(
      `[RepaymentEngine] Loan #${loanId} marked COMPLETED. User #${loan.customer_user_id} upgraded to Tier ${newTier}.`
    );
  }
}

// ---------------------------------------------------------------------------
// startRepaymentEngine — registers the cron job
// ---------------------------------------------------------------------------

/**
 * Register the daily 08:00 AM cron job.
 * Call this once from server.js on startup.
 */
function startRepaymentEngine() {
  // Runs at 08:00 AM every day — cron syntax: minute hour * * *
  cron.schedule('0 8 * * *', async () => {
    await runRepaymentEngine();
  });

  console.log('[RepaymentEngine] Scheduled: daily at 08:00 AM.');
}

module.exports = {
  startRepaymentEngine,
  runRepaymentEngine, // exported for manual testing
};
