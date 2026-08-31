# syntax=docker/dockerfile:1.7

FROM node:24.14.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --global npm@11.11.0 \
  && npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.28-alpine AS runtime

ENV API_UPSTREAM=http://backend:8000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/nutrition-dashboard/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
