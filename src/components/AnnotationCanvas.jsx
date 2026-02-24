import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import PinMarker from './PinMarker';
import { toRelative } from '../utils/annotations';

/**
 * Annotation canvas component using Konva for rendering
 * Handles image display and pin annotations
 */
function AnnotationCanvas({
  imageUrl,
  imageName,
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
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
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
    img.src = imageUrl;
  }, [imageUrl, containerWidth, containerHeight]);

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
        <p>Loading canvas...</p>
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
