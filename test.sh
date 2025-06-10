#!/bin/bash

# Configuration
DELAY_SECONDS=10 # Adjust this delay (in seconds) between runs

# Array of YouTube URLs
urls=(
    "https://www.youtube.com/watch?v=9EqrUK7ghho"
    "https://www.youtube.com/watch?v=tP3vrV8sjUA"
    "https://www.youtube.com/watch?v=W4tqbEmplug"
    "https://www.youtube.com/watch?v=9V6tWC4CdFQ&t=3s"
    "https://www.youtube.com/watch?v=g3qPo2I1LIY&t=4709s"
    "https://www.youtube.com/watch?v=VOC44gKRTI4"
    "https://www.youtube.com/watch?v=eVFzbxmKNUw"
    "https://www.youtube.com/watch?v=XQ767LlrDc0"
    "https://www.youtube.com/watch?v=jn7bOtwu4zY"
    "https://www.youtube.com/watch?v=W4tqbEmplug&t=25s"
)

# Array of themes
themes=(
    "default"
    "neomorphism"
    "glassmorphism"
    "retroY2K"
    "hacker"
    "typography"
    "maximalist"
    "brutalist"
    "flat"
    "minimalist"
)
langs=(
    'en'
    'es'
    'fr'
    'de'
    'pt'
    'it'
    'nl'
    'sv'
    'pl'
    'id'
    'ar'
)

# Loop through URLs and themes
for i in "${!urls[@]}"; do
    echo "Processing URL $((i + 1))/${#urls[@]}: ${urls[$i]}"
    echo "Theme: ${themes[$i]}, Language: ${langs[$i]}"

    # Run the command
    node src/index.js \
        --url "${urls[$i]}" \
        --pdf \
        --lang "${langs[$i]}" \
        --theme "${themes[$i]}"

    # Add delay unless it's the last iteration
    if [ $i -lt $((${#urls[@]} - 1)) ]; then
        echo "Waiting ${DELAY_SECONDS} seconds before next run..."
        sleep $DELAY_SECONDS
    fi
    echo "----------------------------------------"
done

echo "All videos processed!"
