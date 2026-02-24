/**
 * Utilities for syncing annotations with Trello comments
 */

/**
 * Create a Trello comment for a pin annotation
 * @param {Object} t - Trello Power-Up client
 * @param {Object} pin - Pin annotation data
 * @param {string} commentText - Comment text
 * @param {string} attachmentName - Attachment filename
 * @returns {Promise<string>} Comment ID
 */
export async function createPinComment(t, pin, commentText, attachmentName) {
  try {
    const formattedComment = `[Annotation Pin #${pin.n}] on "${attachmentName}"\n\n${commentText}`;

    // Get card members to properly format comment
    const card = await t.card('id', 'url');

    // Create the comment using Trello's comment API
    // Note: t.card('comments') doesn't have a create method in the Power-Up API
    // We need to use the REST API through a popup or alert
    // For now, we'll return a placeholder and implement via REST API

    // Alternative: Use alert to notify and let user add comment manually
    // OR use Trello REST API if we have auth

    // Since Power-Up API is limited, we'll store comment text in annotation
    // and provide a "Copy to Comment" button in the UI

    return null; // Will be populated when user copies to Trello
  } catch (error) {
    console.error('Failed to create pin comment:', error);
    throw error;
  }
}

/**
 * Format pin comment text for Trello
 * @param {number} pinNumber - Pin number
 * @param {string} commentText - Comment text
 * @param {string} attachmentName - Attachment filename
 * @returns {string} Formatted comment
 */
export function formatPinComment(pinNumber, commentText, attachmentName) {
  return `[Annotation Pin #${pinNumber}] on "${attachmentName}"\n\n${commentText}`;
}

/**
 * Format drawing comment text for Trello
 * @param {string} drawingType - Drawing type (line/arrow)
 * @param {string} commentText - Comment text
 * @param {string} attachmentName - Attachment filename
 * @returns {string} Formatted comment
 */
export function formatDrawingComment(drawingType, commentText, attachmentName) {
  return `[Annotation Drawing: ${drawingType}] on "${attachmentName}"\n\n${commentText}`;
}

/**
 * Format highlight comment text for Trello
 * @param {string} highlightType - Highlight type (rect/circle)
 * @param {string} commentText - Comment text
 * @param {string} attachmentName - Attachment filename
 * @returns {string} Formatted comment
 */
export function formatHighlightComment(highlightType, commentText, attachmentName) {
  return `[Annotation Highlight: ${highlightType}] on "${attachmentName}"\n\n${commentText}`;
}

/**
 * Add comment to Trello card using popup
 * This opens a Trello interface for adding a comment
 * @param {Object} t - Trello Power-Up client
 * @param {string} commentText - Pre-filled comment text
 * @returns {Promise<void>}
 */
export async function addCommentViaPopup(t, commentText) {
  try {
    // Use Trello's popup to add comment
    // This is the most reliable way with Power-Up API limitations
    await t.popup({
      title: 'Add Comment to Card',
      items: [
        {
          text: 'Copy comment text',
          callback: async function(t) {
            // Copy to clipboard
            try {
              await navigator.clipboard.writeText(commentText);
              await t.alert({
                message: 'Comment text copied! Now add it to the card.',
                duration: 3
              });
            } catch (err) {
              console.error('Failed to copy:', err);
            }
            return t.closePopup();
          }
        },
        {
          text: 'Open card to add comment',
          callback: async function(t) {
            const card = await t.card('url');
            window.open(card.url, '_blank');
            return t.closePopup();
          }
        }
      ]
    });
  } catch (error) {
    console.error('Failed to open comment popup:', error);
    throw error;
  }
}

/**
 * Show alert to copy comment
 * @param {Object} t - Trello Power-Up client
 * @param {string} commentText - Comment text to copy
 * @returns {Promise<void>}
 */
export async function copyCommentToClipboard(t, commentText) {
  try {
    await navigator.clipboard.writeText(commentText);
    await t.alert({
      message: 'Comment copied to clipboard! Paste it in the card comments.',
      duration: 4,
      display: 'info'
    });
  } catch (error) {
    console.error('Failed to copy comment:', error);
    await t.alert({
      message: 'Failed to copy comment. Please copy manually.',
      duration: 3,
      display: 'error'
    });
  }
}

/**
 * Get card comments (if available)
 * Note: Trello Power-Up API has limited access to comments
 * @param {Object} t - Trello Power-Up client
 * @returns {Promise<Array>} Array of comments
 */
export async function getCardComments(t) {
  try {
    // Try to get comments if available
    // This may not work due to API limitations
    const card = await t.card('all');
    return card.comments || [];
  } catch (error) {
    console.warn('Could not fetch card comments:', error);
    return [];
  }
}

/**
 * Parse annotation reference from comment text
 * @param {string} commentText - Comment text
 * @returns {Object|null} Parsed annotation info or null
 */
export function parseAnnotationReference(commentText) {
  // Match patterns like [Annotation Pin #5]
  const pinMatch = commentText.match(/\[Annotation Pin #(\d+)\]/);
  if (pinMatch) {
    return {
      type: 'pin',
      number: parseInt(pinMatch[1], 10)
    };
  }

  // Match drawing annotations
  const drawingMatch = commentText.match(/\[Annotation Drawing: (\w+)\]/);
  if (drawingMatch) {
    return {
      type: 'drawing',
      drawingType: drawingMatch[1]
    };
  }

  // Match highlight annotations
  const highlightMatch = commentText.match(/\[Annotation Highlight: (\w+)\]/);
  if (highlightMatch) {
    return {
      type: 'highlight',
      highlightType: highlightMatch[1]
    };
  }

  return null;
}

/**
 * Mark annotation as resolved in comment
 * @param {string} originalComment - Original comment text
 * @returns {string} Updated comment with resolved marker
 */
export function markCommentAsResolved(originalComment) {
  if (originalComment.includes('[RESOLVED]')) {
    return originalComment;
  }
  return `[RESOLVED] ${originalComment}`;
}

/**
 * Check if comment is marked as resolved
 * @param {string} commentText - Comment text
 * @returns {boolean} True if resolved
 */
export function isCommentResolved(commentText) {
  return commentText.includes('[RESOLVED]');
}
