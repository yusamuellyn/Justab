FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

ENV TESSERACT_CMD=/usr/bin/tesseract

CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}