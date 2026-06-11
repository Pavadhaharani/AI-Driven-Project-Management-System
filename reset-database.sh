#!/bin/bash
echo "Resetting ProjectMS database..."
if [ -f "backend/projectms.db" ]; then
    rm backend/projectms.db
    echo "Database deleted."
else
    echo "No database found (will be created fresh on next startup)."
fi
echo "Done! Now run: cd backend && mvn spring-boot:run"
