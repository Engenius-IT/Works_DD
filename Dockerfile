FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./
COPY turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validators/package.json packages/validators/
RUN bun install

COPY . .

# Build the API application
RUN bun run build:api

# Expose the port NestJS runs on (default is 3000)
EXPOSE 3000

# Command to run the API application
CMD ["bun", "run", "start", "--filter", "@jobsabuy/api"]
