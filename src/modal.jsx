import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AnnotationModal from './components/AnnotationModal';
import './styles/main.css';

function App() {
  const [t, setT] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.TrelloPowerUps) {
      setError('TrelloPowerUps library not found. Ensure this is running as a Trello Power-Up.');
      setLoading(false);
      return;
    }

    try {
      const tInstance = window.TrelloPowerUps.iframe();
      setT(tInstance);

      const urlParams = new URLSearchParams(window.location.search);
      const attachmentId = urlParams.get('attachment');

      if (!attachmentId) {
        setError('No attachment ID provided in URL.');
        setLoading(false);
        return;
      }

      // Add a timeout in case Trello doesn't respond
      const timeout = setTimeout(() => {
        if (loading) {
          setError('Timed out waiting for Trello to respond.');
          setLoading(false);
        }
      }, 10000);

      tInstance.card('attachments')
        .then(card => {
          clearTimeout(timeout);
          const found = card.attachments.find(a => a.id === attachmentId);
          if (found) {
            setAttachment(found);
          } else {
            setError('Attachment not found on this card.');
          }
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeout);
          console.error('Error fetching card attachments:', err);
          setError('Failed to load card attachments from Trello.');
          setLoading(false);
        });
    } catch (e) {
      console.error('Initialization error:', e);
      setError('Initialization failed: ' + e.message);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Connecting to Trello...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()} className="close-button" style={{marginTop: '20px'}}>
          Retry
        </button>
      </div>
    );
  }

  if (t && attachment) {
    return (
      <React.StrictMode>
        <AnnotationModal t={t} attachment={attachment} />
      </React.StrictMode>
    );
  }

  return null;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
