const path = require('path');
const { query } = require('../config/database');
const { calculateEligibility, createAuditLog } = require('../models/loanModel');
const emailService = require('../config/emailService');

// ---------------------------------------------------------------------------
// getDashboard
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/dashboard
 * Returns the customer's profile, active loan, next repayment, and notifications.
 */
async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    // Fetch user info (safe fields only)
    const userResult = await query(
      `SELECT id, tenant_id, first_name, last_name, email, phone, role,
              account_number, bank_name, tier, is_verified, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    // Active loan (approved or disbursed)
    const activeLoanResult = await query(
      `SELECT la.*, lp.name AS product_name
       FROM loan_applications la
       LEFT JOIN loan_products lp ON lp.id = la.product_id
       WHERE la.user_id = $1 AND la.status IN ('approved','disbursed','pending','under_review')
       ORDER BY la.created_at DESC
       LIMIT 1`,
      [userId]
    );
    const activeLoan = activeLoanResult.rows[0] || null;

    // Next pending repayment
    let nextRepayment = null;
    if (activeLoan && ['approved', 'disbursed'].includes(activeLoan.status)) {
      const repResult = await query(
        `SELECT * FROM repayment_schedule
         WHERE loan_id = $1 AND status = 'pending'
         ORDER BY due_date ASC
         LIMIT 1`,
        [activeLoan.id]
      );
      nextRepayment = repResult.rows[0] || null;
    }

    // Notifications (latest 10)
    const notifResult = await query(
      `SELECT id, title, message, is_read AS read, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    const notifications = notifResult.rows;

    // Total loans count
    const totalLoansResult = await query(
      'SELECT COUNT(*) AS count FROM loan_applications WHERE user_id = $1',
      [userId]
    );
    const totalLoans = parseInt(totalLoansResult.rows[0].count, 10);

    // Eligibility
    const eligibility = await calculateEligibility(userId);

    return res.json({
      success: true,
      message: 'Dashboard loaded.',
      data: {
        account: user,
        active_loan: activeLoan,
        next_repayment: nextRepayment,
        notifications,
        eligibility: {
          eligible: eligibility.eligible,
          max_amount: eligibility.maxAmount,
          reason: eligibility.reason || null,
        },
        totalLoans,
      },
    });
  } catch (err) {
    console.error('[CustomerDashboard] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
}

// ---------------------------------------------------------------------------
// getEligibility
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/eligibility
 * Returns tier, maxAmount and eligibility status.
 */
async function getEligibility(req, res) {
  try {
    const result = await calculateEligibility(req.user.id);

    return res.json({
      success: true,
      message: 'Eligibility calculated.',
      data: result,
    });
  } catch (err) {
    console.error('[GetEligibility] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate eligibility.' });
  }
}

// ---------------------------------------------------------------------------
// applyForLoan
// ---------------------------------------------------------------------------

/**
 * POST /api/customer/loans/apply
 * Submits a new loan application with optional document uploads.
 */
async function applyForLoan(req, res) {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenant_id || 1;
    const { product_id, amount_requested, tenor_months, purpose } = req.body;

    const amountKobo = parseInt(amount_requested, 10);
    const tenor = parseInt(tenor_months, 10);
    const productId = parseInt(product_id, 10);

    // --- Eligibility check ---
    const eligibility = await calculateEligibility(userId);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason || 'You are not eligible for a loan at this time.',
      });
    }

    if (amountKobo > eligibility.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested amount exceeds your maximum eligible amount of ${eligibility.maxAmount} kobo (₦${(eligibility.maxAmount / 100).toLocaleString()}).`,
      });
    }

    // --- Product validation ---
    const productResult = await query(
      'SELECT * FROM loan_products WHERE id = $1 AND is_active = true',
      [productId]
    );
    if (!productResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Loan product not found or inactive.' });
    }

    const product = productResult.rows[0];

    if (amountKobo < product.min_amount || amountKobo > product.max_amount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between ₦${(product.min_amount / 100).toLocaleString()} and ₦${(product.max_amount / 100).toLocaleString()} for this product.`,
      });
    }

    if (tenor < product.min_tenor_months || tenor > product.max_tenor_months) {
      return res.status(400).json({
        success: false,
        message: `Tenor must be between ${product.min_tenor_months} and ${product.max_tenor_months} months for this product.`,
      });
    }

    // --- Create loan application ---
    const loanResult = await query(
      `INSERT INTO loan_applications
         (tenant_id, user_id, product_id, amount_requested, tenor_months, status, purpose)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [tenantId, userId, productId, amountKobo, tenor, purpose || null]
    );
    const loan = loanResult.rows[0];

    // --- Handle uploaded documents ---
    if (req.files && typeof req.files === 'object') {
      const fileEntries = Array.isArray(req.files)
        ? req.files.map((f) => ({ docType: f.fieldname, file: f }))
        : Object.entries(req.files).flatMap(([docType, files]) =>
            files.map((file) => ({ docType, file }))
          );
      for (const { docType, file } of fileEntries) {
        const fileUrl = `/uploads/${file.filename}`;
        await query(
          `INSERT INTO documents (tenant_id, loan_id, user_id, document_type, file_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [tenantId, loan.id, userId, docType, fileUrl]
        );
      }
    }

    // --- Notification for customer ---
    await query(
      `INSERT INTO notifications (tenant_id, user_id, title, message)
       VALUES ($1, $2, $3, $4)`,
      [
        tenantId,
        userId,
        'Loan Application Submitted',
        `Your loan application #${loan.id} for ₦${(amountKobo / 100).toLocaleString()} has been received and is under review.`,
      ]
    );

    // --- Email: application received ---
    emailService
      .sendLoanApplicationReceived(req.user, loan.id)
      .catch(console.error);

    // --- Email admins: new application ---
    const adminsResult = await query(
      "SELECT email FROM users WHERE role = 'super_admin' AND tenant_id = $1",
      [tenantId]
    );
    for (const admin of adminsResult.rows) {
      emailService
        .sendAdminNewApplication(admin.email, loan, req.user)
        .catch(console.error);
    }

    // --- Audit log ---
    await createAuditLog(tenantId, userId, 'loan.applied', 'loan', loan.id, {
      amount_requested: amountKobo,
      tenor_months: tenor,
      product_id: productId,
    });

    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully.',
      data: { loan },
    });
  } catch (err) {
    console.error('[ApplyForLoan] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit loan application.' });
  }
}

// ---------------------------------------------------------------------------
// getMyLoans
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/loans
 * Returns paginated loan history for the authenticated customer.
 */
async function getMyLoans(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) AS total FROM loan_applications WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const loansResult = await query(
      `SELECT la.*, lp.name AS product_name
       FROM loan_applications la
       LEFT JOIN loan_products lp ON lp.id = la.product_id
       WHERE la.user_id = $1
       ORDER BY la.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.json({
      success: true,
      message: 'Loans fetched.',
      data: {
        loans: loansResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GetMyLoans] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch loans.' });
  }
}

// ---------------------------------------------------------------------------
// getLoanDetail
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/loans/:loanId
 * Returns full details of a single loan including product, schedule summary, and docs.
 */
async function getLoanDetail(req, res) {
  try {
    const userId = req.user.id;
    const loanId = parseInt(req.params.loanId, 10);

    const loanResult = await query(
      `SELECT la.*, lp.name AS product_name, lp.description AS product_description,
              lp.min_tenor_months, lp.max_tenor_months
       FROM loan_applications la
       LEFT JOIN loan_products lp ON lp.id = la.product_id
       WHERE la.id = $1 AND la.user_id = $2`,
      [loanId, userId]
    );

    if (!loanResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const loan = loanResult.rows[0];

    // Repayment schedule summary
    const scheduleResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
         COUNT(*) FILTER (WHERE status IN ('failed','overdue')) AS failed_count,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) AS total_paid,
         COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending'), 0) AS total_remaining
       FROM repayment_schedule
       WHERE loan_id = $1`,
      [loanId]
    );
    const scheduleSummary = scheduleResult.rows[0];

    // Documents
    const docsResult = await query(
      'SELECT id, document_type, file_url, uploaded_at FROM documents WHERE loan_id = $1',
      [loanId]
    );

    return res.json({
      success: true,
      message: 'Loan detail fetched.',
      data: {
        loan,
        scheduleSummary,
        documents: docsResult.rows,
      },
    });
  } catch (err) {
    console.error('[GetLoanDetail] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch loan detail.' });
  }
}

// ---------------------------------------------------------------------------
// getLoanRepayments
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/loans/:loanId/repayments
 * Returns the full repayment schedule for a loan with summary stats.
 */
async function getLoanRepayments(req, res) {
  try {
    const userId = req.user.id;
    const loanId = parseInt(req.params.loanId, 10);

    // Verify loan belongs to user
    const ownerCheck = await query(
      'SELECT id FROM loan_applications WHERE id = $1 AND user_id = $2',
      [loanId, userId]
    );
    if (!ownerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const scheduleResult = await query(
      'SELECT * FROM repayment_schedule WHERE loan_id = $1 ORDER BY month_number ASC',
      [loanId]
    );

    const schedule = scheduleResult.rows;

    const paidCount = schedule.filter((r) => r.status === 'paid').length;
    const pendingCount = schedule.filter((r) => r.status === 'pending').length;
    const failedCount = schedule.filter((r) => ['failed', 'overdue'].includes(r.status)).length;
    const totalPaid = schedule
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + Number(r.total_amount), 0);
    const totalRemaining = schedule
      .filter((r) => r.status !== 'paid')
      .reduce((sum, r) => sum + Number(r.total_amount), 0);

    return res.json({
      success: true,
      message: 'Repayment schedule fetched.',
      data: {
        schedule,
        summary: { paidCount, pendingCount, failedCount, totalPaid, totalRemaining },
      },
    });
  } catch (err) {
    console.error('[GetLoanRepayments] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch repayment schedule.' });
  }
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/loans/:loanId/messages
 * Returns all messages for a loan, marking admin messages as read.
 */
async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const loanId = parseInt(req.params.loanId, 10);

    // Verify ownership
    const ownerCheck = await query(
      'SELECT id FROM loan_applications WHERE id = $1 AND user_id = $2',
      [loanId, userId]
    );
    if (!ownerCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Mark unread admin messages as read
    await query(
      `UPDATE messages
       SET is_read = true
       WHERE loan_id = $1 AND sender_role IN ('super_admin','approver','viewer') AND is_read = false`,
      [loanId]
    );

    const messagesResult = await query(
      `SELECT m.*, m.content AS message, u.first_name, u.last_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.loan_id = $1
       ORDER BY m.created_at ASC`,
      [loanId]
    );

    return res.json({
      success: true,
      message: 'Messages fetched.',
      data: { messages: messagesResult.rows },
    });
  } catch (err) {
    console.error('[GetMessages] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

/**
 * POST /api/customer/loans/:loanId/messages
 * Sends a message from the customer to the admin team.
 */
async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenant_id || 1;
    const loanId = parseInt(req.params.loanId, 10);
    const content = req.body.message || req.body.content;

    // Verify ownership
    const loanResult = await query(
      'SELECT id FROM loan_applications WHERE id = $1 AND user_id = $2',
      [loanId, userId]
    );
    if (!loanResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const msgResult = await query(
      `INSERT INTO messages (tenant_id, loan_id, sender_id, sender_role, content)
       VALUES ($1, $2, $3, 'customer', $4)
       RETURNING *, content AS message`,
      [tenantId, loanId, userId, content]
    );
    const message = msgResult.rows[0];

    // Notify admins by email and in-app notification
    const adminsResult = await query(
      "SELECT id, email FROM users WHERE role IN ('super_admin','approver') AND tenant_id = $1",
      [tenantId]
    );

    const loanRef = { id: loanId };

    for (const admin of adminsResult.rows) {
      // Email notification
      emailService
        .sendNewMessageNotification({ email: admin.email, first_name: 'Team' }, loanRef)
        .catch(console.error);

      // In-app notification
      await query(
        `INSERT INTO notifications (tenant_id, user_id, title, message)
         VALUES ($1, $2, $3, $4)`,
        [
          tenantId,
          admin.id,
          `New message on Loan #${loanId}`,
          `Customer ${req.user.first_name} ${req.user.last_name} sent a message on Loan #${loanId}.`,
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: { message },
    });
  } catch (err) {
    console.error('[SendMessage] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

// ---------------------------------------------------------------------------
// getNotifications
// ---------------------------------------------------------------------------

/**
 * GET /api/customer/notifications
 * Returns paginated notifications for the customer.
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const notifsResult = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    return res.json({
      success: true,
      message: 'Notifications fetched.',
      data: {
        notifications: notifsResult.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GetNotifications] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

// ---------------------------------------------------------------------------
// markNotificationRead
// ---------------------------------------------------------------------------

/**
 * PATCH /api/customer/notifications/:notificationId/read
 * Marks a single notification as read.
 */
async function markNotificationRead(req, res) {
  try {
    const userId = req.user.id;
    const notifId = parseInt(req.params.notificationId, 10);

    const result = await query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notifId, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification: result.rows[0] },
    });
  } catch (err) {
    console.error('[MarkNotificationRead] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

module.exports = {
  getDashboard,
  getEligibility,
  applyForLoan,
  getMyLoans,
  getLoanDetail,
  getLoanRepayments,
  getMessages,
  sendMessage,
  getNotifications,
  markNotificationRead,
};
