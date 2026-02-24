import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

// Base URL for GitHub Pages
const BASE_URL = 'https://mmountain.github.io/trelloAnnotate';

let retryCount = 0;
const MAX_RETRIES = 100; // 10 seconds max

const initPowerUp = () => {
  console.log(`Attempt ${retryCount + 1}: Checking for TrelloPowerUps...`);

  if (!window.TrelloPowerUps) {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      setTimeout(initPowerUp, 100);
    } else {
      console.error('FAILED: TrelloPowerUps not available after 10 seconds');
      console.error('Check if power-up.min.js is being blocked by CSP or ad blocker');
    }
    return;
  }

  console.log('✅ TrelloPowerUps loaded successfully!');

  const urlParams = new URLSearchParams(window.location.search);
  const attachmentId = urlParams.get('attachment');

  if (attachmentId) {
    console.log('📍 Modal mode - Attachment ID:', attachmentId);
    const t = window.TrelloPowerUps.iframe();

    t.card('attachments')
      .then(card => {
        const attachment = card.attachments.find(a => a.id === attachmentId);
        if (attachment) {
          console.log('✅ Attachment found, rendering modal');
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(
            <React.StrictMode>
              <AnnotationModal t={t} attachment={attachment} />
            </React.StrictMode>
          );
        } else {
          console.error('❌ Attachment not found');
        }
      })
      .catch(err => console.error('❌ Error loading attachment:', err));
  } else {
    console.log('🔧 Initializing card-buttons capability');
    window.TrelloPowerUps.initialize({
      'card-buttons': function(t, options) {
        return t.card('attachments')
          .then(card => {
            const images = card.attachments.filter(
              a => a.url && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(a.url)
            );

            console.log(`📎 Found ${images.length} image attachment(s)`);

            return images.map(attachment => ({
              icon: `${BASE_URL}/icon.svg`,
              text: `Annotate: ${attachment.name}`,
              callback: t => t.modal({
                url: `${BASE_URL}/index.html?attachment=${attachment.id}`,
                fullscreen: true,
                title: 'Image Annotation'
              })
            }));
          })
          .catch(err => {
            console.error('❌ Error in card-buttons:', err);
            return [];
          });
      }
    });
  }
};

// Start
initPowerUp();
