# Używamy lekkiej wersji Node.js
FROM node:18-alpine

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy pliki z zależnościami
COPY package*.json ./

# Instalujemy wszystkie pakiety
RUN npm install

# Kopiujemy resztę kodu serwera
COPY . .

# Twój serwer działa na porcie 5000 (wiemy to z index.ts)
EXPOSE 5000

# Komenda uruchamiająca serwer
CMD ["npm", "start"]