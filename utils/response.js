/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} [data] - Optional data to return
 */
const successResponse = (res, message, data = {}) => {
  return res.status(200).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} [code=500] - HTTP status code
 */


const errorResponse = (res, message, code = 500) => {
  return res.status(code).json({
    status: "error",
    message,
  });
};

export { successResponse, errorResponse };
