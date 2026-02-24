import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

const t = window.TrelloPowerUps.iframe();

// Card Buttons Capability - Show "Annotate" button for each image attachment
window.TrelloPowerUps.initialize({
  'card-buttons': function(t, options) {
    return t.card('attachments')
      .then(function(card) {
        const imageAttachments = card.attachments.filter(
          a => a.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(a.url)
        );

        if (imageAttachments.length === 0) {
          return [];
        }

        return imageAttachments.map(attachment => ({
          icon: './public/icon.svg',
          text: `Annotate: ${attachment.name}`,
          callback: function(t) {
            return t.modal({
              url: `./index.html?attachment=${attachment.id}`,
              fullscreen: true,
              title: 'Image Annotation'
            });
          }
        }));
      });
  },

  // Card Back Section - Show annotation summary on card back
  'card-back-section': function(t, options) {
    return t.card('attachments')
      .then(function(card) {
        const imageAttachments = card.attachments.filter(
          a => a.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(a.url)
        );

        if (imageAttachments.length === 0) {
          return null;
        }

        // Count total annotations across all images
        const annotationPromises = imageAttachments.map(attachment =>
          t.get('card', 'shared', `annotation_${attachment.id}`)
        );

        return Promise.all(annotationPromises)
          .then(function(annotationsList) {
            const totalAnnotations = annotationsList.reduce((sum, annotations) => {
              if (!annotations) return sum;
              return sum +
                (annotations.pins?.length || 0) +
                (annotations.drawings?.length || 0) +
                (annotations.highlights?.length || 0);
            }, 0);

            if (totalAnnotations === 0) {
              return null;
            }

            return {
              title: 'Image Annotations',
              icon: './public/icon.svg',
              content: {
                type: 'text',
                text: `${totalAnnotations} annotation(s) on ${imageAttachments.length} image(s)`
              }
            };
          });
      });
  }
});

// If this page is loaded in a modal context (with attachment ID), render the React app
const urlParams = new URLSearchParams(window.location.search);
const attachmentId = urlParams.get('attachment');

if (attachmentId) {
  // Get the attachment details and render the modal
  t.card('attachments')
    .then(card => {
      const attachment = card.attachments.find(a => a.id === attachmentId);

      if (attachment) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
          <React.StrictMode>
            <AnnotationModal
              t={t}
              attachment={attachment}
            />
          </React.StrictMode>
        );
      }
    });
}
