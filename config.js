/**
 * VerifyAI Configuration
 * 
 * This file can be used for client-side configuration settings.
 * Currently serves as a placeholder for future configuration needs.
 */

// Example configuration object for future use
const config = {
  // API endpoint for analysis
  apiEndpoint: '/api/analyze',
  
  // UI Settings
  ui: {
    // Maximum characters allowed in response input
    maxInputLength: 10000,
    // Minimum characters required
    minInputLength: 10,
    // Show detailed error messages
    detailedErrors: false
  },
  
  // Default source model
  defaultSourceModel: 'Unknown'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}