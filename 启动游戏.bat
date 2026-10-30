@echo off
setlocal
cd /d "%~dp0"
title PyQuest - Python 闯关
color 0B

where python >nul 2>&1
if errorlevel 1 goto tryPy
python -V >nul 2>&1
if errorlevel 1 goto tryPy
goto usePython

:tryPy
where py >nul 2>&1
if errorlevel 1 goto noPython
py -V >nul 2>&1
if errorlevel 1 goto noPython
goto usePy

:usePython
cls
echo.
echo   ============================================
echo      蛇之塔 . PyQuest    Python 闯关
echo   ============================================
echo.
echo   正在启动本地服务，浏览器会自动打开...
echo   关掉这个窗口就等于停止运行。
echo.
python serve.py
goto end

:usePy
cls
echo.
echo   ============================================
echo      蛇之塔 . PyQuest    Python 闯关
echo   ============================================
echo.
echo   正在启动本地服务，浏览器会自动打开...
echo   关掉这个窗口就等于停止运行。
echo.
py serve.py
goto end

:noPython
cls
echo.
echo   没有找到 Python。改成直接打开网页。
echo.
echo   这样也能玩，只是首次需要联网下载运行时，会慢一些。
echo   想让游戏秒开的话，装个 Python 再双击本文件即可。
echo.
start "" "index.html"
pause
goto end

:end
endlocal
