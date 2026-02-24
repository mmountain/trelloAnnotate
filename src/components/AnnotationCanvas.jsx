import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import PinMarker from './PinMarker';
import { toRelative } from '../utils/annotations';

/**
 * Annotation canvas component using Konva for rendering
 * Handles image display and pin annotations
 */
function AnnotationCanvas({
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
    if (!attachment) return;

    const img = new window.Image();
    
    // Choose the best URL: Prefer the largest preview as they are often
    // served with better CORS support than the direct download link
    let sourceUrl = attachment.url;
    if (attachment.previews && attachment.previews.length > 0) {
      const largestPreview = [...attachment.previews].sort((a, b) => b.width - a.width)[0];
      if (largestPreview) {
        sourceUrl = largestPreview.url;
      }
    }

    img.onload = () => {
      setImage(img);

      // Calculate scale to fit container
      const scaleX = (containerWidth - 40) / img.width;
      const scaleY = (containerHeight - 40) / img.height;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up

      setScale(newScale);
      setImageSize({
        width: img.width * newScale,
        height: img.height * newScale
      });
    };
    img.onerror = (err) => {
      console.error('Failed to load image:', err);
    };
    img.src = sourceUrl;
  }, [attachment, containerWidth, containerHeight]);

  // Handle stage click for adding pins
  const handleStageClick = (e) => {
    // Only process clicks on the stage itself (not on pins)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';

    if (clickedOnEmpty && currentTool === 'pin') {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();

      // Convert to relative coordinates (0-1 range)
      const relativeX = toRelative(pointerPosition.x, imageSize.width);
      const relativeY = toRelative(pointerPosition.y, imageSize.height);

      // Trigger pin creation
      if (onAddPin) {
        onAddPin(relativeX, relativeY);
      }
    } else if (clickedOnEmpty) {
      // Deselect when clicking on empty space
      setSelectedPinId(null);
    }
  };

  // Handle pin click
  const handlePinClick = (pinId) => {
    setSelectedPinId(pinId);
  };

  // Highlight pin from comment panel
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
        {/* Image Layer */}
        <Layer>
          <Image
            image={image}
            width={imageSize.width}
            height={imageSize.height}
          />
        </Layer>

        {/* Annotation Layer */}
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

      {/* Canvas info overlay */}
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
