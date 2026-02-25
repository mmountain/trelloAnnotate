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
      
      // Try loading WITHOUT crossOrigin first. Trello's download endpoints 
      // often don't support CORS or require specific auth that doesn't play 
      // well with 'Anonymous' crossOrigin requests.
      
      img.onload = () => {
        console.log('AnnotationCanvas: Image loaded successfully:', url, 'Dimensions:', img.width, 'x', img.height);
        setImage(img);

        // Avoid division by zero if container size isn't measured yet
        const effectiveWidth = containerWidth || window.innerWidth * 0.7;
        const effectiveHeight = containerHeight || window.innerHeight * 0.8;

        const scaleX = (effectiveWidth - 40) / img.width;
        const scaleY = (effectiveHeight - 40) / img.height;
        const newScale = Math.min(scaleX, scaleY, 1);

        console.log('AnnotationCanvas: Calculated scale:', newScale);
        setScale(newScale);
        setImageSize({
          width: img.width * newScale,
          height: img.height * newScale
        });
      };
      img.onerror = (err) => {
        console.error('AnnotationCanvas: Failed to load image without CORS:', url);
        
        // If it fails without CORS, try WITH Anonymous as a last resort
        // (though usually it's the other way around, for Trello specifically 
        // direct loading is often required)
        if (!img.crossOrigin) {
          console.log('AnnotationCanvas: Retrying with crossOrigin = Anonymous...');
          const retryImg = new window.Image();
          retryImg.crossOrigin = 'Anonymous';
          retryImg.onload = () => {
            console.log('AnnotationCanvas: Image loaded successfully with CORS:', url);
            setImage(retryImg);
            
            const effectiveWidth = containerWidth || window.innerWidth * 0.7;
            const effectiveHeight = containerHeight || window.innerHeight * 0.8;
            const scaleX = (effectiveWidth - 40) / retryImg.width;
            const scaleY = (effectiveHeight - 40) / retryImg.height;
            const newScale = Math.min(scaleX, scaleY, 1);
            
            setScale(newScale);
            setImageSize({
              width: retryImg.width * newScale,
              height: retryImg.height * newScale
            });
          };
          retryImg.onerror = () => {
            console.error('AnnotationCanvas: Final failure loading image even with CORS:', url);
          };
          retryImg.src = url;
        }
      };
      img.src = url;
    };

    const processAndLoadImage = (originalSignedUrl) => {
      console.log('AnnotationCanvas: Processing signed URL:', originalSignedUrl);
      let imageUrlToLoad = originalSignedUrl;
      
      try {
        // Handle relative URLs if any
        const baseUrl = window.location.origin;
        const urlObj = new URL(originalSignedUrl, baseUrl);
        
        // Check if there's a hash fragment that contains Trello's secret/context
        if (urlObj.hash && urlObj.hash.length > 1) {
          try {
            const hashContent = decodeURIComponent(urlObj.hash.substring(1));
            // Only try to parse if it looks like JSON
            if (hashContent.startsWith('{')) {
              const hashParams = JSON.parse(hashContent);
              
              if (hashParams.secret) {
                urlObj.searchParams.set('secret', hashParams.secret);
              }
              if (hashParams.context) {
                // If context is an object, stringify it, otherwise use it as is
                const contextValue = typeof hashParams.context === 'object' 
                  ? JSON.stringify(hashParams.context) 
                  : hashParams.context;
                urlObj.searchParams.set('context', contextValue);
              }
              urlObj.hash = ''; // Clear the hash fragment after processing
              
              // ENSURE the URL is correctly reconstructed
              imageUrlToLoad = urlObj.toString();
              console.log('AnnotationCanvas: Extracted parameters from JSON hash fragment.');
            } else if (hashContent.includes('=')) {
              // Handle key=value format in hash if it exists
              const params = new URLSearchParams(hashContent);
              params.forEach((value, key) => {
                urlObj.searchParams.set(key, value);
              });
              urlObj.hash = '';
              imageUrlToLoad = urlObj.toString();
              console.log('AnnotationCanvas: Extracted params from non-JSON hash fragment.');
            }
          } catch (hashError) {
            console.warn('AnnotationCanvas: Could not parse hash fragment, using original URL:', hashError);
          }
        }
      } catch (e) {
        console.warn('AnnotationCanvas: URL parsing failed, using original string:', e);
      }
      
      console.log('AnnotationCanvas: Final URL to load:', imageUrlToLoad);
      loadImage(imageUrlToLoad);
    };

    try {
      const result = t.signUrl(attachment.url);
      
      if (result && typeof result.then === 'function') {
        console.log('AnnotationCanvas: signUrl returned a Promise.');
        result.then(processAndLoadImage).catch(err => {
          console.error('AnnotationCanvas: Error signing URL (async):', err);
          loadImage(attachment.url); // Fallback to original URL if signing fails
        });
      } else if (typeof result === 'string') {
        console.log('AnnotationCanvas: signUrl returned a synchronous string.');
        processAndLoadImage(result);
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
