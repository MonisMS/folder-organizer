@echo off
echo Starting Redis with Docker...
docker run -d --name file-manager-redis -p 6379:6379 redis:7-alpine
echo Redis started on port 6379
echo.
echo To stop Redis, run: docker stop file-manager-redis
echo To remove Redis, run: docker rm file-manager-redis
pause





