FROM python:3.12.4-slim-bullseye AS prod


RUN pip install poetry==1.8.2

# Configuring poetry
RUN poetry config virtualenvs.create false
RUN poetry config cache-dir /tmp/poetry_cache

# Copying the project
COPY pyproject.toml poetry.lock README.md /app/src/
WORKDIR /app/src
COPY omnidemo /app/src/omnidemo
COPY db/initial.sql /app/src/db/initial.sql
RUN mkdir -p /app/src/db/storage
RUN chmod -R 777 /app/src/db/storage

# Installing dependencies
RUN --mount=type=cache,target=/tmp/poetry_cache poetry install --only main
RUN pip install -e .

EXPOSE 8000
CMD ["/usr/local/bin/python", "omnidemo/__main__.py"]
