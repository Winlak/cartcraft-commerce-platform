.DEFAULT_GOAL := help

.PHONY: help install up down dev db-migrate db-seed lint typecheck test build
help:
	@echo "install | up | down | dev | db-migrate | db-seed | lint | typecheck | test | build"

install:
	npm install

up:
	docker compose up --build

down:
	docker compose down

dev:
	npm run dev

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

build:
	npm run build
