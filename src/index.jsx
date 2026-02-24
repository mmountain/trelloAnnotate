import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

// Base URL for GitHub Pages
const BASE_URL = 'https://mmountain.github.io/trelloAnnotate';

let retryCount = 0;
const MAX_RETRIES = 50; // 5 seconds max (50 * 100ms)

// Wait for TrelloPowerUps to be available
const initializePowerUp = () => {
  if (!window.TrelloPowerUps) {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      console.warn(`TrelloPowerUps not available yet, retrying... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(initializePowerUp, 100);
    } else {
      console.error('TrelloPowerUps failed to load after maximum retries');
    }
    return;
  }

  console.log('TrelloPowerUps loaded successfully!');

  // Check if we're in a modal context (with attachment ID)
  const urlParams = new URLSearchParams(window.location.search);
  const attachmentId = urlParams.get('attachment');

  if (attachmentId) {
    // This is the modal view - render React app
    console.log('Modal context detected, attachment ID:', attachmentId);
    const t = window.TrelloPowerUps.iframe();

    t.card('attachments')
      .then(card => {
        const attachment = card.attachments.find(a => a.id === attachmentId);

        if (attachment) {
          console.log('Attachment found, rendering modal');
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(
            <React.StrictMode>
              <AnnotationModal
                t={t}
                attachment={attachment}
              />
            </React.StrictMode>
          );
        } else {
          console.error('Attachment not found:', attachmentId);
        }
      })
      .catch(err => {
        console.error('Failed to load attachment:', err);
      });
  } else {
    // This is the Power-Up initialization (card buttons)
    console.log('Initializing Power-Up capabilities');
    window.TrelloPowerUps.initialize({
      'card-buttons': function(t, options) {
        console.log('card-buttons capability called');
        return t.card('attachments')
          .then(function(card) {
            const imageAttachments = card.attachments.filter(
              a => a.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(a.url)
            );

            console.log('Found image attachments:', imageAttachments.length);

            if (imageAttachments.length === 0) {
              return [];
            }

            return imageAttachments.map(attachment => ({
              icon: `${BASE_URL}/icon.svg`,
              text: `Annotate: ${attachment.name}`,
              callback: function(t) {
                console.log('Annotate button clicked for:', attachment.name);
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

// Start initialization
console.log('Starting Power-Up initialization...');
initializePowerUp();
