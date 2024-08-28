FROM node:16.14

# Cria o diretório da aplicação no container
RUN mkdir -p /app
WORKDIR /app

# Copia os arquivos de dependências e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código da aplicação
COPY src src
COPY tsconfig.json .
