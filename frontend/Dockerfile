# Stage 1: Build React App (Node 20 භාවිත කරන්න)
FROM node:20-alpine AS builder

WORKDIR /app

# Package manager files copy කිරීම
COPY package*.json ./
RUN npm install

# Source code copy කර build කිරීම
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Build output (dist) එක Nginx වෙත copy කිරීම
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]