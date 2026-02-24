/* global TrelloPowerUps */

var ICON = 'https://mmountain.github.io/trelloAnnotate/icon.svg';

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
                title: 'Image Annotation'
              });
            }
          };
        });
      });
  }
});
