# Guía de Despliegue en Vercel (vía GitHub)

Esta guía detalla los pasos necesarios para subir tu proyecto **AsiSport** a GitHub y desplegarlo en Vercel.

## 1. Prerrequisitos: Instalar Git

Actualmente, **Git** no parece estar instalado o configurado en tu terminal. Es necesario para subir el código.

### Opción A: Instalar vía Winget (Recomendado)
Abre PowerShell como Administrador y ejecuta:
```powershell
winget install --id Git.Git -e --source winget
```
*Reinicia tu terminal después de la instalación.*

### Opción B: Descarga Manual
Descarga el instalador desde [git-scm.com](https://git-scm.com/download/win) e instálalo con las opciones por defecto.

---

## 2. Preparar el Repositorio en GitHub

1.  Inicia sesión en [GitHub](https://github.com/).
2.  Crea un **Nuevo Repositorio** (botón "New" o "+").
3.  Nombre del repositorio: `asisport-v2` (o el nombre que prefieras).
4.  **No** inicialices con README, .gitignore o License (ya los tenemos).
5.  Copia la URL del repositorio (ej. `https://github.com/TU_USUARIO/asisport-v2.git`).

---

## 3. Subir el Código (Comandos)

Una vez instalado Git, abre tu terminal en la carpeta del proyecto (`c:\Users\Public\Documents\AsiSportv2`) y ejecuta los siguientes comandos uno por uno:

```bash
# 1. Inicializar Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "Initial commit: AsiSport v2 MVP"

# 4. Renombrar la rama principal a 'main'
git branch -M main

# 5. Conectar con tu repositorio remoto (REEMPLAZA LA URL)
git remote add origin https://github.com/TU_USUARIO/asisport-v2.git

# 6. Subir el código
git push -u origin main
```

---

## 4. Desplegar en Vercel

La forma más sencilla y recomendada es conectar Vercel con tu repositorio de GitHub para tener **Despliegue Continuo** (cada vez que hagas push, se actualiza la web).

1.  Ve a [Vercel Dashboard](https://vercel.com/dashboard).
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  En "Import Git Repository", selecciona tu cuenta de GitHub y busca `asisport-v2`. Haz clic en **"Import"**.
4.  **Configuración del Proyecto**:
    *   **Framework Preset**: Vite (debería detectarse automáticamente).
    *   **Root Directory**: `./` (dejar por defecto).
    *   **Build Command**: `vite build` (u `npm run build`).
    *   **Output Directory**: `dist`.
    *   **Environment Variables**: ¡Importante! Copia las variables de tu archivo `.env` aquí.
        *   `VITE_SUPABASE_URL`: Valor de tu .env
        *   `VITE_SUPABASE_ANON_KEY`: Valor de tu .env
5.  Haz clic en **"Deploy"**.

¡Listo! Vercel construirá tu proyecto y te dará una URL pública (ej. `asisport-v2.vercel.app`).
