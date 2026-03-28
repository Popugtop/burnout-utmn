.PHONY: build up down restart reload reload-fast logs logs-front logs-back clean backup backup-download restore status

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

# Create a manual backup via the running backend
backup:
	docker compose exec backend node -e "require('./dist/services/backup').createBackup('burnout-manual').then(f => console.log('Backup created:', f)).catch(e => { console.error(e); process.exit(1); })"

# Copy the latest backup file to the project root
backup-download:
	@latest=$$(ls -t data/backups/*.db 2>/dev/null | head -1); \
	if [ -n "$$latest" ]; then \
		cp "$$latest" "./burnout-backup-latest.db"; \
		echo "Copied: $$latest → ./burnout-backup-latest.db"; \
	else \
		echo "No backups found in data/backups/"; \
	fi

# Restore from a specific backup file: make restore FILE=path/to/backup.db
restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=path/to/backup.db"; exit 1; fi
	cp $(FILE) data/burnout.db
	docker compose restart backend
	@echo "Restored from $(FILE)"

status:
	docker compose ps
