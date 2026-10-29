/**
 * SCORM Template Engine
 * Generates the standalone files that are packaged inside the SCORM .zip file:
 * - imsmanifest.xml (SCORM 1.2 or SCORM 2004)
 * - index.html (The player shell)
 * - player.css (Modern responsive viewer stylesheet)
 * - player.js (Player UI + SCORM 1.2 / 2004 API connector + Quiz engine + Time tracker)
 */

const ScormTemplates = {
  /**
   * Generates imsmanifest.xml compliant with SCORM 1.2 or SCORM 2004
   */
  generateManifest(config) {
    const is2004 = config.scormVersion === '2004';
    const identifier = config.courseId || `COURSE_${Date.now()}`;
    const title = this.escapeXml(config.title || 'Curso Interactivo SCORM');
    const description = this.escapeXml(config.description || '');

    if (is2004) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}_MANIFEST" version="1.0"
          xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                              http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                              http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                              http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                              http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="${identifier}_ORG">
    <organization identifier="${identifier}_ORG">
      <title>${title}</title>
      <item identifier="ITEM_1" identifierref="RES_1">
        <title>${title}</title>
        <imsss:sequencing>
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true"/>
        </imsss:sequencing>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html"/>
      <file href="player.css"/>
      <file href="player.js"/>
      <file href="course_data.js"/>
      <file href="document.pdf"/>
    </resource>
  </resources>
</manifest>`;
    }

    // Default: SCORM 1.2 (universal Moodle compatibility)
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}_MANIFEST" version="1.2"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${identifier}_ORG">
    <organization identifier="${identifier}_ORG">
      <title>${title}</title>
      <item identifier="ITEM_1" identifierref="RES_1">
        <title>${title}</title>
        <adlcp:masteryscore>${config.quizPassingScore || 70}</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="player.css"/>
      <file href="player.js"/>
      <file href="course_data.js"/>
      <file href="document.pdf"/>
    </resource>
  </resources>
</manifest>`;
  },

  escapeXml(str) {
    if (!str) return '';
    return str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  },

  /**
   * Generates index.html for the SCORM course player
   */
  getPlayerHtml(config) {
    return `<!DOCTYPE html>
<html lang="es" data-theme="${config.theme || 'dark'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeXml(config.title || 'Curso SCORM')}</title>
  <link rel="stylesheet" href="player.css">
  <!-- PDF.js standalone viewer helper -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body class="mode-${config.viewerMode || 'presentation'}">

  <!-- Top Navigation & Progress Bar -->
  <header class="player-header">
    <div class="header-left">
      <button id="btnToggleSidebar" class="header-btn" title="Miniaturas">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
      </button>
      <div class="course-info">
        <h1 class="course-title">${this.escapeXml(config.title || 'Curso SCORM')}</h1>
        <span class="page-indicator"><span id="currPageSpan">1</span> / <span id="totalPageSpan">1</span></span>
      </div>
    </div>

    <!-- Progress indicator -->
    <div class="header-center">
      <div class="progress-wrapper">
        <div class="progress-bar-bg">
          <div id="courseProgressBar" class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <span id="progressPercent" class="progress-text">0%</span>
      </div>
    </div>

    <!-- Right tools (timer, zoom, fullscreen, status) -->
    <div class="header-right">
      <div id="timeTrackerBadge" class="timer-badge" ${config.requireTime ? '' : 'style="display:none;"'}>
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span id="timeElapsedSpan">00:00</span>
      </div>

      <div id="lmsStatusBadge" class="lms-badge" title="Estado en LMS">
        <span class="status-dot"></span>
        <span id="lmsStatusText">Incompleto</span>
      </div>

      ${config.allowDownload ? `
      <a href="document.pdf" download id="btnDownloadDoc" class="header-btn" title="Descargar documento">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      </a>` : ''}

      <button id="btnToggleFullscreen" class="header-btn" title="Pantalla completa">
        <svg id="fsIconExpand" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
      </button>
    </div>
  </header>

  <!-- Main Content Container -->
  <div class="player-body">
    <!-- Sidebar / Thumbnails -->
    <aside id="thumbnailsSidebar" class="sidebar">
      <div class="sidebar-header">
        <h3>Índice de Diapositivas</h3>
        <button id="btnCloseSidebar" class="sidebar-close-btn">&times;</button>
      </div>
      <div id="thumbnailsContainer" class="thumbnails-list">
        <!-- Generado dinámicamente -->
      </div>
    </aside>

    <!-- Content Area -->
    <main class="content-viewport" id="contentViewport">
      <!-- Loading State -->
      <div id="loadingSpinner" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando contenido interactivo...</p>
      </div>

      <!-- Presentation Canvas View -->
      <div id="presentationContainer" class="presentation-stage">
        <div class="canvas-wrapper">
          <canvas id="pdfCanvas"></canvas>
        </div>
      </div>

      <!-- Continuous Document View -->
      <div id="continuousContainer" class="continuous-stage" style="display: none;">
        <div id="continuousPagesList"></div>
      </div>

      <!-- Floating Navigation Controls (for Presentation Mode) -->
      <div id="navigationBar" class="nav-bar">
        <button id="btnPrevPage" class="nav-btn" disabled>
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          <span>Anterior</span>
        </button>
        <span class="nav-counter"><span id="bottomCurrPage">1</span> de <span id="bottomTotalPage">1</span></span>
        <button id="btnNextPage" class="nav-btn">
          <span>Siguiente</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </main>
  </div>

  <!-- Final Quiz / Checkpoint Modal -->
  <div id="quizModal" class="quiz-modal">
    <div class="quiz-modal-content">
      <div class="quiz-header">
        <div class="quiz-title-badge">Evaluación Final</div>
        <h2 id="quizTitle">Cuestionario de Comprensión</h2>
        <p class="quiz-subtitle">Responde las siguientes preguntas para completar el curso.</p>
      </div>
      
      <div id="quizBody" class="quiz-questions-list">
        <!-- Inyectado por JS -->
      </div>

      <div id="quizResultBox" class="quiz-result-card" style="display: none;">
        <div id="quizResultIcon" class="result-icon"></div>
        <h3 id="quizResultTitle">¡Felicitaciones!</h3>
        <p id="quizResultMessage">Has aprobado la evaluación con éxito.</p>
        <div class="score-display">Puntuación: <strong id="quizScoreText">100%</strong></div>
      </div>

      <div class="quiz-footer">
        <button id="btnSubmitQuiz" class="btn-submit-quiz">Enviar Respuestas</button>
        <button id="btnCloseQuiz" class="btn-close-quiz" style="display: none;">Continuar</button>
      </div>
    </div>
  </div>

  <!-- Course Completed Toast / Notification -->
  <div id="completionNotice" class="completion-banner">
    <div class="completion-icon">✓</div>
    <div class="completion-text">
      <strong>¡Curso Completado!</strong>
      <span>Tu progreso y calificación han sido registrados en Moodle.</span>
    </div>
  </div>

  <!-- Load course configuration and player scripts -->
  <script src="course_data.js"></script>
  <script src="player.js"></script>
</body>
</html>`;
  },

  /**
   * Generates player.css for the embedded SCORM course
   */
  getPlayerCss() {
    return `:root {
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --bg-base: #0f172a;
  --bg-surface: #1e293b;
  --bg-sidebar: #111827;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.1);
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --radius: 10px;
}

[data-theme="light"] {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --bg-base: #f1f5f9;
  --bg-surface: #ffffff;
  --bg-sidebar: #f8fafc;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #cbd5e1;
}

[data-theme="corporate"] {
  --primary: #0284c7;
  --primary-hover: #0369a1;
  --bg-base: #0b192c;
  --bg-surface: #1e3e62;
  --bg-sidebar: #000000;
  --text-main: #ffffff;
  --text-muted: #93c5fd;
  --border-color: rgba(255, 255, 255, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-base);
  color: var(--text-main);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* Header */
.player-header {
  height: 60px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  z-index: 20;
  flex-shrink: 0;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.course-info {
  display: flex;
  flex-direction: column;
}

.course-title {
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-indicator {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.header-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

/* Progress bar */
.header-center {
  flex: 1;
  max-width: 380px;
  margin: 0 1.5rem;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar-bg {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 36px;
}

/* Badges */
.timer-badge, .lms-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  padding: 0.35rem 0.65rem;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--warning);
}

.status-completed .status-dot, .status-passed .status-dot {
  background: var(--success);
}

/* Body & Viewport */
.player-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: -260px;
  z-index: 30;
  transition: left 0.3s ease;
}

.sidebar.open {
  left: 0;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
}

.thumbnails-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.thumb-item {
  border: 2px solid var(--border-color);
  border-radius: 6px;
  padding: 0.4rem;
  cursor: pointer;
  background: var(--bg-surface);
  transition: all 0.2s ease;
  position: relative;
}

.thumb-item:hover, .thumb-item.active {
  border-color: var(--primary);
}

.thumb-item canvas {
  width: 100%;
  display: block;
  border-radius: 4px;
}

.thumb-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.thumb-visited-badge {
  font-size: 0.65rem;
  color: var(--success);
}

/* Viewport */
.content-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: auto;
  background-color: var(--bg-base);
}

.presentation-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1.5rem 5rem 1.5rem;
  overflow: hidden;
}

.canvas-wrapper {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

#pdfCanvas {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 160px);
  object-fit: contain;
}

/* Continuous Stage */
.continuous-stage {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 2rem 1rem 6rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.continuous-page-card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  max-width: 900px;
  width: 100%;
}

.continuous-page-card canvas {
  width: 100%;
  display: block;
}

/* Navigation controls */
.nav-bar {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  padding: 0.5rem 0.85rem;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 15;
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.75rem;
  border-radius: 99px;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-counter {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Quiz Modal */
.quiz-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.quiz-modal.open {
  display: flex;
}

.quiz-modal-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  max-width: 680px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.quiz-title-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 99px;
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.quiz-header h2 {
  font-size: 1.35rem;
  margin-bottom: 0.35rem;
}

.quiz-subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.quiz-q-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.quiz-q-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.85rem;
}

.quiz-opt-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  margin-bottom: 0.4rem;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.quiz-opt-label:hover {
  background: rgba(255, 255, 255, 0.06);
}

.quiz-opt-label.selected {
  border-color: var(--primary);
  background: rgba(99, 102, 241, 0.15);
}

.quiz-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.85rem;
}

.btn-submit-quiz, .btn-close-quiz {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit-quiz:hover, .btn-close-quiz:hover {
  background: var(--primary-hover);
}

.quiz-result-card {
  text-align: center;
  padding: 2rem 1rem;
}

.result-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.score-display {
  margin-top: 1rem;
  font-size: 1.1rem;
  color: var(--primary);
}

/* Completion Banner */
.completion-banner {
  position: fixed;
  top: 75px;
  right: 20px;
  background: #064e3b;
  border: 1px solid var(--success);
  color: #ecfdf5;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  transform: translateY(-150%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 99;
}

.completion-banner.show {
  transform: translateY(0);
  opacity: 1;
}

.completion-icon {
  background: var(--success);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.completion-text {
  display: flex;
  flex-direction: column;
}

.completion-text strong {
  font-size: 0.95rem;
}

.completion-text span {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Spinner */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .header-center {
    display: none;
  }
  .course-title {
    max-width: 160px;
  }
}`;
  },

  /**
   * Generates player.js (Player runtime + SCORM 1.2 / 2004 API integration)
   */
  getPlayerJs() {
    return `/**
 * SCORM Universal Player Runtime
 * Handles:
 * 1. SCORM 1.2 and 2004 Discovery and Communication
 * 2. PDF Rendering via PDF.js (Page-by-page or Continuous)
 * 3. Completion Rules (Page views %, Min Time, Quiz)
 * 4. Suspend Data & Session State Restore
 */

// Global SCORM API handle
let scormAPI = null;
let isScorm2004 = false;
let isScormInitialized = false;

// Course state
let pdfDoc = null;
let currentPageNum = 1;
let totalPages = 1;
let visitedPages = new Set();
let secondsSpent = 0;
let timerInterval = null;
let isCourseCompleted = false;
let userQuizScore = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScorm();
  setupUI();
  loadPdfDocument();
  startTimer();
});

/* ==========================================================
   SCORM API WRAPPER (Auto-detects SCORM 1.2 or 2004)
   ========================================================== */
function findAPI(win) {
  let attempts = 0;
  while (win && attempts < 10) {
    if (win.API_1484_11) {
      isScorm2004 = true;
      return win.API_1484_11;
    }
    if (win.API) {
      isScorm2004 = false;
      return win.API;
    }
    if (win.parent && win.parent !== win) {
      win = win.parent;
    } else if (win.opener) {
      win = win.opener;
    } else {
      break;
    }
    attempts++;
  }
  return null;
}

function initScorm() {
  scormAPI = findAPI(window);
  if (!scormAPI) {
    console.warn('[SCORM] No LMS API found in window hierarchy. Running in Standalone / Preview Mode.');
    updateLmsBadge('Modo Local / Sin LMS');
    return;
  }

  try {
    let result = false;
    if (isScorm2004) {
      result = scormAPI.Initialize('') === 'true';
    } else {
      result = scormAPI.LMSInitialize('') === 'true';
    }

    if (result) {
      isScormInitialized = true;
      console.log('[SCORM] Connected to LMS successfully. Version: ' + (isScorm2004 ? '2004' : '1.2'));
      
      // Initial status check
      let currentStatus = getScormValue(isScorm2004 ? 'cmi.completion_status' : 'cmi.core.lesson_status');
      if (currentStatus === 'completed' || currentStatus === 'passed') {
        isCourseCompleted = true;
        updateLmsBadge('Completado');
      } else {
        setScormValue(isScorm2004 ? 'cmi.completion_status' : 'cmi.core.lesson_status', 'incomplete');
        updateLmsBadge('En progreso');
      }

      // Restore suspend data if available
      let suspend = getScormValue(isScorm2004 ? 'cmi.suspend_data' : 'cmi.core.suspend_data');
      if (suspend) {
        try {
          let data = JSON.parse(suspend);
          if (data.visited && Array.isArray(data.visited)) {
            data.visited.forEach(p => visitedPages.add(p));
          }
          if (data.lastPage) {
            currentPageNum = data.lastPage;
          }
          if (data.quizScore !== undefined) {
            userQuizScore = data.quizScore;
          }
        } catch (e) {
          console.error('[SCORM] Error parsing suspend_data', e);
        }
      }
      scormCommit();
    }
  } catch (err) {
    console.error('[SCORM] Error initializing LMS:', err);
  }
}

function getScormValue(key) {
  if (!scormAPI || !isScormInitialized) return '';
  try {
    return isScorm2004 ? scormAPI.GetValue(key) : scormAPI.LMSGetValue(key);
  } catch (e) {
    return '';
  }
}

function setScormValue(key, value) {
  if (!scormAPI || !isScormInitialized) return false;
  try {
    let res = isScorm2004 ? scormAPI.SetValue(key, String(value)) : scormAPI.LMSSetValue(key, String(value));
    return res === 'true';
  } catch (e) {
    console.error('[SCORM] SetValue failed for ' + key, e);
    return false;
  }
}

function scormCommit() {
  if (!scormAPI || !isScormInitialized) return false;
  try {
    return isScorm2004 ? scormAPI.Commit('') === 'true' : scormAPI.LMSCommit('') === 'true';
  } catch (e) {
    return false;
  }
}

function terminateScorm() {
  if (!scormAPI || !isScormInitialized) return;
  saveProgress();
  try {
    if (isScorm2004) {
      scormAPI.Terminate('');
    } else {
      scormAPI.LMSFinish('');
    }
    isScormInitialized = false;
  } catch (e) {
    console.error('[SCORM] Error during terminate', e);
  }
}

window.addEventListener('beforeunload', terminateScorm);

/* ==========================================================
   TIME TRACKER
   ========================================================== */
function startTimer() {
  timerInterval = setInterval(() => {
    secondsSpent++;
    let mins = Math.floor(secondsSpent / 60);
    let secs = secondsSpent % 60;
    let timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    
    let timerBadge = document.getElementById('timeElapsedSpan');
    if (timerBadge) timerBadge.textContent = timeStr;

    // SCORM Time formatting
    if (isScormInitialized && secondsSpent % 10 === 0) {
      let scormTime = formatScormTime(secondsSpent);
      setScormValue(isScorm2004 ? 'cmi.session_time' : 'cmi.core.session_time', scormTime);
      checkCompletionCriteria();
    }
  }, 1000);
}

function formatScormTime(totalSecs) {
  let hours = Math.floor(totalSecs / 3600);
  let mins = Math.floor((totalSecs % 3600) / 60);
  let secs = totalSecs % 60;
  
  if (isScorm2004) {
    // ISO 8601 duration: PT[H]H[M]M[S]S
    return 'PT' + hours + 'H' + mins + 'M' + secs + 'S';
  }
  // SCORM 1.2: HHHH:MM:SS
  return (hours < 10 ? '000' : '00') + hours + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/* ==========================================================
   UI SETUP & EVENT LISTENERS
   ========================================================== */
function setupUI() {
  // Sidebar toggle
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const btnCloseSidebar = document.getElementById('btnCloseSidebar');
  const sidebar = document.getElementById('thumbnailsSidebar');

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => sidebar.classList.remove('open'));
  }

  // Navigation buttons
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  if (btnPrev) btnPrev.addEventListener('click', () => changePage(currentPageNum - 1));
  if (btnNext) btnNext.addEventListener('click', () => changePage(currentPageNum + 1));

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Space') {
      changePage(currentPageNum + 1);
    } else if (e.key === 'ArrowLeft') {
      changePage(currentPageNum - 1);
    }
  });

  // Fullscreen
  const btnFs = document.getElementById('btnToggleFullscreen');
  if (btnFs) {
    btnFs.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Submit Quiz
  const btnSubmitQuiz = document.getElementById('btnSubmitQuiz');
  if (btnSubmitQuiz) {
    btnSubmitQuiz.addEventListener('click', submitQuiz);
  }
  const btnCloseQuiz = document.getElementById('btnCloseQuiz');
  if (btnCloseQuiz) {
    btnCloseQuiz.addEventListener('click', () => {
      document.getElementById('quizModal').classList.remove('open');
    });
  }
}

function updateLmsBadge(text) {
  const badgeText = document.getElementById('lmsStatusText');
  const badge = document.getElementById('lmsStatusBadge');
  if (badgeText) badgeText.textContent = text;
  if (badge) {
    badge.className = 'lms-badge status-' + (text.toLowerCase().includes('completado') ? 'completed' : 'progress');
  }
}

/* ==========================================================
   PDF LOADING & RENDERING (PDF.js)
   ========================================================== */
function loadPdfDocument() {
  const url = 'document.pdf';
  
  if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library not loaded');
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  pdfjsLib.getDocument(url).promise.then((pdf) => {
    pdfDoc = pdf;
    totalPages = pdf.numPages;

    document.getElementById('totalPageSpan').textContent = totalPages;
    document.getElementById('bottomTotalPage').textContent = totalPages;
    document.getElementById('loadingSpinner').style.display = 'none';

    // Mark initial page
    visitedPages.add(currentPageNum);
    
    // Choose viewer mode based on config
    if (COURSE_CONFIG.viewerMode === 'continuous') {
      renderContinuousMode();
    } else {
      renderPresentationPage(currentPageNum);
    }

    renderThumbnails();
    updateProgressUI();
    checkCompletionCriteria();
  }).catch((err) => {
    console.error('Error loading PDF:', err);
    document.getElementById('loadingSpinner').innerHTML = '<p style="color:#ef4444;">Error al cargar el documento.</p>';
  });
}

function renderPresentationPage(num) {
  if (!pdfDoc) return;
  pdfDoc.getPage(num).then((page) => {
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');

    const viewportWrapper = document.querySelector('.presentation-stage');
    const availWidth = viewportWrapper.clientWidth - 40;
    const availHeight = viewportWrapper.clientHeight - 80;

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(availWidth / unscaledViewport.width, availHeight / unscaledViewport.height, 2.0);
    const viewport = page.getViewport({ scale: scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise.then(() => {
      currentPageNum = num;
      visitedPages.add(num);
      saveProgress();
      updateNavigationControls();
      updateProgressUI();
      checkCompletionCriteria();
    });
  });
}

function renderContinuousMode() {
  document.getElementById('presentationContainer').style.display = 'none';
  document.getElementById('navigationBar').style.display = 'none';
  const stage = document.getElementById('continuousContainer');
  stage.style.display = 'flex';
  const list = document.getElementById('continuousPagesList');
  list.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const pageCard = document.createElement('div');
    pageCard.className = 'continuous-page-card';
    pageCard.id = 'page-card-' + i;

    const canvas = document.createElement('canvas');
    pageCard.appendChild(canvas);
    list.appendChild(pageCard);

    ((pageNum, c) => {
      pdfDoc.getPage(pageNum).then((page) => {
        const ctx = c.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });
        c.width = viewport.width;
        c.height = viewport.height;
        page.render({ canvasContext: ctx, viewport: viewport });
      });
    })(i, canvas);
  }

  // Scroll observer to track read pages
  stage.addEventListener('scroll', () => {
    const cards = document.querySelectorAll('.continuous-page-card');
    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        visitedPages.add(idx + 1);
      }
    });
    updateProgressUI();
    checkCompletionCriteria();
  });
}

function renderThumbnails() {
  const container = document.getElementById('thumbnailsContainer');
  container.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const item = document.createElement('div');
    item.className = 'thumb-item' + (i === currentPageNum ? ' active' : '');
    item.onclick = () => {
      changePage(i);
      document.getElementById('thumbnailsSidebar').classList.remove('open');
    };

    const canvas = document.createElement('canvas');
    item.appendChild(canvas);

    const label = document.createElement('div');
    label.className = 'thumb-label';
    label.innerHTML = '<span>Diapositiva ' + i + '</span><span class="thumb-visited-badge" id="visited-badge-' + i + '">' + (visitedPages.has(i) ? '✓' : '') + '</span>';
    item.appendChild(label);

    container.appendChild(item);

    // Render low-res preview
    ((pageNum, c) => {
      pdfDoc.getPage(pageNum).then(p => {
        const vp = p.getViewport({ scale: 0.25 });
        c.width = vp.width;
        c.height = vp.height;
        p.render({ canvasContext: c.getContext('2d'), viewport: vp });
      });
    })(i, canvas);
  }
}

function changePage(num) {
  if (num < 1 || num > totalPages || num === currentPageNum) return;
  
  // Check if there is an active checkpoint on leaving this page
  renderPresentationPage(num);

  // If reaching final page and quiz is configured, show quiz
  if (num === totalPages && COURSE_CONFIG.hasQuiz && userQuizScore === null) {
    setTimeout(showQuizModal, 600);
  }
}

function updateNavigationControls() {
  document.getElementById('currPageSpan').textContent = currentPageNum;
  document.getElementById('bottomCurrPage').textContent = currentPageNum;

  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  if (btnPrev) btnPrev.disabled = currentPageNum <= 1;
  if (btnNext) btnNext.disabled = currentPageNum >= totalPages;

  // Update thumbnails highlight
  const thumbs = document.querySelectorAll('.thumb-item');
  thumbs.forEach((t, idx) => {
    if (idx + 1 === currentPageNum) t.classList.add('active');
    else t.classList.remove('active');

    const badge = document.getElementById('visited-badge-' + (idx + 1));
    if (badge && visitedPages.has(idx + 1)) badge.textContent = '✓';
  });
}

function updateProgressUI() {
  const percent = Math.min(100, Math.round((visitedPages.size / totalPages) * 100));
  const bar = document.getElementById('courseProgressBar');
  const text = document.getElementById('progressPercent');
  if (bar) bar.style.width = percent + '%';
  if (text) text.textContent = percent + '%';
}

/* ==========================================================
   QUIZ ENGINE
   ========================================================== */
function showQuizModal() {
  if (!COURSE_CONFIG.quizQuestions || COURSE_CONFIG.quizQuestions.length === 0) return;
  
  const modal = document.getElementById('quizModal');
  const body = document.getElementById('quizBody');
  body.innerHTML = '';

  COURSE_CONFIG.quizQuestions.forEach((q, qIndex) => {
    const qCard = document.createElement('div');
    qCard.className = 'quiz-q-card';
    qCard.innerHTML = '<div class="quiz-q-title">' + (qIndex + 1) + '. ' + q.question + '</div>';

    const optsContainer = document.createElement('div');
    q.options.forEach((opt, optIndex) => {
      const optLabel = document.createElement('label');
      optLabel.className = 'quiz-opt-label';
      optLabel.innerHTML = '<input type="radio" name="q_' + qIndex + '" value="' + optIndex + '"> <span>' + opt + '</span>';
      optLabel.addEventListener('change', () => {
        optLabel.parentElement.querySelectorAll('.quiz-opt-label').forEach(l => l.classList.remove('selected'));
        optLabel.classList.add('selected');
      });
      optsContainer.appendChild(optLabel);
    });

    qCard.appendChild(optsContainer);
    body.appendChild(qCard);
  });

  document.getElementById('quizResultBox').style.display = 'none';
  document.getElementById('btnSubmitQuiz').style.display = 'inline-block';
  document.getElementById('btnCloseQuiz').style.display = 'none';
  modal.classList.add('open');
}

function submitQuiz() {
  let correctCount = 0;
  const questions = COURSE_CONFIG.quizQuestions;

  for (let i = 0; i < questions.length; i++) {
    const selected = document.querySelector('input[name="q_' + i + '"]:checked');
    if (!selected) {
      alert('Por favor responde todas las preguntas antes de enviar.');
      return;
    }
    if (parseInt(selected.value) === questions[i].correctIndex) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  userQuizScore = score;
  const passingScore = COURSE_CONFIG.quizPassingScore || 70;
  const passed = score >= passingScore;

  // Report score to SCORM
  if (isScormInitialized) {
    if (isScorm2004) {
      setScormValue('cmi.score.raw', score);
      setScormValue('cmi.score.min', 0);
      setScormValue('cmi.score.max', 100);
      setScormValue('cmi.score.scaled', (score / 100).toFixed(2));
      setScormValue('cmi.success_status', passed ? 'passed' : 'failed');
    } else {
      setScormValue('cmi.core.score.raw', score);
      setScormValue('cmi.core.score.min', '0');
      setScormValue('cmi.core.score.max', '100');
    }
    scormCommit();
  }

  // Display results
  document.getElementById('quizBody').style.display = 'none';
  const resultBox = document.getElementById('quizResultBox');
  resultBox.style.display = 'block';

  document.getElementById('quizScoreText').textContent = score + '% (Mínimo: ' + passingScore + '%)';
  if (passed) {
    document.getElementById('quizResultIcon').textContent = '🎉';
    document.getElementById('quizResultTitle').textContent = '¡Excelente! Has aprobado';
    document.getElementById('quizResultMessage').textContent = 'Tu calificación ha sido registrada correctamente en el LMS.';
  } else {
    document.getElementById('quizResultIcon').textContent = '⚠️';
    document.getElementById('quizResultTitle').textContent = 'No alcanzaste el puntaje mínimo';
    document.getElementById('quizResultMessage').textContent = 'Puedes repasar el material y volver a intentarlo.';
  }

  document.getElementById('btnSubmitQuiz').style.display = 'none';
  document.getElementById('btnCloseQuiz').style.display = 'inline-block';

  saveProgress();
  checkCompletionCriteria();
}

/* ==========================================================
   COMPLETION CRITERIA LOGIC
   ========================================================== */
function checkCompletionCriteria() {
  if (isCourseCompleted) return;

  const config = COURSE_CONFIG;
  let meetsPageReq = true;
  let meetsTimeReq = true;
  let meetsQuizReq = true;

  // 1. Slide percentage check
  if (config.requireSlides) {
    const requiredPercent = config.requiredSlidePercent || 100;
    const currentPercent = (visitedPages.size / totalPages) * 100;
    meetsPageReq = currentPercent >= requiredPercent;
  }

  // 2. Minimum time check
  if (config.requireTime) {
    const minSeconds = (config.minTimeMinutes || 1) * 60;
    meetsTimeReq = secondsSpent >= minSeconds;
  }

  // 3. Quiz check
  if (config.hasQuiz) {
    const passingScore = config.quizPassingScore || 70;
    meetsQuizReq = userQuizScore !== null && userQuizScore >= passingScore;
  }

  // Final condition evaluation
  if (meetsPageReq && meetsTimeReq && meetsQuizReq) {
    markAsCompleted();
  }
}

function markAsCompleted() {
  isCourseCompleted = true;
  console.log('[SCORM] All completion conditions satisfied!');

  if (isScormInitialized) {
    if (isScorm2004) {
      setScormValue('cmi.completion_status', 'completed');
      setScormValue('cmi.success_status', 'passed');
    } else {
      setScormValue('cmi.core.lesson_status', COURSE_CONFIG.hasQuiz ? 'passed' : 'completed');
    }
    scormCommit();
  }

  updateLmsBadge('Completado');

  // Trigger banner
  const banner = document.getElementById('completionNotice');
  if (banner) {
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 6000);
  }
}

function saveProgress() {
  if (!isScormInitialized) return;
  const suspendObj = {
    visited: Array.from(visitedPages),
    lastPage: currentPageNum,
    quizScore: userQuizScore,
    seconds: secondsSpent
  };
  setScormValue(isScorm2004 ? 'cmi.suspend_data' : 'cmi.core.suspend_data', JSON.stringify(suspendObj));
  scormCommit();
}
`;
  }
};
