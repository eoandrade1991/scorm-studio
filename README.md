# SCORM Studio 🚀
### Generador Inteligente de Paquetes SCORM 1.2 y 2004 para Moodle

Convierte presentaciones y documentos en paquetes SCORM interactivos, modernos y totalmente compatibles con **Moodle**, **Canvas**, **Chamilo** y **Blackboard**.

La aplicación funciona **100% en el navegador (Client-Side)** con HTML5, Vanilla CSS y JavaScript moderno: no requiere backend, servidores ni instalación previa.

---

## 🌟 Características Principales

- 📄 **Carga de Documentos y Presentaciones**:
  - Compatible con archivos PDF nativos con renderizado nítido vía PDF.js.
  - Asistente de exportación para presentaciones PowerPoint (`.ppt`, `.pptx`) y Canva.
  - Incluye botón de **Plantilla Demo** para pruebas inmediatas con 1 clic.
- 🎨 **Opciones de Visualización**:
  - **Modo Presentación**: Diapositiva por diapositiva con controles previo/siguiente, teclado (flechas / barra espaciadora), barra de progreso y modo pantalla completa.
  - **Modo Documento Continuo**: Scroll vertical fluido para manuales y guías extensas.
  - **Temas**: Modo Oscuro Cyber, Modo Claro Académico y Azul Corporativo.
  - Opción de habilitar o bloquear la descarga del PDF original por parte del alumno.
- 📝 **Actividades y Evaluaciones Interactivas**:
  - Creador de cuestionarios de comprensión tipo test (opción múltiple).
  - Ponderación de calificaciones y nota de aprobación personalizable (`cmi.core.score.raw` / `cmi.score.scaled`).
  - Retroalimentación inmediata con animaciones y confeti al aprobar.
- ⚙️ **Criterios de Finalización para Moodle (Combinables)**:
  - Ver el 100% (o porcentaje configurable) de las diapositivas.
  - Cumplir un tiempo mínimo de permanencia en el curso (minutos).
  - Superar la evaluación o test con la nota mínima.
  - Puedes activar una sola condición o las tres a la vez.
- 🧪 **Simulador LMS y Consola de API SCORM en Vivo**:
  - Permite probar el curso antes de empaquetarlo.
  - Incluye una consola en tiempo real que muestra las llamadas a la API de SCORM (`LMSInitialize`, `LMSSetValue`, `cmi.core.lesson_status`, `LMSCommit`, etc.).
- 📦 **Exportación Directa a ZIP**:
  - Genera un archivo `.zip` con un `imsmanifest.xml` válido, el visor optimizado y todos los recursos listos para arrastrar a Moodle.

---

## 🌐 Cómo Publicarlo en GitHub y GitHub Pages (Gratis)

Puedes alojar este generador directamente en GitHub para usarlo desde cualquier dispositivo:

### Paso 1: Crear el repositorio en GitHub
1. Entra a tu cuenta de [GitHub](https://github.com) y haz clic en **New repository** (Nuevo repositorio).
2. Nómbralo por ejemplo: `scorm-studio` o `programa-scorm`.
3. Déjalo como **Público** y haz clic en **Create repository**.

### Paso 2: Subir los archivos desde tu terminal
Abre una terminal en esta carpeta (`/home/edgar/Desktop/Programa Scorm`) y ejecuta:

```bash
git init
git add .
git commit -m "Initial commit: SCORM Studio generator"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

*(Sustituye `TU_USUARIO` y `TU_REPOSITORIO` por los datos de tu repositorio de GitHub)*.

### Paso 3: Activar GitHub Pages
1. En tu repositorio de GitHub, haz clic en **Settings** (Configuración) > pestaña **Pages** (en el menú lateral izquierdo).
2. En **Build and deployment > Source**, selecciona `Deploy from a branch`.
3. En **Branch**, selecciona `main` y la carpeta `/ (root)`, luego pulsa **Save**.
4. ¡Listo! En 1 minuto tendrás una URL pública como:
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

---

## 🎓 Cómo Subir el Paquete SCORM a Moodle

Una vez descargado el archivo `.zip` generado por la herramienta:

1. Entra a tu curso en **Moodle** como profesor o administrador.
2. Activa el modo de edición (botón superior derecho **"Activar edición"**).
3. Haz clic en **"Añadir una actividad o un recurso"** en el tema o sección deseada.
4. Selecciona **Paquete SCORM**.
5. Escribe el nombre del curso o actividad.
6. En la sección **Paquete**, arrastra el archivo `.zip` generado dentro del recuadro de archivos.
7. En la sección **Calificación**, puedes definir si califica por:
   - *Situación de aprendizaje* (aprobado / completado).
   - *Calificación más alta* (la puntuación obtenida en el cuestionario).
8. Haz clic en **Guardar cambios y mostrar**. ¡El curso ya estará disponible para los alumnos con seguimiento de progreso automático!

---

## 📂 Estructura del Proyecto

```
Programa Scorm/
├── index.html              # Interfaz principal de la aplicación web
├── css/
│   └── styles.css          # Estilos modernos, temas y componentes visuales
├── js/
│   ├── app.js              # Controlador principal, asistente y simulador LMS
│   ├── pdf-handler.js      # Procesamiento de documentos con PDF.js
│   ├── course-template.js  # Motor de plantillas SCORM (manifest, player, API)
│   └── scorm-generator.js  # Compresión y descarga del ZIP con JSZip
└── README.md               # Documentación y guía de uso
```

---

## 💡 Consejo para Presentaciones de PowerPoint (.ppt / .pptx)
Para garantizar la máxima calidad visual y fidelidad de fuentes y gráficos, abre tu presentación en PowerPoint y haz clic en:
`Archivo` > `Guardar como` > `PDF (*.pdf)`.
Luego, carga ese PDF en SCORM Studio.
