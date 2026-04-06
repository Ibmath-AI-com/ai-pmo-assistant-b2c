FROM python:3.12-slim

WORKDIR /app

# Install shared + service deps
COPY services/shared/requirements.txt /tmp/shared-requirements.txt
COPY services/auth-service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/shared-requirements.txt -r /tmp/requirements.txt

# Copy shared library
COPY services/shared /app/shared

# Copy service code
COPY services/auth-service/app /app/app

ENV PYTHONPATH=/app/shared

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
