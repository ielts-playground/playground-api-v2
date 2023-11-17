FROM oven/bun:1
RUN apt update && \
    apt install sqlite3 -y && \
    apt clean
WORKDIR /pb
COPY package.json bun.lockb ./
RUN bun install
COPY services/exporter/* ./
ENTRYPOINT bun run index.ts