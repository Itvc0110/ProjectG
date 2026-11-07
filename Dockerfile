# ProjectG — Neon Divide FPS (static single-file game)
# Serves index.html with nginx on port 80.
FROM nginx:1.27-alpine

# Runtime dependency for the healthcheck
RUN apk add --no-cache wget \
    && rm -rf /var/cache/apk/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
