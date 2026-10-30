@echo off
rem Autopilot fabuly - tryb ogladania: gra sama przechodzi fabule w oknie na pelnym ekranie.
rem W oknie gry: F6 pauza, F7 predkosc x1/x2/x4, F8 pasek, Esc koniec.
rem Opcje (np. przeciagnij do wiersza polecen): --od po_rozdziale1   --szybkosc 2
cd /d "%~dp0"
node tools\autopilot\ogladaj.js %*
if errorlevel 1 pause
