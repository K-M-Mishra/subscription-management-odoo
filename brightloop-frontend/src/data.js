// src/data.js

/**
 * Formats a number as INR currency with Indian grouping (e.g., 1,00,000.00)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export function money(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Optional: A helper to format dates consistently across the app
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}