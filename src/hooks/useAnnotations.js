import { useState, useEffect, useCallback, useRef } from 'react';
import { loadAnnotations, saveAnnotations, getStorageSize, formatStorageSize } from '../utils/storage';

/**
 * Custom hook for managing annotations state and persistence
 * @param {Object} t - Trello Power-Up client
 * @param {string} attachmentId - Attachment ID
 * @returns {Object} Annotations state and methods
 */
export function useAnnotations(t, attachmentId) {
  const [annotations, setAnnotations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ size: 0, nearLimit: false });
  const [error, setError] = useState(null);

  // Debounce timer ref
  const saveTimerRef = useRef(null);
  const pendingDataRef = useRef(null);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations(t, attachmentId)
      .then(data => {
        setAnnotations(data);
        updateStorageInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load annotations:', err);
        setError('Failed to load annotations');
        setLoading(false);
      });
  }, [t, attachmentId]);

  // Update storage info
  const updateStorageInfo = useCallback((data) => {
    const size = getStorageSize(data);
    const nearLimit = size > 3500;
    setStorageInfo({
      size,
      sizeFormatted: formatStorageSize(size),
      nearLimit,
      percent: Math.min(100, (size / 4096) * 100)
    });
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((data) => {
    // Store the latest data
    pendingDataRef.current = data;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer for 2 seconds
    saveTimerRef.current = setTimeout(() => {
      const dataToSave = pendingDataRef.current;
      if (!dataToSave) return;

      setSaving(true);
      saveAnnotations(t, attachmentId, dataToSave)
        .then(result => {
          if (result.success) {
            updateStorageInfo(dataToSave);
            setError(null);
          } else {
            setError(result.error || 'Failed to save annotations');
          }
          setSaving(false);
        })
        .catch(err => {
          console.error('Save error:', err);
          setError('Failed to save annotations');
          setSaving(false);
        });
    }, 2000);
  }, [t, attachmentId, updateStorageInfo]);

  // Add a pin annotation
  const addPin = useCallback((pin) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        pins: [...prev.pins, pin]
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Update a pin annotation
  const updatePin = useCallback((pinId, updates) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        pins: prev.pins.map(pin =>
          pin.id === pinId ? { ...pin, ...updates } : pin
        )
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Delete a pin annotation
  const deletePin = useCallback((pinId) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        pins: prev.pins.filter(pin => pin.id !== pinId)
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Add a drawing annotation
  const addDrawing = useCallback((drawing) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        drawings: [...prev.drawings, drawing]
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Update a drawing annotation
  const updateDrawing = useCallback((drawingId, updates) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        drawings: prev.drawings.map(drawing =>
          drawing.id === drawingId ? { ...drawing, ...updates } : drawing
        )
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Delete a drawing annotation
  const deleteDrawing = useCallback((drawingId) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        drawings: prev.drawings.filter(drawing => drawing.id !== drawingId)
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Add a highlight annotation
  const addHighlight = useCallback((highlight) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        highlights: [...prev.highlights, highlight]
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Update a highlight annotation
  const updateHighlight = useCallback((highlightId, updates) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        highlights: prev.highlights.map(highlight =>
          highlight.id === highlightId ? { ...highlight, ...updates } : highlight
        )
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Delete a highlight annotation
  const deleteHighlight = useCallback((highlightId) => {
    setAnnotations(prev => {
      const newData = {
        ...prev,
        highlights: prev.highlights.filter(highlight => highlight.id !== highlightId)
      };
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Get next pin number
  const getNextPinNumber = useCallback(() => {
    if (!annotations || !annotations.pins) return 1;
    if (annotations.pins.length === 0) return 1;
    return Math.max(...annotations.pins.map(p => p.n)) + 1;
  }, [annotations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    annotations,
    loading,
    saving,
    storageInfo,
    error,
    addPin,
    updatePin,
    deletePin,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    getNextPinNumber
  };
}
