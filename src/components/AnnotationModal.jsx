import React, { useState, useEffect, useRef } from 'react';
import AnnotationCanvas from './AnnotationCanvas';
import CommentPanel from './CommentPanel';
import { useAnnotations } from '../hooks/useAnnotations';
import { createPin } from '../utils/annotations';

function AnnotationModal({ t, attachment }) {
  const [currentTool, setCurrentTool] = useState('select');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [pendingPin, setPendingPin] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [highlightedPinId, setHighlightedPinId] = useState(null);

  const containerRef = useRef(null);

  // Use annotations hook
  const {
    annotations,
    loading,
    saving,
    storageInfo,
    error,
    addPin,
    updatePin,
    deletePin,
    getNextPinNumber
  } = useAnnotations(t, attachment.id);

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: panelCollapsed ? rect.width : rect.width * 0.7,
          height: rect.height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, [panelCollapsed]);

  // Handle pin addition
  const handleAddPin = (x, y) => {
    const pinNumber = getNextPinNumber();
    setPendingPin({ x, y, pinNumber });
    setShowCommentDialog(true);
  };

  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();

    if (!pendingPin || !commentText.trim()) {
      return;
    }

    // Create pin annotation
    const pin = createPin(
      pendingPin.x,
      pendingPin.y,
      pendingPin.pinNumber,
      commentText.trim()
    );

    // Add to annotations
    addPin(pin);

    // Reset state
    setCommentText('');
    setPendingPin(null);
    setShowCommentDialog(false);
    setCurrentTool('select');
  };

  // Handle comment cancel
  const handleCommentCancel = () => {
    setCommentText('');
    setPendingPin(null);
    setShowCommentDialog(false);
    setCurrentTool('select');
  };

  // Handle mark pin as done/open
  const handleMarkDone = (pinId) => {
    const pin = annotations.pins.find(p => p.id === pinId);
    if (pin) {
      const newStatus = pin.s === 'done' ? 'open' : 'done';
      updatePin(pinId, { s: newStatus });
    }
  };

  // Handle delete pin
  const handleDeletePin = (pinId) => {
    deletePin(pinId);
  };

  // Handle highlight pin from comment panel
  const handleHighlightAnnotation = (pinId) => {
    setHighlightedPinId(pinId);
    setTimeout(() => setHighlightedPinId(null), 2000);
  };

  // Handle close modal
  const handleClose = () => {
    if (saving) {
      if (!window.confirm('Annotations are still saving. Close anyway?')) {
        return;
      }
    }
    t.closeModal();
  };

  return (
    <div className="annotation-modal">
      {/* Header */}
      <div className="annotation-modal-header">
        <div className="header-left">
          <h2>{attachment.name}</h2>
          {loading && <span className="loading-indicator">Loading...</span>}
          {saving && <span className="saving-indicator">Saving...</span>}
        </div>

        <div className="header-right">
          {/* Storage info */}
          {storageInfo && (
            <div className={`storage-info ${storageInfo.nearLimit ? 'warning' : ''}`}>
              <span>{storageInfo.sizeFormatted} / 4.00KB</span>
              {storageInfo.nearLimit && <span className="warning-icon">⚠</span>}
            </div>
          )}

          {/* Toolbar */}
          <div className="toolbar">
            <button
              className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
              onClick={() => setCurrentTool('select')}
              title="Select (Esc)"
            >
              👆 Select
            </button>
            <button
              className={`tool-btn ${currentTool === 'pin' ? 'active' : ''}`}
              onClick={() => setCurrentTool('pin')}
              title="Add Pin (P)"
            >
              📍 Pin
            </button>
          </div>

          <button className="close-button" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Main content */}
      <div className="annotation-modal-body">
        <div className="canvas-area" ref={containerRef}>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading annotations...</p>
            </div>
          ) : (
            <AnnotationCanvas
              t={t}
              attachment={attachment}
              annotations={annotations}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              currentTool={currentTool}
              onAddPin={handleAddPin}
              highlightedPinId={highlightedPinId}
            />
          )}
        </div>

        {/* Comment Panel */}
        <CommentPanel
          annotations={annotations}
          attachmentName={attachment.name}
          onMarkDone={handleMarkDone}
          onDelete={handleDeletePin}
          onHighlightAnnotation={handleHighlightAnnotation}
          t={t}
          isCollapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed(!panelCollapsed)}
        />
      </div>

      {/* Comment Dialog */}
      {showCommentDialog && (
        <div className="modal-overlay" onClick={handleCommentCancel}>
          <div className="comment-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="comment-dialog-header">
              <h3>Add Comment to Pin #{pendingPin?.pinNumber}</h3>
            </div>

            <form onSubmit={handleCommentSubmit}>
              <div className="comment-dialog-body">
                <textarea
                  autoFocus
                  placeholder="Enter your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                  className="comment-textarea"
                />
                <small className="hint">This comment will be stored in the annotation. You can copy it to Trello card comments later.</small>
              </div>

              <div className="comment-dialog-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCommentCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!commentText.trim()}
                >
                  Add Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="annotation-modal-footer">
        <p className="footer-text">Image Annotator v1.0 - Phase 2</p>
      </div>
    </div>
  );
}

export default AnnotationModal;
