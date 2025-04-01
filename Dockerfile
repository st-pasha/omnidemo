# Stage 1: Backend (prod)
FROM python:3.11.4-slim-bullseye AS backend-prod

RUN pip install poetry==1.8.2

# Configuring poetry
RUN poetry config virtualenvs.create false
RUN poetry config cache-dir /tmp/poetry_cache

# Copying requirements of a project
COPY backend/pyproject.toml backend/poetry.lock /app/backend/
WORKDIR /app/backend/

# Installing requirements
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

# Copying actual application
COPY backend/ /app/backend/
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main

# Stage 2: Backend (dev)
FROM backend-prod AS backend-dev

RUN --mount=type=cache,target=/tmp/poetry_cache poetry install

# Stage 3: Frontend (development dependencies)
FROM node:20-alpine AS frontend-development-dependencies-env
COPY frontend/ /app/frontend/
WORKDIR /app/frontend/
RUN npm ci

# Stage 4: Frontend (production dependencies)
FROM node:20-alpine AS frontend-production-dependencies-env
COPY frontend/package.json frontend/package-lock.json /app/frontend/
WORKDIR /app/frontend/
RUN npm ci --omit=dev

# Stage 5: Frontend (build)
FROM node:20-alpine AS frontend-build-env
COPY frontend/ /app/frontend/
COPY --from=frontend-development-dependencies-env /app/frontend/node_modules /app/frontend/node_modules
WORKDIR /app/frontend/
RUN npm run build

# Stage 6: Frontend (production)
FROM node:20-alpine AS frontend-prod
COPY frontend/package.json frontend/package-lock.json /app/frontend/
COPY --from=frontend-production-dependencies-env /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-build-env /app/frontend/build /app/frontend/build
WORKDIR /app/frontend/
CMD ["npm", "run", "start"]

# Final Stage: Multi-stage build for both services
FROM alpine:latest

# Copy backend application
COPY --from=backend-dev /app/backend/ /app/backend/

# Copy frontend application
COPY --from=frontend-prod /app/frontend/ /app/frontend/

# Install necessary tools for running both applications
RUN apk update && apk add --no-cache python3 py3-pip nodejs npm bash

# Install poetry within the final image, as it's needed for the backend.
RUN pip install poetry==1.8.2

# Set workdir for backend
WORKDIR /app/backend/

# Install backend dependencies in the final image.
RUN poetry config virtualenvs.create false && poetry install

# Expose ports
EXPOSE 3000 8000 # Adjust ports as needed

# Create start script
COPY --chmod=755 ./start.sh /start.sh

# Run the start script
CMD ["/start.sh"]
