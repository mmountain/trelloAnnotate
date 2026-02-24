import React, { useState } from 'react';
import { formatTimestamp } from '../utils/annotations';
import { formatPinComment, copyCommentToClipboard } from '../utils/trello-sync';

/**
 * Comment thread component for displaying annotation comments
 */
function CommentThread({ annotation, attachmentName, onMarkDone, onDelete, onHighlight, t }) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMarkDone = () => {
    onMarkDone(annotation.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this annotation?')) {
      setIsDeleting(true);
      onDelete(annotation.id);
    }
  };

  const handleCopyToTrello = async () => {
    const commentText = formatPinComment(annotation.number, annotation.comment, attachmentName);
    await copyCommentToClipboard(t, commentText);
  };

  const handleHighlight = () => {
    if (onHighlight) {
      onHighlight(annotation.id);
    }
  };

  const isDone = annotation.status === 'done';

  return (
    <div
      className={`comment-thread ${isDone ? 'done' : ''} ${isDeleting ? 'deleting' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleHighlight}
    >
      <div className="comment-header">
        <div className="comment-pin-badge">
          Pin #{annotation.number}
        </div>
        <div className="comment-timestamp">
          {formatTimestamp(annotation.timestamp)}
        </div>
      </div>

      <div className="comment-body">
        <p className={isDone ? 'strikethrough' : ''}>{annotation.comment}</p>
      </div>

      <div className={`comment-actions ${showActions ? 'visible' : ''}`}>
        {!isDone && (
          <button
            className="comment-action-btn mark-done"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkDone();
            }}
            title="Mark as done"
          >
            ✓ Done
          </button>
        )}

        {isDone && (
          <button
            className="comment-action-btn reopen"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkDone();
            }}
            title="Reopen"
          >
            ↻ Reopen
          </button>
        )}

        <button
          className="comment-action-btn copy"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyToTrello();
          }}
          title="Copy to Trello comments"
        >
          📋 Copy to Trello
        </button>

        <button
          className="comment-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          title="Delete annotation"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}

export default CommentThread;
