const express = require('express');
const { body, param, query: queryValidator } = require('express-validator');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { handleValidationErrors } = require('../middleware/validate');
const adminController = require('../controllers/adminController');

// All admin routes require authentication
router.use(authenticate);

// Role aliases for readability
const ALL_ADMIN = ['super_admin', 'approver', 'viewer'];
const CAN_ACT = ['super_admin', 'approver'];
const SUPER_ONLY = ['super_admin'];

// ---------------------------------------------------------------------------
// GET /api/admin/dashboard
// ---------------------------------------------------------------------------
router.get('/dashboard', requireRole(...ALL_ADMIN), adminController.getAdminDashboard);

// ---------------------------------------------------------------------------
// GET /api/admin/loans
// ---------------------------------------------------------------------------
router.get('/loans', requireRole(...ALL_ADMIN), adminController.getLoans);

// ---------------------------------------------------------------------------
// GET /api/admin/loans/:loanId
// ---------------------------------------------------------------------------
router.get(
  '/loans/:loanId',
  requireRole(...ALL_ADMIN),
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  adminController.getLoanDetail
);

// ---------------------------------------------------------------------------
// POST /api/admin/loans/:loanId/approve
// ---------------------------------------------------------------------------
router.post(
  '/loans/:loanId/approve',
  requireRole(...CAN_ACT),
  [
    param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.'),
    body('amount_approved')
      .notEmpty().withMessage('Approved amount is required.')
      .isInt({ min: 1 }).withMessage('amount_approved must be a positive integer (kobo).'),
    body('interest_rate')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('interest_rate must be between 0 and 100.'),
  ],
  handleValidationErrors,
  adminController.approveLoan
);

// ---------------------------------------------------------------------------
// POST /api/admin/loans/:loanId/decline
// ---------------------------------------------------------------------------
router.post(
  '/loans/:loanId/decline',
  requireRole(...CAN_ACT),
  [
    param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.'),
    body('decline_reason')
      .trim()
      .notEmpty().withMessage('A decline reason is required.'),
  ],
  handleValidationErrors,
  adminController.declineLoan
);

// ---------------------------------------------------------------------------
// POST /api/admin/loans/:loanId/disburse
// ---------------------------------------------------------------------------
router.post(
  '/loans/:loanId/disburse',
  requireRole(...CAN_ACT),
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  adminController.disburseLoan
);

// ---------------------------------------------------------------------------
// GET /api/admin/loans/:loanId/messages
// ---------------------------------------------------------------------------
router.get(
  '/loans/:loanId/messages',
  requireRole(...ALL_ADMIN),
  [param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.')],
  handleValidationErrors,
  adminController.getAdminMessages
);

// ---------------------------------------------------------------------------
// POST /api/admin/loans/:loanId/messages
// ---------------------------------------------------------------------------
router.post(
  '/loans/:loanId/messages',
  requireRole(...CAN_ACT),
  [
    param('loanId').isInt({ min: 1 }).withMessage('loanId must be a positive integer.'),
    body('message').optional().trim().isLength({ max: 1000 }),
    body('content').optional().trim().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  adminController.sendAdminMessage
);

// ---------------------------------------------------------------------------
// GET /api/admin/users
// ---------------------------------------------------------------------------
router.get('/users', requireRole(...ALL_ADMIN), adminController.getUsers);

// ---------------------------------------------------------------------------
// GET /api/admin/users/:userId
// ---------------------------------------------------------------------------
router.get(
  '/users/:userId',
  requireRole(...ALL_ADMIN),
  [param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer.')],
  handleValidationErrors,
  adminController.getUserDetail
);

// ---------------------------------------------------------------------------
// POST /api/admin/team
// ---------------------------------------------------------------------------
router.post(
  '/team',
  requireRole(...SUPER_ONLY),
  [
    body('first_name').trim().notEmpty().withMessage('First name is required.'),
    body('last_name').trim().notEmpty().withMessage('Last name is required.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Valid email is required.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role')
      .notEmpty().withMessage('Role is required.')
      .isIn(['approver', 'viewer']).withMessage('Role must be approver or viewer.'),
    body('phone').optional().trim(),
  ],
  handleValidationErrors,
  adminController.createTeamMember
);

// ---------------------------------------------------------------------------
// GET /api/admin/team
// ---------------------------------------------------------------------------
router.get('/team', requireRole(...ALL_ADMIN), adminController.getTeamMembers);

// ---------------------------------------------------------------------------
// GET /api/admin/products
// ---------------------------------------------------------------------------
router.get('/products', requireRole(...ALL_ADMIN), adminController.getLoanProducts);

// ---------------------------------------------------------------------------
// POST /api/admin/products
// ---------------------------------------------------------------------------
router.post(
  '/products',
  requireRole(...SUPER_ONLY),
  [
    body('name').trim().notEmpty().withMessage('Product name is required.'),
    body('min_amount').isInt({ min: 1 }).withMessage('min_amount must be a positive integer (kobo).'),
    body('max_amount').isInt({ min: 1 }).withMessage('max_amount must be a positive integer (kobo).'),
    body('min_tenor_months').isInt({ min: 1 }).withMessage('min_tenor_months must be a positive integer.'),
    body('max_tenor_months').isInt({ min: 1 }).withMessage('max_tenor_months must be a positive integer.'),
  ],
  handleValidationErrors,
  adminController.createLoanProduct
);

// ---------------------------------------------------------------------------
// PUT /api/admin/products/:productId
// ---------------------------------------------------------------------------
router.put(
  '/products/:productId',
  requireRole(...SUPER_ONLY),
  [param('productId').isInt({ min: 1 }).withMessage('productId must be a positive integer.')],
  handleValidationErrors,
  adminController.updateLoanProduct
);

// ---------------------------------------------------------------------------
// DELETE /api/admin/products/:productId
// ---------------------------------------------------------------------------
router.delete(
  '/products/:productId',
  requireRole(...SUPER_ONLY),
  [param('productId').isInt({ min: 1 }).withMessage('productId must be a positive integer.')],
  handleValidationErrors,
  adminController.deleteLoanProduct
);

// ---------------------------------------------------------------------------
// PATCH /api/admin/settings  (also accept PUT for compatibility)
// ---------------------------------------------------------------------------
router.put(
  '/settings',
  requireRole(...SUPER_ONLY),
  [
    body('interest_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('interest_rate must be between 0 and 100.'),
    body('tier1_max_amount').optional().isInt({ min: 1 }).withMessage('tier1_max_amount must be a positive integer.'),
    body('tier2_max_amount').optional().isInt({ min: 1 }).withMessage('tier2_max_amount must be a positive integer.'),
    body('tier3_max_amount').optional().isInt({ min: 1 }).withMessage('tier3_max_amount must be a positive integer.'),
    body('platform_name').optional().trim().isLength({ min: 1, max: 255 }),
    body('support_email').optional().isEmail().withMessage('support_email must be a valid email.'),
  ],
  handleValidationErrors,
  adminController.updateSettings
);

router.patch(
  '/settings',
  requireRole(...SUPER_ONLY),
  [
    body('interest_rate')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('interest_rate must be between 0 and 100.'),
    body('tier1_max_amount')
      .optional()
      .isInt({ min: 1 }).withMessage('tier1_max_amount must be a positive integer.'),
    body('tier2_max_amount')
      .optional()
      .isInt({ min: 1 }).withMessage('tier2_max_amount must be a positive integer.'),
    body('tier3_max_amount')
      .optional()
      .isInt({ min: 1 }).withMessage('tier3_max_amount must be a positive integer.'),
    body('platform_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 }).withMessage('platform_name must be 1–255 characters.'),
    body('support_email')
      .optional()
      .isEmail().withMessage('support_email must be a valid email address.'),
  ],
  handleValidationErrors,
  adminController.updateSettings
);

// ---------------------------------------------------------------------------
// GET /api/admin/settings
// ---------------------------------------------------------------------------
router.get('/settings', requireRole(...ALL_ADMIN), adminController.getSettings);

module.exports = router;
