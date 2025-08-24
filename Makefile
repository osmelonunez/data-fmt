# Makefile at the root of data-fmt

# build from scratch (ignore cache)
build:
	docker compose -f ops/docker-compose.yml build --no-cache

# start containers without building (uses prebuilt image)
up:
	docker compose up -d

# stop and remove containers
down:
	docker compose down
