# syntax=docker/dockerfile:1

# ---------- deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Playwright is a devDependency used by the audit scripts. Its postinstall
# would otherwise pull ~150MB of browsers into the image build for nothing.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time only: NEXT_PUBLIC_* values are inlined into the client bundle.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TAWK_PROPERTY_ID
ARG NEXT_PUBLIC_TAWK_WIDGET_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_TAWK_PROPERTY_ID=$NEXT_PUBLIC_TAWK_PROPERTY_ID
ENV NEXT_PUBLIC_TAWK_WIDGET_ID=$NEXT_PUBLIC_TAWK_WIDGET_ID
RUN npm run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
