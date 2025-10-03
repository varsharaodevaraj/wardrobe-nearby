/**
 * Email Validation Utility for WardrobeNearby
 * 
 * Provides comprehensive email validation to ensure proper email format
 */

// Regular expression for comprehensive email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {object} - Validation result with isValid boolean and error message
 */
export const validateEmail = (email) => {
  // Check if email is provided
  if (!email) {
    return {
      isValid: false,
      error: 'Email address is required'
    };
  }

  // Remove whitespace
  const trimmedEmail = email.trim();

  // Check if empty after trimming
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Email address cannot be empty'
    };
  }

  // Check minimum length
  if (trimmedEmail.length < 5) {
    return {
      isValid: false,
      error: 'Email address is too short'
    };
  }

  // Check maximum length (RFC 5321 limit)
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      error: 'Email address is too long'
    };
  }

  // Check for multiple @ symbols
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      error: 'Email must contain exactly one @ symbol'
    };
  }

  // Split local and domain parts
  const [localPart, domainPart] = trimmedEmail.split('@');

  // Validate local part (before @)
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: 'Email must have a username before @'
    };
  }

  if (localPart.length > 64) {
    return {
      isValid: false,
      error: 'Username part of email is too long'
    };
  }

  // Check for consecutive dots in local part
  if (localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Email cannot contain consecutive dots'
    };
  }

  // Check for dots at start/end of local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email username cannot start or end with a dot'
    };
  }

  // Validate domain part (after @)
  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      error: 'Email must have a domain after @'
    };
  }

  // Check for valid domain format
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'Email domain must contain at least one dot'
    };
  }

  // Check domain length
  if (domainPart.length > 253) {
    return {
      isValid: false,
      error: 'Email domain is too long'
    };
  }

  // Check for valid domain format (no consecutive dots, etc.)
  if (domainPart.includes('..') || domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return {
      isValid: false,
      error: 'Invalid domain format'
    };
  }

  // Final regex validation
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g., user@example.com)'
    };
  }

  // All validations passed
  return {
    isValid: true,
    email: trimmedEmail.toLowerCase(), // Return normalized email
    error: null
  };
};

/**
 * Quick email validation (returns boolean only)
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  return validateEmail(email).isValid;
};

/**
 * Get email validation error message
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getEmailError = (email) => {
  const result = validateEmail(email);
  return result.error;
};

/**
 * Normalize email address (trim and lowercase)
 * @param {string} email - Email to normalize
 * @returns {string} - Normalized email
 */
export const normalizeEmail = (email) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

// Export validation functions
export default {
  validateEmail,
  isValidEmail,
  getEmailError,
  normalizeEmail
};
