import LZString from 'lz-string';

/**
 * Compress annotation data using LZ-String
 * @param {Object} data - Annotation data object
 * @returns {string} Compressed string
 */
export function compressAnnotations(data) {
  const json = JSON.stringify(data);
  return LZString.compressToUTF16(json);
}

/**
 * Decompress annotation data
 * @param {string} compressed - Compressed annotation string
 * @returns {Object} Decompressed annotation data
 */
export function decompressAnnotations(compressed) {
  try {
    const json = LZString.decompressFromUTF16(compressed);
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decompress annotations:', error);
    return null;
  }
}

/**
 * Get the storage size of data in bytes
 * @param {Object} data - Data to measure
 * @returns {number} Size in bytes
 */
export function getStorageSize(data) {
  return JSON.stringify(data).length;
}

/**
 * Check if data is approaching the 4KB limit
 * @param {Object} data - Data to check
 * @param {number} threshold - Warning threshold in bytes (default 3500)
 * @returns {boolean} True if approaching limit
 */
export function isNearLimit(data, threshold = 3500) {
  return getStorageSize(data) > threshold;
}

/**
 * Format storage size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "2.1KB")
 */
export function formatStorageSize(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

/**
 * Get storage usage percentage
 * @param {number} bytes - Current size in bytes
 * @param {number} limit - Maximum limit in bytes (default 4096)
 * @returns {number} Percentage (0-100)
 */
export function getStorageUsagePercent(bytes, limit = 4096) {
  return Math.min(100, (bytes / limit) * 100);
}

/**
 * Create empty annotation data structure
 * @returns {Object} Empty annotation data
 */
export function createEmptyAnnotationData() {
  return {
    v: 1,  // Schema version
    pins: [],
    drawings: [],
    highlights: []
  };
}

/**
 * Validate annotation data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid
 */
export function isValidAnnotationData(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.v !== 'number') return false;
  if (!Array.isArray(data.pins)) return false;
  if (!Array.isArray(data.drawings)) return false;
  if (!Array.isArray(data.highlights)) return false;
  return true;
}

/**
 * Load annotation data from Trello pluginData
 * @param {Object} t - Trello Power-Up client
 * @param {string} attachmentId - Attachment ID
 * @param {boolean} useCompression - Whether to use compression
 * @returns {Promise<Object>} Annotation data
 */
export async function loadAnnotations(t, attachmentId, useCompression = false) {
  const key = `annotation_${attachmentId}`;

  try {
    const stored = await t.get('card', 'shared', key);

    if (!stored) {
      return createEmptyAnnotationData();
    }

    // If compression is enabled, decompress the data
    if (useCompression && typeof stored === 'string') {
      const decompressed = decompressAnnotations(stored);
      return decompressed || createEmptyAnnotationData();
    }

    // Validate the data structure
    if (isValidAnnotationData(stored)) {
      return stored;
    }

    console.warn('Invalid annotation data structure, returning empty');
    return createEmptyAnnotationData();
  } catch (error) {
    console.error('Failed to load annotations:', error);
    return createEmptyAnnotationData();
  }
}

/**
 * Save annotation data to Trello pluginData
 * @param {Object} t - Trello Power-Up client
 * @param {string} attachmentId - Attachment ID
 * @param {Object} data - Annotation data to save
 * @param {boolean} useCompression - Whether to use compression
 * @returns {Promise<Object>} Result with success status and size info
 */
export async function saveAnnotations(t, attachmentId, data, useCompression = false) {
  const key = `annotation_${attachmentId}`;

  try {
    // Validate data before saving
    if (!isValidAnnotationData(data)) {
      throw new Error('Invalid annotation data structure');
    }

    const size = getStorageSize(data);
    const nearLimit = isNearLimit(data);

    // If data is large, try compression
    let dataToSave = data;
    if (useCompression || size > 3000) {
      const compressed = compressAnnotations(data);
      const compressedSize = compressed.length;

      // Use compressed version if it's smaller
      if (compressedSize < size) {
        dataToSave = compressed;
        console.log(`Compression saved ${size - compressedSize} bytes`);
      }
    }

    // Check if exceeding 4KB limit
    const finalSize = typeof dataToSave === 'string' ? dataToSave.length : getStorageSize(dataToSave);
    if (finalSize > 4096) {
      return {
        success: false,
        error: 'Data exceeds 4KB limit',
        size: finalSize,
        nearLimit: true
      };
    }

    await t.set('card', 'shared', key, dataToSave);

    return {
      success: true,
      size: finalSize,
      nearLimit,
      compressed: typeof dataToSave === 'string'
    };
  } catch (error) {
    console.error('Failed to save annotations:', error);
    return {
      success: false,
      error: error.message,
      size: 0,
      nearLimit: false
    };
  }
}

/**
 * Clear all annotation data for an attachment
 * @param {Object} t - Trello Power-Up client
 * @param {string} attachmentId - Attachment ID
 * @returns {Promise<boolean>} Success status
 */
export async function clearAnnotations(t, attachmentId) {
  const key = `annotation_${attachmentId}`;

  try {
    await t.remove('card', 'shared', key);
    return true;
  } catch (error) {
    console.error('Failed to clear annotations:', error);
    return false;
  }
}
