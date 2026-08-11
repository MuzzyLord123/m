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
# Every NEXT_PUBLIC_* value is inlined into the client bundle at BUILD time, so
# each one needs declaring here as well as in the platform's variables. Only
# three were declared, which meant a Railway image built from this file baked in
# the literal "{{PHONE}}", "{{EMAIL}}" and "{{TOWN}}" no matter what was set in
# the dashboard — and the mistake is invisible until the site is live.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PHONE
ARG NEXT_PUBLIC_EMAIL
ARG NEXT_PUBLIC_TOWN
ARG NEXT_PUBLIC_SERVICE_AREA
ARG NEXT_PUBLIC_YEARS
ARG NEXT_PUBLIC_MAP_ADDRESS
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_FACEBOOK_URL
ARG NEXT_PUBLIC_TAWK_PROPERTY_ID
ARG NEXT_PUBLIC_TAWK_WIDGET_ID
# Both of these are read at BUILD time, not run time, because they are
# NEXT_PUBLIC_ and get inlined into the client bundle. Without these two lines
# setting NEXT_PUBLIC_PREVIEW_MODE in a Railway dashboard had no effect
# whatsoever — the image shipped with whatever the default was, permanently, and
# the only way to change it was to edit the source and rebuild.
ARG NEXT_PUBLIC_PREVIEW_MODE
ARG NEXT_PUBLIC_FILM_SLOTS
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_PHONE=$NEXT_PUBLIC_PHONE
ENV NEXT_PUBLIC_EMAIL=$NEXT_PUBLIC_EMAIL
ENV NEXT_PUBLIC_TOWN=$NEXT_PUBLIC_TOWN
ENV NEXT_PUBLIC_SERVICE_AREA=$NEXT_PUBLIC_SERVICE_AREA
ENV NEXT_PUBLIC_YEARS=$NEXT_PUBLIC_YEARS
ENV NEXT_PUBLIC_MAP_ADDRESS=$NEXT_PUBLIC_MAP_ADDRESS
ENV NEXT_PUBLIC_INSTAGRAM_URL=$NEXT_PUBLIC_INSTAGRAM_URL
ENV NEXT_PUBLIC_FACEBOOK_URL=$NEXT_PUBLIC_FACEBOOK_URL
ENV NEXT_PUBLIC_TAWK_PROPERTY_ID=$NEXT_PUBLIC_TAWK_PROPERTY_ID
ENV NEXT_PUBLIC_TAWK_WIDGET_ID=$NEXT_PUBLIC_TAWK_WIDGET_ID
ENV NEXT_PUBLIC_PREVIEW_MODE=$NEXT_PUBLIC_PREVIEW_MODE
ENV NEXT_PUBLIC_FILM_SLOTS=$NEXT_PUBLIC_FILM_SLOTS
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
