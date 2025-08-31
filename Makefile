# Makefile at the root of data-fmt

# build from scratch (ignore cache)
build:
	docker build --no-cache -t data-fmt -f ops/Dockerfile .

# start containers without building (uses prebuilt image)
up:
	docker build --no-cache -t data-fmt -f ops/Dockerfile .
	docker compose -f ops/docker-compose.yml up -d

# stop and remove containers
down:
	docker compose -f ops/docker-compose.yml down
