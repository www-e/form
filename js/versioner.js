// js/versioner.js

/**
 * Creates a unique version string based on the CURRENT DATE (Year, Month, Day).
 * The version will only change once per day.
 * Format: YYYYMMDD (e.g., 20250726)
 * This ensures the browser uses the cached script for the entire day,
 * but is forced to download a new one when the day changes or after an update.
 * @returns {string} A daily version string.
 */
function getDailyVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // padStart ensures it's '07', not '7'
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
}

/**
 * Finds all script tags in the document that have a 'data-versioned' attribute
 * and appends the daily version string to their 'src' attribute.
 */
function applyVersioning() {
    const version = getDailyVersion();
    const scriptsToVersion = document.querySelectorAll('script[data-versioned]');
    
    scriptsToVersion.forEach(script => {
        const originalSrc = script.getAttribute('src');
        if (originalSrc) {
            // Check if it already has a version parameter
            const url = new URL(script.src, window.location.origin);
            if (!url.searchParams.has('v')) {
                script.src = `${originalSrc}?v=${version}`;
                console.log(`Daily versioning applied: ${script.src}`);
            }
        }
    });
}

// Run the versioning logic as soon as this script is executed.
applyVersioning();