FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    xvfb \
    x11vnc \
    fluxbox \
    novnc \
    websockify \
    xauth \
    nginx \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DISPLAY=:99

RUN rm -f /etc/nginx/sites-enabled/default

RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 10000;
    listen [::]:10000;

    server_name _;

    # Node API
    location = /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /login {
        proxy_pass http://127.0.0.1:3000/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /browser-status {
        proxy_pass http://127.0.0.1:3000/browser-status;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location = /session-test {
        proxy_pass http://127.0.0.1:3000/session-test;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 120s;
    }

    # WebSocket connection from noVNC
    location /websockify {
        proxy_pass http://127.0.0.1:6080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Everything else goes to websockify,
    # which also serves the noVNC web files.
    location / {
        proxy_pass http://127.0.0.1:6080;

        proxy_http_version 1.1;
        proxy_set_header Host $host;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF

EXPOSE 10000

CMD ["sh", "-c", "node server.js & sleep 8; exec nginx -g 'daemon off;'"]