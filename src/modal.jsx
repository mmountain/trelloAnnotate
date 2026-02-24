import React from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

const t = window.TrelloPowerUps.iframe();

const urlParams = new URLSearchParams(window.location.search);
const attachmentId = urlParams.get('attachment');

if (attachmentId) {
  t.card('attachments').then(card => {
    const attachment = card.attachments.find(a => a.id === attachmentId);

    if (attachment) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <React.StrictMode>
          <AnnotationModal t={t} attachment={attachment} />
        </React.StrictMode>
      );
    }
  });
}
