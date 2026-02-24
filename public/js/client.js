/* global TrelloPowerUps */

// We use a relative path for the icon, but Trello might require an absolute one in some contexts.
// The Power-Up library usually handles relative paths by resolving them against the connector URL.
var ICON = './icon.svg';

console.log('Image Annotator Power-Up initializing...');

TrelloPowerUps.initialize({
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
    // This allows showing a section directly under the attachment in the Trello UI
    var entries = options.entries; // The attachments
    
    return entries.map(function(entry) {
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(entry.url)) {
        return {
          id: 'annotation-' + entry.id,
          claimed: true,
          icon: ICON,
          title: 'Annotations',
          content: {
            type: 'iframe',
            url: t.signUrl('./connector.html'), // Placeholder or a summary view
            height: 50
          }
        };
      }
      return { claimed: false };
    });
  },

  'card-back-section': function(t, options) {
    // Optional: Show a summary section on the card back
    return {
      title: 'Image Annotations',
      icon: ICON,
      content: {
        type: 'iframe',
        url: t.signUrl('./connector.html'), // Placeholder
        height: 100
      }
    };
  }
});
