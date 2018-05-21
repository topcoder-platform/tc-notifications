/**
 * Helper functions
 */
const Remarkable = require('remarkable');

/**
 * Convert markdown into raw draftjs state
 *
 * @param {String} markdown - markdown to convert into raw draftjs object
 * @param {Object} options - optional additional data
 *
 * @return {Object} ContentState
**/
const markdownToHTML = (markdown) => {
  const md = new Remarkable('full', {
    html: true,
    linkify: true,
    // typographer: true,
  });

  // Replace the BBCode [u][/u] to markdown '++' for underline style
  const _markdown = markdown.replace(new RegExp('\\[/?u\\]', 'g'), '++');

  // remarkable js takes markdown and makes it an array of style objects for us to easily parse
  return md.render(_markdown, {});
};

/**
 * Helper method to clean up the provided email address for deducing the final address that matters for
 * the delivery of the email i.e. removing any non standard parts in the email address e.g. getting rid
 * of anything after + sign in the local part of the email.
 *
 * @param {String} email email address to be sanitized
 *
 * @returns {String} sanitized email
 */
const sanitizeEmail = (email) => {
  if (email) {
    return email.substring(0, email.indexOf('+') !== -1 ? email.indexOf('+') : email.indexOf('@'))
    + email.substring(email.indexOf('@'));
  }
  return '';
};

module.exports = {
  markdownToHTML,
  sanitizeEmail,
};
