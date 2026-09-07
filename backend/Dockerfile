# ---- Build stage ----
FROM python:3.12-slim

# Keeps Python from buffering stdout/stderr so logs appear immediately
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies required by psycopg2-binary and faiss-cpu
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source
COPY . .

# Create directories that the app writes to at runtime.
# These are bind-mounted in docker-compose for persistence, but we
# create them here so the image works standalone as well.
RUN mkdir -p uploads memory_store

# Expose the application port
EXPOSE 8000

# Start the FastAPI application.
# PORT defaults to 8000; Render overrides it via $PORT at runtime.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
