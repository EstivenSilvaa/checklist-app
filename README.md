# Checklist App

Una aplicación web para gestionar checklists jerárquicos.

## Instalación Local

1. Clona el repositorio.
2. Instala las dependencias: `npm install`
3. Configura la base de datos en `server.js`.
4. Ejecuta el servidor: `npm start`

## Despliegue en la Nube

Para hacer la aplicación accesible en línea:

1. **Sube el código a GitHub:**
   - Inicializa un repositorio Git: `git init`
   - Agrega los archivos: `git add .`
   - Confirma: `git commit -m "Initial commit"`
   - Crea un repositorio en GitHub y sube: `git remote add origin <URL_DEL_REPO>` y `git push -u origin main`

2. **Despliega en Railway:**
   - Ve a [Railway](https://railway.com) y crea una cuenta.
   - Conecta tu repositorio de GitHub.
   - Railway detectará automáticamente el `package.json` y desplegará la app.
   - La URL de la app se generará automáticamente (ej. `https://tu-app.railway.app`).

3. **Configura Variables de Entorno (Opcional):**
   - Para mayor seguridad, mueve las credenciales de DB a variables de entorno en Railway.

## Uso

Abre la URL proporcionada por Railway en tu navegador. La app estará disponible globalmente.