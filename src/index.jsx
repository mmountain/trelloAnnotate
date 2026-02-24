import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

// Base URL for GitHub Pages
const BASE_URL = 'https://mmountain.github.io/trelloAnnotate';

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
          icon: `${BASE_URL}/icon.svg`,
          text: `Annotate: ${attachment.name}`,
          callback: function(t) {
            return t.modal({
              url: `${BASE_URL}/index.html?attachment=${attachment.id}`,
              fullscreen: true,
              title: 'Image Annotation'
            });
          }
        }));
      });
  }
});

// If this page is loaded in a modal context (with attachment ID), render the React app
const urlParams = new URLSearchParams(window.location.search);
const attachmentId = urlParams.get('attachment');

if (attachmentId && window.TrelloPowerUps) {
  // Get the Trello iframe context
  const t = window.TrelloPowerUps.iframe();

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
