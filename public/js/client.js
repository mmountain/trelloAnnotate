/* global TrelloPowerUp */

var ICON = 'https://mmountain.github.io/trelloAnnotate/icon.svg';

console.log('Image Annotator Power-Up: Initializing...');

var noop = function() { return []; };

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    console.log('Image Annotator: card-buttons requested');
    return t.card('attachments')
      .then(function(card) {
        if (!card.attachments) {
          console.log('Image Annotator: No attachments found on card');
          return [];
        }

        var imageAttachments = card.attachments.filter(function(attachment) {
          return attachment.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(attachment.url);
        });

        console.log('Image Annotator: Found ' + imageAttachments.length + ' image attachments');

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
      })
      .catch(function(err) {
        console.error('Image Annotator: Error in card-buttons handler', err);
        return [];
      });
  },
  'card-badges': noop,
  'card-detail-badges': noop,
  'board-buttons': noop,
  'card-from-url': noop,
  'format-url': noop,
  'show-settings': noop,
  'authorization-status': function(t, options) { return { authorized: true }; },
  'show-authorization': noop,
  'attachment-sections': function(t, options) {
    return options.entries.map(function(entry) {
      return {
        id: entry.id,
        claimed: true
      };
    });
  },
  'attachment-thumbnail': noop,
  'card-back-section': noop,
  'list-actions': noop,
  'list-sorters': noop,
  'save-attachment': noop
}, {
  // Optional initialization options
  appName: 'Image Annotator',
  appKey: 'trello-image-annotator'
});
