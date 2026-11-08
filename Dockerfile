# ProjectG — Neon Divide FPS (static web game)
# Serves the game with nginx on port 80. The game is no longer a single
# file: index.html hard-imports the ESM modules next to it and loads
# Three.js r160 from the vendored copy in vendor/ (no CDN dependency),
# so the image must contain all of them.
FROM nginx:1.27-alpine

# Runtime dependency for the healthcheck
RUN apk add --no-cache wget \
    && rm -rf /var/cache/apk/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html event-log-core.js stats-tracker.js crosshair-customizer.js /usr/share/nginx/html/
COPY vendor /usr/share/nginx/html/vendor

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
