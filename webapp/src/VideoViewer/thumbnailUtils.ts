// Utility functions for enhanced thumbnail display

export interface ThumbnailMetadata {
    detectionType: 'person' | 'cat' | 'dog' | 'multiple' | 'unknown';
    confidence: number;
    hasHighConfidence: boolean;
}

/**
 * Since we don't currently have detection metadata embedded in filenames,
 * we'll use a heuristic approach based on timing patterns and clustering
 * to infer likely detection types for visual enhancement.
 * 
 * In the future, this could be enhanced with actual metadata from the backend.
 */
export function getThumbnailMetadata(
    fileName: string, 
    allFileNames: string[], 
    index: number
): ThumbnailMetadata {
    // Default metadata
    const metadata: ThumbnailMetadata = {
        detectionType: 'unknown',
        confidence: 0.5,
        hasHighConfidence: false
    };

    // Analyze clustering - videos recorded within 30 seconds suggest sustained activity
    const currentTime = parseFilenameDate(fileName);
    const nearbyVideos = allFileNames.filter((name, idx) => {
        if (idx === index) return false;
        const otherTime = parseFilenameDate(name);
        const timeDiff = Math.abs(currentTime.getTime() - otherTime.getTime());
        return timeDiff < 30000; // 30 seconds
    });

    // Heuristic: More clustered videos suggest person detection (sustained activity)
    // Isolated videos more likely to be pets (brief appearances)
    if (nearbyVideos.length >= 3) {
        metadata.detectionType = 'person';
        metadata.confidence = Math.min(0.9, 0.6 + (nearbyVideos.length * 0.1));
    } else if (nearbyVideos.length >= 1) {
        metadata.detectionType = 'multiple';
        metadata.confidence = 0.7;
    } else {
        // Time-based heuristics
        const hour = currentTime.getHours();
        if (hour >= 6 && hour <= 20) {
            // Daytime more likely to be person
            metadata.detectionType = 'person';
            metadata.confidence = 0.6;
        } else {
            // Nighttime more likely to be pets
            metadata.detectionType = Math.random() > 0.5 ? 'cat' : 'dog';
            metadata.confidence = 0.5;
        }
    }

    metadata.hasHighConfidence = metadata.confidence > 0.8;

    return metadata;
}

/**
 * Get CSS classes for thumbnail styling based on metadata
 */
export function getThumbnailCssClasses(
    metadata: ThumbnailMetadata, 
    isCurrentFile: boolean
): string {
    const classes = ['thumb'];
    
    // Add detection type class
    switch (metadata.detectionType) {
        case 'person':
            classes.push('thumbPerson');
            break;
        case 'cat':
            classes.push('thumbCat');
            break;
        case 'dog':
            classes.push('thumbDog');
            break;
        case 'multiple':
            classes.push('thumbMultiple');
            break;
    }

    // Add current file highlight
    if (isCurrentFile) {
        classes.push('thumbCurrent');
    }

    // Add high confidence indicator
    if (metadata.hasHighConfidence) {
        classes.push('thumbHighConfidence');
    }

    return classes.join(' ');
}

function parseFilenameDate(fileName: string): Date {
    const year = parseInt(fileName.slice(0, 4));
    const month = parseInt(fileName.slice(4, 6)) - 1;
    const day = parseInt(fileName.slice(6, 8));
    const hour = parseInt(fileName.slice(9, 11));
    const minute = parseInt(fileName.slice(11, 13));
    const second = parseInt(fileName.slice(13, 15));
    return new Date(year, month, day, hour, minute, second);
}