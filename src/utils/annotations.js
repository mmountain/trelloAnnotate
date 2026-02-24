/**
 * Helper utilities for working with annotations
 */

/**
 * Generate a unique ID for annotations
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp in seconds
 * @returns {number} Timestamp in seconds
 */
export function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Format timestamp for display
 * @param {number} timestamp - Timestamp in seconds
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Create a new pin annotation
 * @param {number} x - Relative X position (0-1)
 * @param {number} y - Relative Y position (0-1)
 * @param {number} pinNumber - Pin number
 * @param {string} commentText - Comment text
 * @returns {Object} Pin annotation object
 */
export function createPin(x, y, pinNumber, commentText = '') {
  return {
    id: generateId(),
    x,
    y,
    n: pinNumber,
    comment: commentText,
    cid: null, // Trello comment ID (set later)
    s: 'open', // Status: 'open' | 'done'
    t: getTimestamp()
  };
}

/**
 * Create a new drawing annotation
 * @param {string} type - Drawing type ('line' or 'arrow')
 * @param {Array} points - Array of [x, y] coordinates (relative 0-1)
 * @param {string} color - Hex color
 * @param {number} strokeWidth - Stroke width
 * @returns {Object} Drawing annotation object
 */
export function createDrawing(type, points, color, strokeWidth) {
  return {
    id: generateId(),
    t: type,
    pts: points,
    c: color,
    w: strokeWidth,
    cid: null,
    created: getTimestamp()
  };
}

/**
 * Create a new highlight annotation
 * @param {string} type - Highlight type ('rect' or 'circle')
 * @param {number} x - Relative X position (0-1)
 * @param {number} y - Relative Y position (0-1)
 * @param {number} width - Relative width (0-1)
 * @param {number} height - Relative height (0-1)
 * @param {string} color - Hex color
 * @param {number} opacity - Opacity (0-1)
 * @returns {Object} Highlight annotation object
 */
export function createHighlight(type, x, y, width, height, color, opacity) {
  return {
    id: generateId(),
    t: type,
    x,
    y,
    w: width,
    h: height,
    c: color,
    o: opacity,
    cid: null,
    created: getTimestamp()
  };
}

/**
 * Calculate distance between two points
 * @param {Object} p1 - Point 1 {x, y}
 * @param {Object} p2 - Point 2 {x, y}
 * @returns {number} Distance
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate perpendicular distance from point to line
 * @param {Object} point - Point {x, y}
 * @param {Object} lineStart - Line start {x, y}
 * @param {Object} lineEnd - Line end {x, y}
 * @returns {number} Perpendicular distance
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };

  return distance(point, projection);
}

/**
 * Simplify drawing points using Douglas-Peucker algorithm
 * Reduces number of points while maintaining visual fidelity
 * @param {Array} points - Array of [x, y] coordinate pairs
 * @param {number} tolerance - Simplification tolerance (default 0.002)
 * @returns {Array} Simplified points array
 */
export function simplifyPoints(points, tolerance = 0.002) {
  if (points.length <= 2) return points;

  // Convert to objects for easier calculation
  const pointObjs = points.map(([x, y]) => ({ x, y }));

  // Recursive Douglas-Peucker
  function douglasPeucker(pts, epsilon) {
    if (pts.length <= 2) return pts;

    let maxDist = 0;
    let maxIndex = 0;

    const lineStart = pts[0];
    const lineEnd = pts[pts.length - 1];

    for (let i = 1; i < pts.length - 1; i++) {
      const dist = perpendicularDistance(pts[i], lineStart, lineEnd);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > epsilon) {
      const left = douglasPeucker(pts.slice(0, maxIndex + 1), epsilon);
      const right = douglasPeucker(pts.slice(maxIndex), epsilon);
      return [...left.slice(0, -1), ...right];
    }

    return [pts[0], pts[pts.length - 1]];
  }

  const simplified = douglasPeucker(pointObjs, tolerance);

  // Convert back to arrays
  return simplified.map(p => [p.x, p.y]);
}

/**
 * Convert absolute coordinates to relative (0-1 range)
 * @param {number} absoluteValue - Absolute pixel value
 * @param {number} maxValue - Maximum value (image width or height)
 * @returns {number} Relative value (0-1)
 */
export function toRelative(absoluteValue, maxValue) {
  return maxValue > 0 ? absoluteValue / maxValue : 0;
}

/**
 * Convert relative coordinates to absolute pixels
 * @param {number} relativeValue - Relative value (0-1)
 * @param {number} maxValue - Maximum value (image width or height)
 * @returns {number} Absolute pixel value
 */
export function toAbsolute(relativeValue, maxValue) {
  return relativeValue * maxValue;
}

/**
 * Check if a point is near a pin (for click detection)
 * @param {Object} clickPos - Click position {x, y} (absolute)
 * @param {Object} pin - Pin annotation
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @param {number} threshold - Detection threshold in pixels
 * @returns {boolean} True if near pin
 */
export function isNearPin(clickPos, pin, imageWidth, imageHeight, threshold = 20) {
  const pinX = toAbsolute(pin.x, imageWidth);
  const pinY = toAbsolute(pin.y, imageHeight);

  const dist = distance(clickPos, { x: pinX, y: pinY });
  return dist <= threshold;
}

/**
 * Get all annotations with comments
 * @param {Object} annotations - Annotations object
 * @returns {Array} Array of annotations with comments
 */
export function getAnnotationsWithComments(annotations) {
  if (!annotations) return [];

  const result = [];

  // Add pins with comments
  if (annotations.pins) {
    annotations.pins.forEach(pin => {
      if (pin.comment) {
        result.push({
          type: 'pin',
          id: pin.id,
          number: pin.n,
          comment: pin.comment,
          status: pin.s,
          timestamp: pin.t,
          data: pin
        });
      }
    });
  }

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Count total annotations
 * @param {Object} annotations - Annotations object
 * @returns {Object} Count by type
 */
export function countAnnotations(annotations) {
  if (!annotations) {
    return { pins: 0, drawings: 0, highlights: 0, total: 0 };
  }

  const pins = annotations.pins?.length || 0;
  const drawings = annotations.drawings?.length || 0;
  const highlights = annotations.highlights?.length || 0;

  return {
    pins,
    drawings,
    highlights,
    total: pins + drawings + highlights
  };
}

/**
 * Filter annotations by status
 * @param {Object} annotations - Annotations object
 * @param {string} status - Status to filter ('open' or 'done')
 * @returns {Object} Filtered annotations
 */
export function filterByStatus(annotations, status) {
  if (!annotations) return null;

  return {
    ...annotations,
    pins: annotations.pins?.filter(p => p.s === status) || []
  };
}
