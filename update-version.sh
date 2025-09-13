#!/bin/bash

# Version update script for Tower Defense game
# Usage: ./update-version.sh <new-version>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <new-version>"
    echo "Example: $0 20241213ii"
    exit 1
fi

NEW_VERSION=$1
echo "Updating version to: $NEW_VERSION"

# Update version.js
sed -i '' "s/export const VERSION = '[^']*'/export const VERSION = '$NEW_VERSION'/" src/config/version.js

# Update main.js imports
sed -i '' "s/?v=[^']*'/?v=$NEW_VERSION'/g" main.js

# Update index.html
sed -i '' "s/main.js?v=[^']*'/main.js?v=$NEW_VERSION'/" index.html

echo "Version updated to: $NEW_VERSION"
echo "Files updated:"
echo "  - src/config/version.js"
echo "  - main.js"
echo "  - index.html"
echo ""
echo "Don't forget to update VERSION_INFO.description in version.js!"
