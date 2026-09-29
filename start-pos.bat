@echo off
title Offline Restaurant Management System
echo ===================================================
echo     OFFLINE RESTAURANT MANAGEMENT SYSTEM (POS)
echo ===================================================
echo.
echo Checking Local MongoDB connection and starting server...
echo.

start "" "http://localhost:5000"
node backend/server.js
pause
