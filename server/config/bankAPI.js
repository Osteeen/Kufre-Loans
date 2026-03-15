/**
 * Bank API Adapter — Providus Bank (Stubbed)
 *
 * Each method is stubbed with realistic mock data and logs the real API call
 * that would be made in production. Replace the body of each method with the
 * actual HTTP call once Providus credentials are available.
 *
 * Base URL (production): https://api.providusbank.com/v1
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a realistic 10-digit NUBAN account number prefixed with 5.
 */
function mockAccountNumber() {
  const digits = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `5${digits}`;
}

/**
 * Generate a transaction reference in the format TXN-<UUID_SHORT>-<TIMESTAMP>.
 */
function mockTransactionRef() {
  const short = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  return `TXN-${short}-${Date.now()}`;
}

const bankAPI = {
  /**
   * PROVIDUS ENDPOINT: POST /api/PiPCreateVirtualAccountNumber
   * Creates a virtual dedicated NUBAN account for a customer.
   *
   * @param {Object} userData - { firstName, lastName, email, bvn, phoneNumber }
   * @returns {Promise<{ accountNumber: string, bankName: string }>}
   */
  async createVirtualAccount(userData) {
    console.log(
      '[BankAPI] createVirtualAccount — would POST to /api/PiPCreateVirtualAccountNumber',
      { firstName: userData.first_name, lastName: userData.last_name, bvn: userData.bvn }
    );

    await _simulateNetworkDelay();

    return {
      accountNumber: mockAccountNumber(),
      bankName: 'Providus Bank',
    };
  },

  /**
   * PROVIDUS ENDPOINT: POST /api/debitAccount
   * Debits a customer's account for repayment collection.
   *
   * @param {string} accountNumber - Customer NUBAN
   * @param {number} amount - Amount in kobo
   * @param {string} narration - Transaction narration
   * @returns {Promise<{ transactionRef: string, status: string }>}
   */
  async debitAccount(accountNumber, amount, narration) {
    console.log(
      '[BankAPI] debitAccount — would POST to /api/debitAccount',
      { accountNumber, amount, narration }
    );

    await _simulateNetworkDelay();

    return {
      transactionRef: mockTransactionRef(),
      status: 'success',
    };
  },

  /**
   * PROVIDUS ENDPOINT: POST /api/NIPFundTransfer
   * Credits an account (disbursement or corporate settlement).
   *
   * @param {string} accountNumber - Destination NUBAN
   * @param {number} amount - Amount in kobo
   * @param {string} narration - Transaction narration
   * @returns {Promise<{ transactionRef: string, status: string }>}
   */
  async creditAccount(accountNumber, amount, narration) {
    console.log(
      '[BankAPI] creditAccount — would POST to /api/NIPFundTransfer',
      { accountNumber, amount, narration }
    );

    await _simulateNetworkDelay();

    return {
      transactionRef: mockTransactionRef(),
      status: 'success',
    };
  },

  /**
   * PROVIDUS ENDPOINT: GET /api/getAccountDetails?accountNumber={accountNumber}
   * Retrieves the current balance for an account.
   *
   * @param {string} accountNumber - NUBAN to query
   * @returns {Promise<{ balance: number, accountNumber: string }>}
   */
  async getAccountBalance(accountNumber) {
    console.log(
      '[BankAPI] getAccountBalance — would GET /api/getAccountDetails',
      { accountNumber }
    );

    await _simulateNetworkDelay();

    // Mock balance between ₦0 and ₦5,000,000 (in kobo)
    const balance = Math.floor(Math.random() * 500_000_000);

    return {
      balance,
      accountNumber,
    };
  },

  /**
   * PROVIDUS ENDPOINT: GET /api/getAccountStatement?accountNumber={accountNumber}&fromDate={fromDate}&toDate={toDate}
   * Retrieves a transaction statement for a date range.
   *
   * @param {string} accountNumber - NUBAN to query
   * @param {string} fromDate - ISO date string (YYYY-MM-DD)
   * @param {string} toDate - ISO date string (YYYY-MM-DD)
   * @returns {Promise<{ transactions: Array }>}
   */
  async getAccountStatement(accountNumber, fromDate, toDate) {
    console.log(
      '[BankAPI] getAccountStatement — would GET /api/getAccountStatement',
      { accountNumber, fromDate, toDate }
    );

    await _simulateNetworkDelay();

    return {
      transactions: [],
    };
  },
};

/**
 * Simulates a realistic network latency for mock calls (50–200ms).
 */
function _simulateNetworkDelay() {
  const delay = 50 + Math.floor(Math.random() * 150);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

module.exports = bankAPI;
