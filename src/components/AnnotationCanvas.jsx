import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import PinMarker from './PinMarker';
import { toRelative } from '../utils/annotations';

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
    console.log('AnnotationCanvas useEffect: t =', t, 'attachment =', attachment);
    if (!attachment || !t) {
      console.log('AnnotationCanvas useEffect: attachment or t is null, returning early.');
      return;
    }

    // Helper to load image from a URL
    const loadImage = (url) => {
      console.log('AnnotationCanvas: Attempting to load image from URL:', url);
      const img = new window.Image();
      img.onload = () => {
        console.log('AnnotationCanvas: Image loaded successfully:', url);
        setImage(img);

        const scaleX = (containerWidth - 40) / img.width;
        const scaleY = (containerHeight - 40) / img.height;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
        setImageSize({
          width: img.width * newScale,
          height: img.height * newScale
        });
      };
      img.onerror = (err) => {
        console.error('AnnotationCanvas: Failed to load image:', url, err);
      };
      img.src = url;
    };

    try {
      const result = t.signUrl(attachment.url);
      
      if (result && typeof result.then === 'function') {
        console.log('AnnotationCanvas: signUrl returned a Promise.');
        result.then(loadImage).catch(err => {
          console.error('AnnotationCanvas: Error signing URL (async):', err);
          loadImage(attachment.url); // Fallback to original URL
        });
      } else if (typeof result === 'string') {
        console.log('AnnotationCanvas: signUrl returned a synchronous string.');
        loadImage(result);
      } else {
        console.error('AnnotationCanvas: signUrl returned an unexpected type:', result);
        loadImage(attachment.url); // Fallback to original URL
      }
    } catch (e) {
      console.error('AnnotationCanvas: Exception calling signUrl:', e);
      loadImage(attachment.url); // Fallback to original URL
    }
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
