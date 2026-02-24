import React, { useState } from 'react';
import CommentThread from './CommentThread';
import { getAnnotationsWithComments, countAnnotations } from '../utils/annotations';

/**
 * Comment panel component for displaying and managing annotation comments
 */
function CommentPanel({ annotations, attachmentName, onMarkDone, onDelete, onHighlightAnnotation, t, isCollapsed, onToggleCollapse }) {
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'done'

  if (!annotations) {
    return null;
  }

  // Get all annotations with comments
  const annotationsWithComments = getAnnotationsWithComments(annotations);

  // Filter based on selected filter
  const filteredAnnotations = annotationsWithComments.filter(ann => {
    if (filter === 'all') return true;
    return ann.status === filter;
  });

  // Get counts
  const counts = countAnnotations(annotations);
  const openCount = annotationsWithComments.filter(a => a.status === 'open').length;
  const doneCount = annotationsWithComments.filter(a => a.status === 'done').length;

  return (
    <div className={`comment-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="comment-panel-header">
        <h3>Comments ({annotationsWithComments.length})</h3>
        <button className="collapse-btn" onClick={onToggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
          {isCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="comment-panel-stats">
            <div className="stat">
              <span className="stat-label">Pins:</span>
              <span className="stat-value">{counts.pins}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Drawings:</span>
              <span className="stat-value">{counts.drawings}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Highlights:</span>
              <span className="stat-value">{counts.highlights}</span>
            </div>
          </div>

          <div className="comment-panel-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({annotationsWithComments.length})
            </button>
            <button
              className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open ({openCount})
            </button>
            <button
              className={`filter-btn ${filter === 'done' ? 'active' : ''}`}
              onClick={() => setFilter('done')}
            >
              Done ({doneCount})
            </button>
          </div>

          <div className="comment-panel-list">
            {filteredAnnotations.length === 0 && (
              <div className="no-comments">
                <p>No {filter !== 'all' ? filter : ''} comments yet</p>
                <small>Click on the image to add a pin annotation</small>
              </div>
            )}

            {filteredAnnotations.map(annotation => (
              <CommentThread
                key={annotation.id}
                annotation={annotation}
                attachmentName={attachmentName}
                onMarkDone={onMarkDone}
                onDelete={onDelete}
                onHighlight={onHighlightAnnotation}
                t={t}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CommentPanel;
