import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Register a new passkey for the user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const registerPasskey = async (userId, email, name) => {
  try {
    // Get registration options from server
    const optionsRes = await axios.post(`${API_BASE}/webauthn/register-options`, {
      userId,
      email,
      name
    });

    if (!optionsRes.data.success) {
      throw new Error(optionsRes.data.message);
    }

    const options = optionsRes.data.data;

    // Start registration in browser
    const attestationResponse = await startRegistration(options);

    // Verify registration with server
    const verifyRes = await axios.post(`${API_BASE}/webauthn/verify-registration`, {
      userId,
      response: attestationResponse,
      challenge: options.challenge
    });

    return {
      success: verifyRes.data.success,
      message: verifyRes.data.message
    };
  } catch (err) {
    console.error('Passkey registration error:', err);
    return {
      success: false,
      message: err.message || 'Failed to register passkey'
    };
  }
};

/**
 * Authenticate with a passkey
 * @param {string} email - User email
 * @returns {Promise<{success: boolean, token?: string, message: string}>}
 */
export const authenticateWithPasskey = async (email) => {
  try {
    // Get authentication options from server
    const optionsRes = await axios.post(`${API_BASE}/webauthn/auth-options`, {
      email
    });

    if (!optionsRes.data.success) {
      throw new Error(optionsRes.data.message);
    }

    const options = optionsRes.data.data;

    // Start authentication in browser
    const assertionResponse = await startAuthentication(options);

    // Verify authentication with server
    const verifyRes = await axios.post(`${API_BASE}/webauthn/verify-authentication`, {
      email,
      response: assertionResponse,
      challenge: options.challenge
    });

    return {
      success: verifyRes.data.success,
      token: verifyRes.data.token,
      message: verifyRes.data.message
    };
  } catch (err) {
    console.error('Passkey authentication error:', err);
    return {
      success: false,
      message: err.message || 'Failed to authenticate with passkey'
    };
  }
};

/**
 * Check if WebAuthn is supported in this browser
 * @returns {boolean}
 */
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined;
};

/**
 * Register a passkey for a beneficiary
 * @param {string} beneficiaryId - Beneficiary ID
 * @param {string} email - Beneficiary email
 * @param {string} name - Beneficiary name
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const registerBeneficiaryPasskey = async (beneficiaryId, email, name) => {
  try {
    const optionsRes = await axios.post(`${API_BASE}/webauthn/beneficiary/register-options`, {
      beneficiaryId,
      email,
      name
    });

    if (!optionsRes.data.success) {
      throw new Error(optionsRes.data.message);
    }

    const options = optionsRes.data.data;
    const attestationResponse = await startRegistration(options);

    const verifyRes = await axios.post(`${API_BASE}/webauthn/beneficiary/verify-registration`, {
      beneficiaryId,
      response: attestationResponse,
      challenge: options.challenge
    });

    return {
      success: verifyRes.data.success,
      message: verifyRes.data.message
    };
  } catch (err) {
    console.error('Beneficiary passkey registration error:', err);
    return {
      success: false,
      message: err.message || 'Failed to register passkey'
    };
  }
};
