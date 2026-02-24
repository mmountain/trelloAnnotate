/* global TrelloPowerUp */

var ICON = 'https://mmountain.github.io/trelloAnnotate/icon.svg';

console.log('Image Annotator Power-Up initializing...');

// Minimal handlers to satisfy Trello initialization if multiple capabilities are enabled in the portal
var noop = function() { return []; };

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return t.card('attachments')
      .then(function(card) {
        var imageAttachments = card.attachments.filter(function(attachment) {
          return attachment.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(attachment.url);
        });

        if (imageAttachments.length === 0) {
          return [];
        }

        return imageAttachments.map(function(attachment) {
          return {
            icon: ICON,
            text: 'Annotate: ' + attachment.name,
            callback: function(t) {
              return t.modal({
                url: './modal.html?attachment=' + attachment.id,
                fullscreen: true,
                title: 'Image Annotation: ' + attachment.name
              });
            }
          };
        });
      });
  },
  // Add no-op handlers for all other common capabilities to prevent "Not Implemented" errors
  'card-badges': noop,
  'card-detail-badges': noop,
  'board-buttons': noop,
  'card-from-url': noop,
  'format-url': noop,
  'show-settings': noop,
  'authorization-status': function(t, options) { return { authorized: true }; },
  'show-authorization': noop,
  'attachment-sections': noop,
  'attachment-thumbnail': noop,
  'card-back-section': noop,
  'list-actions': noop,
  'list-sorters': noop,
  'save-attachment': noop
});
