#!/bin/sh

set -e  # Exit on error

echo "Running Prisma migrations..."
# First try to reset the database (will fail if not allowed, but that's ok)
npx prisma db push --accept-data-loss || true

# Then try to deploy migrations
if ! npx prisma migrate deploy; then
    echo "Migration failed, pushing schema directly..."
    npx prisma db push
fi

echo "Generating Prisma client..."
npx prisma generate

if [ "$SEED_SAMPLE_DATA" = "true" ]; then
  echo "Seed sample data enabled, importing sample data..."
  
  # Check if we're in the right directory and files exist
  echo "Current directory: $(pwd)"
  echo "Scripts directory contents:"
  ls -la ./scripts/ || echo "Scripts directory not found"
  echo "Data directory contents:"
  ls -la ./data/ || echo "Data directory not found"
  
  # ✅ FIXED: Check for the correct CSV file (databse.csv)
  if [ -f "./scripts/import-exercises-with-attributes.ts" ]; then
    if [ -f "./data/databse.csv" ]; then
      echo "✅ Both script and CSV found. Running import..."
      npx tsx ./scripts/import-exercises-with-attributes.ts ./data/databse.csv
      echo "✅ CSV import completed!"
    else
      echo "❌ CSV file not found: ./data/databse.csv"
    fi
  else
    echo "❌ Import script not found: ./scripts/import-exercises-with-attributes.ts"
  fi
else
  echo "Skipping sample data import (SEED_SAMPLE_DATA=false)."
fi

echo "Starting the app..."
exec "$@"
