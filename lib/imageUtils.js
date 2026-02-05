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

    // Upgrade to High-Res (1600px)
    // PriceCharting stores 60, 240, and usually 1600.
    return imageUrl
        .replace(/\/60\.(jpg|png)/, '/1600.$1')
        .replace(/\/240\.(jpg|png)/, '/1600.$1');
}
