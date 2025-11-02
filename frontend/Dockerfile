FROM node:20

# Crear directorio de trabajo
WORKDIR /app

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli

# Crear un nuevo proyecto Angular dentro del contenedor
RUN ng new mi-app --defaults --skip-git --skip-install

# Copiar los archivos del proyecto al contenedor
WORKDIR /app/mi-app

# Instalar dependencias
RUN npm install

# Exponer puerto
EXPOSE 4200

# Servir la app
CMD ["npm", "start"]
