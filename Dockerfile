# Base
FROM ktanim90/node14-alpine:1.5 as base
WORKDIR /app
COPY ./package.json /app
COPY ./package-lock.json /app
RUN npm install


# Production
FROM ktanim90/node14-alpine:1.5 as prod
EXPOSE 3000
WORKDIR /app
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
COPY --from=base /app/node_modules ./node_modules
COPY ./src /app/src
CMD ["node", "/app/src/server.js"]
