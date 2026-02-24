import React from 'react';
import { Group, Circle, Text } from 'react-konva';

/**
 * Pin marker component for Konva canvas
 * Renders a numbered pin annotation
 */
function PinMarker({ pin, imageWidth, imageHeight, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) {
  // Convert relative coordinates to absolute
  const absoluteX = pin.x * imageWidth;
  const absoluteY = pin.y * imageHeight;

  // Pin colors based on status
  const fillColor = pin.s === 'done' ? '#4CAF50' : '#FF5722';
  const strokeColor = isSelected ? '#2196F3' : '#ffffff';
  const strokeWidth = isSelected ? 3 : 2;

  // Scale pin if hovered
  const scale = isHovered ? 1.1 : 1;

  // Shadow for depth
  const shadowBlur = isHovered ? 10 : 5;

  return (
    <Group
      x={absoluteX}
      y={absoluteY}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      scaleX={scale}
      scaleY={scale}
    >
      {/* Pin shadow */}
      <Circle
        radius={20}
        fill="rgba(0,0,0,0.2)"
        offsetX={0}
        offsetY={-2}
        blur={5}
      />

      {/* Pin circle */}
      <Circle
        radius={20}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        shadowBlur={shadowBlur}
        shadowColor="rgba(0,0,0,0.3)"
        shadowOffsetY={2}
      />

      {/* Pin number */}
      <Text
        text={pin.n.toString()}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        offsetX={pin.n > 9 ? 8 : 4}
        offsetY={7}
      />

      {/* Status indicator (checkmark for done) */}
      {pin.s === 'done' && (
        <Text
          text="✓"
          fontSize={10}
          fill="#ffffff"
          offsetX={-10}
          offsetY={-10}
        />
      )}
    </Group>
  );
}

export default PinMarker;
