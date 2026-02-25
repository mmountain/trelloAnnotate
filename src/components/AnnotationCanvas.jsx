import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import PinMarker from './PinMarker';
import { toRelative } from '../utils/annotations';

// Your Trello API key from https://trello.com/app-key
const TRELLO_API_KEY = 'cdfdc22c8653b60a6b7a11f38be79ae1';

/**
 * Annotation canvas component using Konva for rendering
 * Handles image display and pin annotations
 */
function AnnotationCanvas({
  t,
  attachment,
  annotations,
  containerWidth,
  containerHeight,
  currentTool,
  onAddPin,
  highlightedPinId
}) {
  const [image, setImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [hoveredPinId, setHoveredPinId] = useState(null);
  // 'checking' | 'auth-needed' | 'loading' | 'done'
  const [authState, setAuthState] = useState('checking');

  const stageRef = useRef();

  // Load image from any URL via img.src (bypasses CORS for display-only use)
  const applyImageUrl = (url) => {
    const safeLog = url.replace(/token=[^&]+/, 'token=***');
    console.log('AnnotationCanvas: applyImageUrl ->', safeLog);
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      const effectiveWidth = containerWidth || window.innerWidth * 0.7;
      const effectiveHeight = containerHeight || window.innerHeight * 0.8;
      const scaleX = (effectiveWidth - 40) / img.width;
      const scaleY = (effectiveHeight - 40) / img.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setImageSize({ width: img.width * newScale, height: img.height * newScale });
      setAuthState('done');
    };
    img.onerror = () => {
      console.error('AnnotationCanvas: Failed to load image:', safeLog);
    };
    img.src = url;
  };

  // Pick the best (largest) preview from an array; returns null if empty
  const bestPreview = (previews) => {
    if (!previews || previews.length === 0) return null;
    return previews.reduce((a, b) => (a.width > b.width ? a : b));
  };

  // Load image using REST API:
  //  1. Fetch attachment metadata (JSON, CORS-compatible) to get preview CDN URLs
  //  2. Use the largest preview via img.src (CDN URLs load without auth cross-origin)
  //  3. If no previews, fall back to img.src on the download URL (may fail for private boards)
  const loadWithToken = (token) => {
    // First check if the attachment object already carries previews
    const local = bestPreview(attachment.previews);
    if (local) {
      console.log(`AnnotationCanvas: Using attachment.previews (${local.width}x${local.height})`);
      applyImageUrl(local.url);
      return;
    }

    // Otherwise fetch the attachment metadata from the REST API
    const cardMatch = attachment.url.match(/\/cards\/([^\/]+)\//);
    if (!cardMatch) {
      console.error('AnnotationCanvas: Cannot parse card ID from URL, trying direct load');
      applyImageUrl(attachment.url);
      return;
    }
    const cardId = cardMatch[1];

    console.log('AnnotationCanvas: Fetching attachment metadata from REST API');
    fetch(
      `https://api.trello.com/1/cards/${cardId}/attachments/${attachment.id}` +
      `?key=${TRELLO_API_KEY}&token=${token}`
    )
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        const preview = bestPreview(data.previews);
        if (preview) {
          console.log(`AnnotationCanvas: Using REST API preview (${preview.width}x${preview.height})`);
          applyImageUrl(preview.url);
        } else {
          console.warn('AnnotationCanvas: No previews returned, trying direct download URL');
          applyImageUrl(attachment.url);
        }
      })
      .catch(err => {
        console.error('AnnotationCanvas: Metadata fetch failed:', err);
        applyImageUrl(attachment.url);
      });
  };

  // On mount: check authorization. If already authorized, load immediately.
  // If not, show the Authorize button — getToken/authorize need a user gesture for the popup.
  useEffect(() => {
    if (!attachment || !t) return;

    console.log('AnnotationCanvas: attachment keys:', Object.keys(attachment));
    console.log('AnnotationCanvas: previews in attachment:', (attachment.previews || []).length);

    if (!TRELLO_API_KEY) {
      applyImageUrl(attachment.url);
      return;
    }

    t.getRestApi().isAuthorized()
      .then(isAuth => {
        console.log('AnnotationCanvas: isAuthorized =', isAuth);
        if (isAuth) {
          return t.getRestApi().getToken().then(tok => {
            if (tok) {
              loadWithToken(tok);
            } else {
              applyImageUrl(attachment.url);
            }
          });
        } else {
          setAuthState('auth-needed');
        }
      })
      .catch(err => {
        console.error('AnnotationCanvas: isAuthorized check failed:', err);
        setAuthState('auth-needed');
      });
  }, [attachment, t]);

  // authorize() shows the OAuth consent popup (requires user gesture).
  // getToken() only retrieves an already-stored token.
  const handleAuthorize = () => {
    console.log('AnnotationCanvas: Authorize button clicked');
    const restApi = t.getRestApi();
    restApi.authorize({ expiration: 'never' })
      .then(() => {
        console.log('AnnotationCanvas: authorize() resolved, fetching token');
        return restApi.getToken();
      })
      .then(tok => {
        console.log('AnnotationCanvas: token =', tok ? 'yes' : 'null/undefined');
        if (tok) {
          setAuthState('loading');
          loadWithToken(tok);
        } else {
          applyImageUrl(attachment.url);
        }
      })
      .catch(err => {
        console.error('AnnotationCanvas: authorize() failed:', err);
        applyImageUrl(attachment.url);
      });
  };

  // Handle stage click for adding pins
  const handleStageClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';

    if (clickedOnEmpty && currentTool === 'pin') {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();

      const relativeX = toRelative(pointerPosition.x, imageSize.width);
      const relativeY = toRelative(pointerPosition.y, imageSize.height);

      if (onAddPin) {
        onAddPin(relativeX, relativeY);
      }
    } else if (clickedOnEmpty) {
      setSelectedPinId(null);
    }
  };

  const handlePinClick = (pinId) => {
    setSelectedPinId(pinId);
  };

  useEffect(() => {
    if (highlightedPinId) {
      setSelectedPinId(highlightedPinId);
    }
  }, [highlightedPinId]);

  if (authState === 'auth-needed') {
    return (
      <div className="canvas-loading">
        <p>Authorization required to load this image.</p>
        <button className="btn-authorize" onClick={handleAuthorize}>
          Authorize Image Access
        </button>
      </div>
    );
  }

  if (!image || !imageSize.width) {
    return (
      <div className="canvas-loading">
        <div className="spinner"></div>
        <p>Loading image...</p>
      </div>
    );
  }

  return (
    <div className="annotation-canvas-container">
      <Stage
        ref={stageRef}
        width={imageSize.width}
        height={imageSize.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ cursor: currentTool === 'pin' ? 'crosshair' : 'default' }}
      >
        <Layer>
          <Image
            image={image}
            width={imageSize.width}
            height={imageSize.height}
          />
        </Layer>

        <Layer>
          {annotations && annotations.pins && annotations.pins.map(pin => (
            <PinMarker
              key={pin.id}
              pin={pin}
              imageWidth={imageSize.width}
              imageHeight={imageSize.height}
              isSelected={selectedPinId === pin.id}
              isHovered={hoveredPinId === pin.id}
              onClick={() => handlePinClick(pin.id)}
              onMouseEnter={() => setHoveredPinId(pin.id)}
              onMouseLeave={() => setHoveredPinId(null)}
            />
          ))}
        </Layer>
      </Stage>

      <div className="canvas-info">
        <span className="canvas-tool-indicator">
          {currentTool === 'pin' && '📍 Pin Mode - Click to add pin'}
          {currentTool === 'select' && '👆 Select Mode - Click pins to select'}
        </span>
      </div>
    </div>
  );
}

export default AnnotationCanvas;
