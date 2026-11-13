# 常用命令收口：别让同事记一长串 flag
# Windows 下可用 git bash / make；也可照着命令手动跑。

.PHONY: install lint test cov run clean

install:
	python -m pip install -r requirements.txt
	python -m pip install -e .

lint:
	ruff check .
	black --check .

test:
	python -m pytest -q

cov:
	python -m pytest -q --cov=daily_report --cov-report=term-missing --cov-fail-under=80

run:
	python -m daily_report --input data/orders.csv --output out/report.json --limit 100

clean:
	rm -rf .pytest_cache .coverage out/ logs/
