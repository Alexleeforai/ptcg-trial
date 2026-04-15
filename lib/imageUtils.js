/**
 * Image utility functions for card images
 */

/**
 * Get the best available image URL
 * 
 * Note: PriceCharting provides /60.jpg (thumbnail) and /240.jpg (main image).
 * Larger sizes (300, 500, 1000, 1200) return 404 for most cards.
 * We upgrade to /240.jpg which is 4x larger width than the thumbnail.
 * 
 * @param {string} imageUrl - The image URL
 * @returns {string} - The best available URL
 */
export function getHighQualityImage(imageUrl) {
    if (!imageUrl) return imageUrl;

    // Try 1600px first — SmartImage will fall back to 240px then 60px if 1600px doesn't exist.
    return imageUrl
        .replace(/\/60\.(jpg|png)/, '/1600.$1')
        .replace(/\/240\.(jpg|png)/, '/1600.$1');
}
