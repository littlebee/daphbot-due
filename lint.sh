#!/bin/sh

# fail on any error
set -e

echo "Linting with flake8..."
python -m flake8 src

echo "Running mypy (typechecker): $(python -m mypy --version)"
PYTHONPATH=src python -m mypy --explicit-package-bases src

