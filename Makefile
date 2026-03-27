.PHONY: build up down restart reload reload-fast logs logs-front logs-back clean backup status

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

reload:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

reload-fast:
	docker compose down
	docker compose build
	docker compose up -d

logs:
	docker compose logs -f

logs-front:
	docker compose logs -f frontend

logs-back:
	docker compose logs -f backend

clean:
	docker compose down -v
	rm -f data/burnout.db

backup:
	cp data/burnout.db data/burnout-backup-$(shell date +%Y%m%d-%H%M%S).db

status:
	docker compose ps
