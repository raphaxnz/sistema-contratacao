FROM nginx:alpine

ENV APP_MODE=mock \
    API_BASE_URL=/api \
    BACKEND_URL=http://backend:8080

COPY index.html config.template.js /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/40-generate-app-config.sh /docker-entrypoint.d/40-generate-app-config.sh

RUN chmod +x /docker-entrypoint.d/40-generate-app-config.sh

EXPOSE 80
