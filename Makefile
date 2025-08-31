# Makefile at the root of data-fmt

# build image using cache
build:
        docker build -t data-fmt -f ops/Dockerfile .

# rebuild from scratch (ignore cache)
rebuild:
        docker build --no-cache -t data-fmt -f ops/Dockerfile .

# start containers using existing image
up:
        docker compose -f ops/docker-compose.yml up -d

# stop and remove containers
down:
	docker compose -f ops/docker-compose.yml down
