#!/bin/bash

# Fix the generation.ts file by removing duplicate functions
echo "Fixing generation.ts file..."

# Create backup
cp src/lib/ai/tools/agent-builder/generation.ts src/lib/ai/tools/agent-builder/generation.ts.backup

# Extract lines before duplicate functions (1-1639)
head -n 1639 src/lib/ai/tools/agent-builder/generation.ts > temp_part1.txt

# Extract lines after duplicate functions (1978-)
tail -n +1978 src/lib/ai/tools/agent-builder/generation.ts > temp_part2.txt

# Combine the parts
cat temp_part1.txt temp_part2.txt > src/lib/ai/tools/agent-builder/generation.ts

# Clean up temp files
rm temp_part1.txt temp_part2.txt

echo "Fixed generation.ts file by removing duplicate functions"
echo "Original file backed up as generation.ts.backup" 