/* global TrelloPowerUp */

var ICON = 'https://mmountain.github.io/trelloAnnotate/icon.svg';

console.log('Image Annotator Power-Up: Initializing v1.0.8...');

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
    var imageEntries = options.entries.filter(function(entry) {
      return entry.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(entry.url);
    });

    if (!imageEntries.length) {
      return [];
    }

    return [{
      id: 'image-annotator-section',
      claimed: imageEntries,
      icon: ICON,
      title: 'Image Annotator',
      content: {
        type: 'iframe',
        url: t.signUrl('./section.html'),
        height: imageEntries.length * 56 + 16
      }
    }];
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
