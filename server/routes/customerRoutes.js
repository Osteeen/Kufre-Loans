const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { handleValidationErrors } = require('../middleware/validate');
const { uploadMultiple, uploadLoanDocs } = require('../middleware/upload');
const customerController = require('../controllers/customerController');

// All customer routes require authentication and the 'customer' role
router.use(authenticate, requireRole('customer'));

// ---------------------------------------------------------------------------
// GET /api/customer/dashboard
// ---------------------------------------------------------------------------
router.get('/dashboard', customerController.getDashboard);

// ---------------------------------------------------------------------------
// GET /api/customer/eligibility
// ---------------------------------------------------------------------------
router.get('/eligibility', customerController.getEligibility);

// ---------------------------------------------------------------------------
// POST /api/customer/loans/apply
// ---------------------------------------------------------------------------
router.post(
  '/loans/apply',
  uploadLoanDocs,
  [
    body('product_id')
      .notEmpty().withMessage('Loan product is required.')
      .isInt({ min: 1 }).withMessage('product_id must be a positive integer.'),

    body('amount_requested')
      .notEmpty().withMessage('Requested amount is required.')
      .isInt({ min: 1 }).withMessage('amount_requested must be a positive integer (kobo).'),

    body('tenor_months')
      .notEmpty().withMessage('Loan tenor is required.')
      .isInt({ min: 1 }).withMessage('tenor_months must be a positive integer.'),

    body('purpose')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Purpose must not exceed 500 characters.'),
  ],
  handleValidationErrors,
  customerController.applyForLoan
);

// ---------------------------------------------------------------------------
// GET /api/customer/loans
// ---------------------------------------------------------------------------
router.get('/loans', customerController.getMyLoans);

// ---------------------------------------------------------------------------
// GET /api/customer/loans/:loanId
// ---------------------------------------------------------------------------
router.get(
  '/loans/:loanId',
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  customerController.getLoanDetail
);

// ---------------------------------------------------------------------------
// GET /api/customer/loans/:loanId/repayments
// ---------------------------------------------------------------------------
router.get(
  '/loans/:loanId/repayments',
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  customerController.getLoanRepayments
);

// ---------------------------------------------------------------------------
// GET /api/customer/loans/:loanId/messages
// ---------------------------------------------------------------------------
router.get(
  '/loans/:loanId/messages',
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  customerController.getMessages
);

// ---------------------------------------------------------------------------
// POST /api/customer/loans/:loanId/messages
// ---------------------------------------------------------------------------
router.post(
  '/loans/:loanId/messages',
  [
    param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.'),
    body('message').optional().trim().isLength({ max: 1000 }),
    body('content').optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  customerController.sendMessage
);

// ---------------------------------------------------------------------------
// GET /api/customer/notifications
// ---------------------------------------------------------------------------
router.get('/notifications', customerController.getNotifications);

// ---------------------------------------------------------------------------
// PATCH /api/customer/notifications/:notificationId/read
// ---------------------------------------------------------------------------
router.patch(
  '/notifications/:notificationId/read',
  [param('notificationId').isInt({ min: 1 }).withMessage('notificationId must be a positive integer.')],
  handleValidationErrors,
  customerController.markNotificationRead
);

module.exports = router;
