# Używamy tego samego środowiska Node.js
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instalujemy pakiety Reacta
RUN npm install

COPY . .

# React domyślnie działa na porcie 3000
EXPOSE 3000

# Komenda startowa
CMD ["npm", "start"]