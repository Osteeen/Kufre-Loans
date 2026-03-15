const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { handleValidationErrors } = require('../middleware/validate');

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  [
    body('first_name')
      .trim()
      .notEmpty().withMessage('First name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('First name must be 2–100 characters.'),

    body('last_name')
      .trim()
      .notEmpty().withMessage('Last name is required.')
      .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2–100 characters.'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email address is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/\d/).withMessage('Password must contain at least one number.')
      .matches(/[@$!%*?&_#^()+=\-]/).withMessage('Password must contain at least one special character.'),

    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required.')
      .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid phone number (10–15 digits).'),

    body('bvn')
      .trim()
      .notEmpty().withMessage('BVN is required.')
      .isLength({ min: 11, max: 11 }).withMessage('BVN must be exactly 11 digits.')
      .isNumeric().withMessage('BVN must contain digits only.'),
  ],
  handleValidationErrors,
  authController.register
);

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email address is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required.'),
  ],
  handleValidationErrors,
  authController.login
);

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email address is required.')
      .isEmail().withMessage('Please provide a valid email address.')
      .normalizeEmail(),
  ],
  handleValidationErrors,
  authController.forgotPassword
);

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
router.post(
  '/reset-password',
  [
    body('token')
      .trim()
      .notEmpty().withMessage('Reset token is required.'),

    body('new_password')
      .notEmpty().withMessage('New password is required.')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/\d/).withMessage('Password must contain at least one number.')
      .matches(/[@$!%*?&_#^()+=\-]/).withMessage('Password must contain at least one special character.'),
  ],
  handleValidationErrors,
  authController.resetPassword
);

module.exports = router;
