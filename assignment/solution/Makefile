.PHONY: run test check clean

run:
	python daily_report.py --input data/orders.csv --output out/report.json

test:
	python -m unittest discover -s . -p "test_*.py" -v

check:
	python ../check.py

clean:
	rm -rf out __pycache__ .pytest_cache
