@echo off
wsl.exe -d Ubuntu -- /home/wsl-bashar/.nvm/versions/node/v22.22.0/bin/node /home/wsl-bashar/Qmath/node_modules/.bin/next dev --port 3000 --hostname 0.0.0.0
