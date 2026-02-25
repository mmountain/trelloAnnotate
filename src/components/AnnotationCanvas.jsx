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
  const [scale, setScale] = useState(1);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [hoveredPinId, setHoveredPinId] = useState(null);

  const stageRef = useRef();

  // Load image
  useEffect(() => {
    if (!attachment || !t) return;

    let objectUrl = null;

    const img = new window.Image();

    img.onload = () => {
      setImage(img);
      const effectiveWidth = containerWidth || window.innerWidth * 0.7;
      const effectiveHeight = containerHeight || window.innerHeight * 0.8;
      const scaleX = (effectiveWidth - 40) / img.width;
      const scaleY = (effectiveHeight - 40) / img.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
      setImageSize({
        width: img.width * newScale,
        height: img.height * newScale
      });
    };

    img.onerror = () => {
      console.error('AnnotationCanvas: Failed to load image:', attachment.url);
    };

    // Trello attachment URLs (trello.com/1/cards/.../download/...) require auth.
    // Cookies are not sent cross-origin (SameSite=Lax). We use the REST API:
    // api.trello.com supports CORS and the redirect target (CDN) also allows it.
    if (TRELLO_API_KEY) {
      t.getRestApi()
        .getToken()
        .then(token => {
          const apiUrl = attachment.url.replace('https://trello.com/', 'https://api.trello.com/')
            + '?key=' + TRELLO_API_KEY + '&token=' + token;
          return fetch(apiUrl);
        })
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.blob();
        })
        .then(blob => {
          objectUrl = URL.createObjectURL(blob);
          img.src = objectUrl;
        })
        .catch(err => {
          console.error('AnnotationCanvas: REST API fetch failed:', err);
          img.src = attachment.url;
        });
    } else {
      // No API key configured — try direct load (works for public/external attachments)
      img.src = attachment.url;
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment, t, containerWidth, containerHeight]);

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
