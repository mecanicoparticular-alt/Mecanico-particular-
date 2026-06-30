# Guía de Instalación del Servidor - Mecánico Particular

Esta guía te explica paso a paso cómo descargar este programa, subirlo a tu propio servidor web y configurar todos los servicios (Base de datos Firebase, Autenticación y el Asistente de Inteligencia Artificial Gemini) para que funcione al 100% en producción.

---

## Paso 1: Cómo descargar el programa en tu ordenador
Como estamos en el entorno de **Google AI Studio**, puedes descargar todo el código fuente listo para producción siguiendo estos sencillos pasos:
1. En la barra superior derecha o en el menú de **Google AI Studio**, busca la opción que dice **"Export"** o haz clic en el icono de ajustes/opciones.
2. Elige la opción **"Export to ZIP"** (Exportar a ZIP) o **"Download as ZIP"**.
3. Esto descargará un archivo comprimido `.zip` con todos los archivos del programa directamente a tu ordenador.

---

## Paso 2: Subir el programa a tu servidor web
Este programa es una aplicación full-stack moderna que utiliza **React (Vite)** para la interfaz visual y **Node.js (Express)** para el servidor seguro backend.

### Requisitos en tu servidor:
* **Node.js**: Versión 18 o superior instalada.
* **NPM**: Gestor de paquetes de Node (se instala automáticamente con Node.js).

### Instrucciones para subirlo:
1. Sube el archivo `.zip` que descargaste a tu servidor o VPS.
2. Descomprime el archivo en la carpeta donde quieras alojar la web.
3. Abre una terminal en esa carpeta y ejecuta el siguiente comando para instalar todas las librerías necesarias:
   ```bash
   npm install
   ```

---

## Paso 3: Configurar las claves y servicios para que todo funcione

**¡OJO!** Atendiendo a tu solicitud, **todas las claves de API (Gemini y Firebase) ya han sido integradas y configuradas directamente dentro del código fuente**.
Esto significa que el programa funcionará de manera automática y lista para la producción en el momento en el que lo arranques, sin necesidad de configurar absolutamente nada más.

No obstante, si en algún momento en el futuro deseas utilizar tus propias credenciales privadas o bases de datos diferentes, aquí tienes las instrucciones opcionales de cómo cambiarlas:

### 1. Configurar una clave propia de Inteligencia Artificial (Gemini) - *OPCIONAL*
1. En la carpeta raíz del proyecto verás un archivo llamado `.env.example`.
2. Crea una copia de ese archivo y renómbrala simplemente como `.env`.
3. Abre el archivo `.env` y añade tu clave API de Gemini:
   ```env
   GEMINI_API_KEY="TU_CLAVE_DE_GEMINI_AQUÍ"
   APP_URL="https://tu-pagina-web.com"
   ```
   *(El servidor utilizará esta clave de manera prioritaria. Puedes obtener una clave gratuita en [Google AI Studio](https://aistudio.google.com/)).*

### 2. Configurar una Base de Datos propia (Firebase) - *OPCIONAL*
Por defecto, el programa ya viene configurado con una base de datos de producción activa dentro del archivo `src/firebase.ts`. 
Si deseas cambiarla para tener una base de datos controlada desde tu propia cuenta:
1. Entra en la [Consola de Firebase](https://console.firebase.google.com/).
2. Crea un proyecto nuevo.
3. En el menú lateral, activa:
   * **Firestore Database** (Crea la base de datos en modo producción o prueba).
   * **Authentication** (Activa el método de inicio de sesión con **Correo electrónico y contraseña**).
4. Ve a la Configuración del Proyecto (icono de engranaje) -> pestaña *General* -> busca la sección *Tus apps* y crea una nueva **Aplicación Web**.
5. Copia los valores que te proporciona Firebase y reemplázalos en el archivo `firebase-applet-config.json` de tu proyecto:
   ```json
   {
     "projectId": "tu-proyecto-id",
     "appId": "tu-app-id",
     "apiKey": "tu-api-key-de-firebase",
     "authDomain": "tu-auth-domain.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "tu-storage-bucket.firebasestorage.app",
     "messagingSenderId": "tu-sender-id"
   }
   ```

---

## Paso 4: Compilar y arrancar la aplicación en producción

Una vez configuradas las claves, ejecuta estos dos sencillos comandos en la terminal de tu servidor para compilar el programa de manera optimizada y ponerlo en marcha:

1. **Compilar la aplicación para producción**:
   ```bash
   npm run build
   ```
   *Este comando optimiza todo el código de React en HTML/JS estático y compila el backend de Express en un único archivo de alto rendimiento localizado en `dist/server.cjs`.*

2. **Iniciar el servidor de producción**:
   ```bash
   npm run start
   ```
   *El servidor se levantará por defecto en el puerto **3000**.*

### Ejecutar en segundo plano en tu servidor (Recomendado)
Para que el programa no se apague al cerrar la terminal de tu servidor, te recomendamos usar un gestor de procesos como `pm2`:
1. Instala pm2 de forma global:
   ```bash
   npm install -g pm2
   ```
2. Inicia la aplicación con pm2:
   ```bash
   pm2 start dist/server.cjs --name "mecanico-particular"
   ```
3. Configura pm2 para que se inicie automáticamente si el servidor se reinicia:
   ```bash
   pm2 save
   pm2 startup
   ```

¡Listo! Ya tienes el programa "Mecánico Particular" funcionando completamente en tu propio servidor web con base de datos en la nube y asistente de inteligencia artificial activo.
