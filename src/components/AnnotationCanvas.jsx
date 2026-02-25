import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import PinMarker from './PinMarker';
import { toRelative } from '../utils/annotations';

// Your Trello API key from https://trello.com/app-key
// Required so the modal can download private attachment images via the REST API.
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
  // Auth states: 'checking' | 'auth-needed' | 'loading' | 'done'
  const [authState, setAuthState] = useState('checking');
  const [authToken, setAuthToken] = useState(null);
  const [useDirectLoad, setUseDirectLoad] = useState(!TRELLO_API_KEY);

  const stageRef = useRef();
  const objectUrlRef = useRef(null);

  // Helper: create an Image element from a URL and update canvas state
  const applyImageUrl = (url) => {
    const img = new window.Image();
    img.onload = () => {
      setImage(img);
      const effectiveWidth = containerWidth || window.innerWidth * 0.7;
      const effectiveHeight = containerHeight || window.innerHeight * 0.8;
      const scaleX = (effectiveWidth - 40) / img.width;
      const scaleY = (effectiveHeight - 40) / img.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setImageSize({
        width: img.width * newScale,
        height: img.height * newScale
      });
      setAuthState('done');
    };
    img.onerror = () => {
      console.error('AnnotationCanvas: Failed to load image:', url);
    };
    img.src = url;
  };

  // Helper: fetch image via Trello REST API and display as blob URL
  const loadWithToken = (token) => {
    const apiUrl = attachment.url.replace('https://trello.com/', 'https://api.trello.com/')
      + '?key=' + TRELLO_API_KEY + '&token=' + token;

    fetch(apiUrl)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      })
      .then(blob => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(blob);
        applyImageUrl(objectUrlRef.current);
      })
      .catch(err => {
        console.error('AnnotationCanvas: REST API fetch failed:', err);
        applyImageUrl(attachment.url);
      });
  };

  // Step 1: On mount, check if already authorized. If so, get token and load image.
  // If not, show authorize button (getToken() needs a user gesture to open the popup).
  useEffect(() => {
    if (!attachment || !t) return;

    if (!TRELLO_API_KEY) {
      setUseDirectLoad(true);
      return;
    }

    t.getRestApi().isAuthorized()
      .then(isAuth => {
        if (isAuth) {
          return t.getRestApi().getToken().then(tok => {
            if (tok) {
              setAuthToken(tok);
            } else {
              setUseDirectLoad(true);
            }
          });
        } else {
          setAuthState('auth-needed');
        }
      })
      .catch(() => {
        setAuthState('auth-needed');
      });

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [attachment, t]);

  // Step 2: Load image when we have a token or are using direct load
  useEffect(() => {
    if (!attachment) return;
    if (TRELLO_API_KEY && !authToken && !useDirectLoad) return;

    setImage(null);
    setImageSize({ width: 0, height: 0 });

    if (TRELLO_API_KEY && authToken) {
      loadWithToken(authToken);
    } else {
      applyImageUrl(attachment.url);
    }
  }, [attachment, authToken, useDirectLoad, containerWidth, containerHeight]);

  // Handle authorize button click — must be a user gesture so the popup is allowed
  const handleAuthorize = () => {
    t.getRestApi().getToken()
      .then(tok => {
        if (tok) {
          setAuthState('loading');
          setAuthToken(tok);
        } else {
          setUseDirectLoad(true);
        }
      })
      .catch(err => {
        console.error('AnnotationCanvas: Authorization failed:', err);
        setUseDirectLoad(true);
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
