FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .

# Create public directory if it doesn't exist and copy PDF worker
RUN mkdir -p public && \
    cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs || true

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/package.json .
COPY --from=builder /app/next.config.js .
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory if it exists
RUN mkdir -p public
COPY --from=builder /app/public ./public || true

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
