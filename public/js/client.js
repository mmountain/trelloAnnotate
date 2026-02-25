/* global TrelloPowerUp */

var ICON = 'https://mmountain.github.io/trelloAnnotate/icon.svg';

console.log('Image Annotator Power-Up: Initializing v1.0.2...');

var noop = function() { return []; };

TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return t.card('attachments')
      .then(function(card) {
        if (!card.attachments) return [];

        var imageAttachments = card.attachments.filter(function(attachment) {
          return attachment.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(attachment.url);
        });

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
  'attachment-sections': function(t, options) {
    // Trello expects an array of objects, one for each entry in options.entries
    // We must ensure all objects have an 'id' and a 'claimed' property
    var entries = options.entries;
    
    // Use a Promise to resolve everything before returning to Trello
    return Promise.all(entries.map(function(entry) {
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(entry.url)) {
        // Resolve the signed URL first
        // Wrap in Promise.resolve because t.signUrl can return a string or a Promise
        return Promise.resolve(t.signUrl('./index.html'))
          .then(function(signedUrl) {
            return {
              id: entry.id, // Must be unique
              claimed: true,
              icon: ICON,
              title: 'Image Annotator',
              content: {
                type: 'iframe',
                url: signedUrl,
                height: 50
              }
            };
          })
          .catch(function(err) {
            console.error('Error in attachment-sections signUrl:', err);
            // Fallback if signUrl fails
            return { id: entry.id, claimed: false };
          });
      } else {
        return Promise.resolve({
          id: entry.id,
          claimed: false
        });
      }
    }));
  },
  'card-badges': noop,
  'card-detail-badges': noop,
  'board-buttons': noop,
  'card-from-url': noop,
  'format-url': noop,
  'show-settings': noop,
  'authorization-status': function(t, options) { return { authorized: true }; },
  'show-authorization': noop,
  'attachment-thumbnail': noop,
  'card-back-section': noop,
  'list-actions': noop,
  'list-sorters': noop,
  'save-attachment': noop
}, {
  appName: 'Image Annotator',
  appKey: 'trello-image-annotator'
});
