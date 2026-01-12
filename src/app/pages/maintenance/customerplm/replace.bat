@echo off
setlocal enabledelayedexpansion

set OLD=projectplm
set NEW=customerplm

REM 先改檔案名稱
for /r %%F in (*%OLD%*) do (
    set "oldname=%%~nxF"
    set "newname=!oldname:%OLD%=%NEW%!"
    if not "%%~nxF"=="!newname!" (
        ren "%%F" "!newname!"
    )
)

REM 再改資料夾名稱（一定要由深到淺）
for /f "delims=" %%D in ('dir /ad /b /s ^| sort /r') do (
    set "oldname=%%~nxD"
    set "newname=!oldname:%OLD%=%NEW%!"
    if not "%%~nxD"=="!newname!" (
        ren "%%D" "!newname!"
    )
)

echo Done.
pause
