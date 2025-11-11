#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies"
pip install --upgrade pip  # optional but good practice
pip install -r requirements.txt

echo "==> Running database migrations"
python manage.py makemigrations
python manage.py migrate --noinput

echo "==> Collecting static files"
python manage.py collectstatic --noinput

echo "==> Build complete"
