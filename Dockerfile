# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
# Las variables se leen del .env.production configurado en git

RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar el build de React a la carpeta html de NGINX
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de NGINX para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
