#!/bin/bash
# Create simple placeholder PNG icons using ImageMagick if available
# Otherwise, user will need to create them manually

if command -v convert &> /dev/null; then
    echo "ImageMagick found! Creating PNG icons..."
    convert -size 16x16 xc:"#4CAF50" -gravity center -pointsize 12 -fill white -annotate +0+0 "⏰" icon16.png
    convert -size 32x32 xc:"#4CAF50" -gravity center -pointsize 24 -fill white -annotate +0+0 "⏰" icon32.png
    convert -size 48x48 xc:"#4CAF50" -gravity center -pointsize 36 -fill white -annotate +0+0 "⏰" icon48.png
    convert -size 128x128 xc:"#4CAF50" -gravity center -pointsize 96 -fill white -annotate +0+0 "⏰" icon128.png
    echo "Icons created successfully!"
else
    echo "ImageMagick not found. Creating simple colored squares as placeholders..."
    # Create base64 encoded minimal PNG files (1x1 green pixels, then we'll scale)
    # For now, just inform the user
    echo "Please create PNG icons manually or install ImageMagick and run this script again."
    echo "See README.md for instructions."
fi
