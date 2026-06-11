@echo off
echo Resetting ProjectMS database...
if exist backend\projectms.db (
    del backend\projectms.db
    echo Database deleted.
) else (
    echo No database found (will be created fresh on next startup).
)
echo Done! Now run: cd backend && mvn spring-boot:run
pause
