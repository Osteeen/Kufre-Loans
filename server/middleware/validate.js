const { validationResult } = require('express-validator');

/**
 * express-validator error handler middleware.
 * Must be placed after the validation chain(s) in the route definition.
 *
 * If validation errors exist, returns HTTP 400 with an array of error messages.
 * Otherwise, passes control to the next middleware / controller.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = { handleValidationErrors };
