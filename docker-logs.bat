@echo off
REM View Docker Logs Script for Taxaformer
echo ========================================
echo Viewing Taxaformer Logs
echo ========================================
echo.
echo Press Ctrl+C to exit logs
echo.

docker-compose logs -f
