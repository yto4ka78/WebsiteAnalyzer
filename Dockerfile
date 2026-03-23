# fly.io deployment for Next.js + Playwright/Lighthouse
FROM node:20-bullseye-slim AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Install Playwright browsers during image build so the runtime container
# always has the Chromium executable available.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium

RUN NODE_ENV=production npm run build


FROM mcr.microsoft.com/playwright:v1.58.2-jammy AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Next.js build output + runtime deps
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Playwright browser binaries
COPY --from=build /ms-playwright /ms-playwright

EXPOSE 3000

CMD ["npm", "run", "start"]

