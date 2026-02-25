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

  // Load image from any URL. Uses img.src (not fetch) so CORS is not enforced
  // for display. Canvas becomes tainted for pixel-readback but display works fine.
  const applyImageUrl = (url) => {
    console.log('AnnotationCanvas: Loading image from', url.replace(/token=[^&]+/, 'token=***'));
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
      console.error('AnnotationCanvas: Failed to load image:', url.replace(/token=[^&]+/, 'token=***'));
    };
    img.src = url;
  };

  // Build authenticated API URL and load via img.src
  const loadWithToken = (token) => {
    console.log('AnnotationCanvas: Got token, building authenticated URL');
    const apiUrl = attachment.url.replace('https://trello.com/', 'https://api.trello.com/')
      + '?key=' + TRELLO_API_KEY + '&token=' + token;
    applyImageUrl(apiUrl);
  };

  // On mount: check if already authorized. If so, load immediately.
  // If not, show the Authorize button (getToken needs a user gesture for the popup).
  useEffect(() => {
    if (!attachment || !t) return;

    if (!TRELLO_API_KEY) {
      applyImageUrl(attachment.url);
      return;
    }

    t.getRestApi().isAuthorized()
      .then(isAuth => {
        console.log('AnnotationCanvas: isAuthorized =', isAuth);
        if (isAuth) {
          return t.getRestApi().getToken().then(tok => {
            console.log('AnnotationCanvas: token received =', tok ? 'yes' : 'null/undefined');
            if (tok) {
              loadWithToken(tok);
            } else {
              // Authorized but no token — fall back to direct
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

  // Handle authorize button click — must be a user gesture so the popup is allowed
  // authorize() triggers the OAuth consent popup (requires user gesture).
  // getToken() only retrieves an already-stored token — it does NOT show a popup.
  const handleAuthorize = () => {
    console.log('AnnotationCanvas: Authorize button clicked, calling authorize()');
    const restApi = t.getRestApi();
    restApi.authorize({ expiration: 'never' })
      .then(() => {
        console.log('AnnotationCanvas: authorize() resolved, fetching token');
        return restApi.getToken();
      })
      .then(tok => {
        console.log('AnnotationCanvas: getToken() resolved, token =', tok ? 'yes' : 'null/undefined');
        if (tok) {
          setAuthState('loading');
          loadWithToken(tok);
        } else {
          console.warn('AnnotationCanvas: token still null after authorize, falling back to direct load');
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
