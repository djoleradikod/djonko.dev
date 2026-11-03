# Build and serve VCF Field Notes as a static site.
# Usage: docker build -f deploy/docker/Dockerfile --build-arg SITE_URL=https://notes.example.org -t vcf-field-notes .
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://djonko.dev
ARG PUBLIC_NOINDEX=
ENV SITE_URL=$SITE_URL PUBLIC_NOINDEX=$PUBLIC_NOINDEX
RUN npm run build   # includes the privacy scan and link check

FROM nginx:1.27-alpine
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
