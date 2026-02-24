/* global TrelloPowerUp */

// Use the absolute URL for the icon if possible, or ensure it's relative to the site root
var ICON = './icon.svg';

console.log('Image Annotator Power-Up initializing...');

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

  'attachment-sections': function(t, options) {
    var entries = options.entries;
    
    return entries.map(function(entry) {
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(entry.url)) {
        return {
          id: 'annotation-' + entry.id,
          claimed: true,
          icon: ICON,
          title: 'Annotations',
          content: {
            type: 'iframe',
            url: t.signUrl('./connector.html'),
            height: 50
          }
        };
      }
      return { claimed: false };
    });
  },

  'card-back-section': function(t, options) {
    return {
      title: 'Image Annotations',
      icon: ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./connector.html'),
        height: 100
      }
    };
  }
});
