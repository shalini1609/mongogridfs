FROM node:lts-alpine
ENV NODE_TLS_REJECT_UNAUTHORIZED 0
WORKDIR /app
COPY . .
RUN chmod -R 777 /app
EXPOSE 30012
RUN npm install
RUN adduser -D -H -G root -s /bin/sh nodeuser
# RUN addgroup nodeuser root
USER nodeuser
CMD ["node", "app.js"]