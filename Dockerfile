# ─────────────────────────────────────────────────────────────
#  Stage 1 — build wheels (needs a C compiler: pyswisseph, a
#  dependency of kerykeion, compiles a native C extension)
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

# Build wheels into /wheels — later installed into the slim runtime
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ─────────────────────────────────────────────────────────────
#  Stage 2 — runtime (no compiler, small image)
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Runtime libs occasionally needed by compiled wheels (libgcc etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Install prebuilt wheels — no compilation, no gcc needed here
COPY requirements.txt .
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links /wheels -r requirements.txt \
    && rm -rf /wheels requirements.txt

COPY . .

EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
