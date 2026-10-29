/**
 * SCORM Generator
 * Packages the course assets into a standard .zip archive using JSZip.
 */

const ScormGenerator = {
  /**
   * Builds the SCORM .zip file and triggers browser download
   * @param {Object} config Course configuration object
   * @param {ArrayBuffer} pdfArrayBuffer Document binary buffer
   * @param {Function} onProgress Progress callback (percent, statusMessage)
   */
  async buildPackage(config, pdfArrayBuffer, onProgress = () => {}) {
    if (!window.JSZip) {
      throw new Error('La librería JSZip no está disponible.');
    }

    if (!pdfArrayBuffer || pdfArrayBuffer.byteLength === 0) {
      throw new Error('No se ha proporcionado un archivo PDF válido.');
    }

    const zip = new JSZip();

    onProgress(10, 'Generando archivo de manifiesto imsmanifest.xml...');
    const manifestXml = ScormTemplates.generateManifest(config);
    zip.file('imsmanifest.xml', manifestXml);

    onProgress(30, 'Generando reproductor de contenido (index.html)...');
    const playerHtml = ScormTemplates.getPlayerHtml(config);
    zip.file('index.html', playerHtml);

    onProgress(45, 'Empaquetando estilos CSS...');
    const playerCss = ScormTemplates.getPlayerCss();
    zip.file('player.css', playerCss);

    onProgress(60, 'Empaquetando runtime de la API SCORM...');
    const playerJs = ScormTemplates.getPlayerJs();
    zip.file('player.js', playerJs);

    onProgress(75, 'Configurando metadatos y actividades...');
    // Embed pdfBase64 for full standalone offline resilience in LMS if under 12MB
    let pdfBase64 = null;
    if (pdfArrayBuffer.byteLength < 12 * 1024 * 1024) {
      try {
        const bytes = new Uint8Array(pdfArrayBuffer);
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        pdfBase64 = btoa(binary);
      } catch (e) {
        console.warn('Could not encode PDF to base64, using relative file instead', e);
      }
    }

    const finalConfig = { ...config, pdfBase64: pdfBase64 };
    const courseDataContent = `/** Course configuration generated automatically */\nconst COURSE_CONFIG = ${JSON.stringify(finalConfig, null, 2)};`;
    zip.file('course_data.js', courseDataContent);

    onProgress(85, 'Empaquetando documento PDF original...');
    zip.file('document.pdf', pdfArrayBuffer);

    onProgress(90, 'Comprimiendo paquete ZIP...');
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      },
      (metadata) => {
        const p = 90 + Math.round(metadata.percent * 0.1);
        onProgress(p, `Comprimiendo archivos: ${Math.round(metadata.percent)}%`);
      }
    );

    onProgress(100, '¡Paquete SCORM generado con éxito!');

    // Generate filename
    const cleanTitle = (config.title || 'curso_scorm')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 40);
    const filename = `${cleanTitle}_scorm_${config.scormVersion || '1.2'}.zip`;

    this.downloadBlob(zipBlob, filename);
    return { success: true, filename: filename, size: zipBlob.size };
  },

  /**
   * Triggers download of a Blob file in the browser
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }
};
