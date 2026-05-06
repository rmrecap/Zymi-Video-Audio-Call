FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

RUN mkdir -p /app/data && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

COPY --chown=nodejs:nodejs package*.json ./

RUN npm ci --only=production

COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs migrations/ ./migrations/
COPY --chown=nodejs:nodejs shared/ ./shared/
COPY --chown=nodejs:nodejs index.js ./

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_DATA_DIR=/app/data

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]