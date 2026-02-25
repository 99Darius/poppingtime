import sharp from 'sharp';

/**
 * Dynamically analyzes an image to determine the best place for text overlay.
 * It compares the "busyness" (standard deviation of the greyscale image) 
 * of the top 30% vs the bottom 30% of the image.
 * Text should be placed in the area with LOWER busyness (the "quietest" zone).
 */
export async function determineOptimalTextPlacement(imageBuffer: Buffer): Promise<'top' | 'bottom'> {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const height = metadata.height || 1024;
        const width = metadata.width || 1024;

        // Extract and analyze the top 30% slice
        const topSlice = await sharp(imageBuffer)
            .extract({ left: 0, top: 0, width: width, height: Math.floor(height * 0.3) })
            .greyscale()
            .stats();

        // Extract and analyze the bottom 30% slice
        const bottomSlice = await sharp(imageBuffer)
            .extract({ left: 0, top: Math.floor(height * 0.7), width: width, height: Math.floor(height * 0.3) })
            .greyscale()
            .stats();

        // channels[0].stdev represents the variance (busyness) of the greyscale image.
        // Lower standard deviation means the area is flatter, more uniform color (like sky or simple ground).
        const topBusyness = topSlice.channels[0].stdev;
        const bottomBusyness = bottomSlice.channels[0].stdev;

        // Place text in the LESS busy slice
        return topBusyness < bottomBusyness ? 'top' : 'bottom';
    } catch (e) {
        console.error("Image analysis failed, defaulting to bottom", e);
        return 'bottom';
    }
}
