# Build
FROM node:12-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install --only=production

RUN npx frontity build

# Exec
FROM node:12-alpine

WORKDIR /app

# Default variables (this change on runtime depending the deployment)
ENV BACKEND_ENV=dev
ENV BACKEND_SITE=gcb-wordpress

ENV PORT 8080
EXPOSE 8080

COPY --from=builder /app .

CMD [ "node", "server.js"]