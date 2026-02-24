import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

// Base URL for GitHub Pages
const BASE_URL = 'https://mmountain.github.io/trelloAnnotate';

// Wait for TrelloPowerUps to be available
const initializePowerUp = () => {
  if (!window.TrelloPowerUps) {
    console.warn('TrelloPowerUps not available yet, retrying...');
    setTimeout(initializePowerUp, 100);
    return;
  }

  // Check if we're in a modal context (with attachment ID)
  const urlParams = new URLSearchParams(window.location.search);
  const attachmentId = urlParams.get('attachment');

  if (attachmentId) {
    // This is the modal view - render React app
    const t = window.TrelloPowerUps.iframe();

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
      })
      .catch(err => {
        console.error('Failed to load attachment:', err);
      });
  } else {
    // This is the Power-Up initialization (card buttons)
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
          })
          .catch(err => {
            console.error('Error loading card buttons:', err);
            return [];
          });
      }
    });
  }
};

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePowerUp);
} else {
  initializePowerUp();
}
