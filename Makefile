.SHELLFLAGS = -e -c
.ONESHELL:
.PHONY: help

install:
	python3 -m venv pass-emploi-venv;\
	source pass-emploi-venv/bin/activate;\
	pip install -r requirements.txt;\

start-db:
	docker-compose up -d;\
	(cd tools/ ; sh wait-for-db.sh);\

run:
	python3 -m flask run

start: install start-db run

test: install
	python3 -m pytest tests