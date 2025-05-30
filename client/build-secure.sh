#!/bin/bash

# Build with Vite
npm run build

# Obfuscate JS files directly in dist folder (excluding vendor files)
find ./dist -name "*.js" ! -name "*vendor*" -print0 | while IFS= read -r -d '' file; do
    echo "Obfuscating: $file"
    javascript-obfuscator "$file" --output "$file" --compact true --self-defending true
done

echo "Build complete with obfuscation!"