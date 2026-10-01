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
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=10000
ENV DISPLAY=:99

EXPOSE 10000

CMD ["npm", "start"]