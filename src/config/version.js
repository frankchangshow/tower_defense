// Global version configuration
export const VERSION = '20241213iii';

// Version info
export const VERSION_INFO = {
    number: VERSION,
    description: 'Remove Menu Button - Page Reload Only',
    build: 'debug'
};

// Helper function to get versioned URL
export const getVersionedUrl = (path) => {
    return `${path}?v=${VERSION}`;
};

// Helper function to get version display text
export const getVersionText = () => {
    return `v${VERSION} - ${VERSION_INFO.description}`;
};
