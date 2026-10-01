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
    apache2-utils \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm install

COPY . .

# Node backend will run internally.
ENV NODE_ENV=production
ENV PORT=3000
ENV DISPLAY=:99

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Nginx:
# Public :10000
#   /websockify -> websockify :6080
#   /novnc/*    -> noVNC static files
#   everything else -> Node :3000
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 10000;
    listen [::]:10000;

    server_name _;

    # Basic authentication for the cloud browser.
    auth_basic "Cloud Browser";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location = /novnc {
        return 302 /novnc/vnc.html?autoconnect=true&resize=scale&path=/websockify;
    }

    location /novnc/ {
        alias /usr/share/novnc/;
    }

    location /websockify {
        proxy_pass http://127.0.0.1:6080;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF

EXPOSE 10000

CMD ["sh", "-c", "test -n \"$NO_VNC_USER\" && test -n \"$NO_VNC_PASSWORD\" || { echo 'ERROR: Set NO_VNC_USER and NO_VNC_PASSWORD in Render Environment Variables.'; exit 1; }; htpasswd -bc /etc/nginx/.htpasswd \"$NO_VNC_USER\" \"$NO_VNC_PASSWORD\"; node server.js & exec nginx -g 'daemon off;'"]