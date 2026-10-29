/**
 * SCORM Generator - Application Controller
 * Manages the UI wizard, state, quiz builder, mock SCORM previewer and package generation.
 */

const AppState = {
  currentStep: 1,
  pdfLoaded: false,
  pdfData: null,
  
  // Configuration model
  config: {
    title: 'Curso Interactivo SCORM',
    courseId: 'CURSO_001',
    description: 'Material de estudio interactivo con seguimiento de progreso para Moodle.',
    scormVersion: '1.2', // '1.2' or '2004'
    viewerMode: 'presentation', // 'presentation' or 'continuous'
    theme: 'light', // 'dark', 'light', 'corporate'
    allowDownload: false,
    
    // Completion criteria (can combine multiple or all)
    requireSlides: true,
    requiredSlidePercent: 100,
    requireTime: false,
    minTimeMinutes: 2,
    hasQuiz: false,
    quizPassingScore: 70,
    
    // Quiz questions
    quizQuestions: [
      {
        question: '¿Cuál es el archivo principal que describe la estructura en un paquete SCORM?',
        options: ['imsmanifest.xml', 'index.html', 'config.json', 'package.xml'],
        correctIndex: 0
      },
      {
        question: '¿Qué función de la API de SCORM 1.2 se usa para guardar los datos en Moodle?',
        options: ['LMSCommit()', 'LMSSave()', 'LMSStore()', 'LMSPush()'],
        correctIndex: 0
      }
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PdfHandler.init();
  initTheme();
  setupNavigation();
  setupDropzone();
  setupOptionPickers();
  setupCompletionToggles();
  setupQuizBuilder();
  setupPreviewModal();
  setupGeneratorAction();
});

/* ==========================================================
   THEME TOGGLE (DARK / LIGHT)
   ========================================================== */
function initTheme() {
  const themeBtn = document.getElementById('btnThemeToggle');
  const savedTheme = localStorage.getItem('scorm_gen_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('scorm_gen_theme', next);
    });
  }
}

/* ==========================================================
   WIZARD STEP NAVIGATION
   ========================================================== */
function setupNavigation() {
  const btnNext = document.getElementById('btnNextStep');
  const btnPrev = document.getElementById('btnPrevStep');

  btnNext.addEventListener('click', () => {
    if (AppState.currentStep === 1 && !AppState.pdfLoaded) {
      showToast('Por favor carga un archivo PDF o usa la plantilla de prueba antes de continuar.', 'error');
      return;
    }
    goToStep(AppState.currentStep + 1);
  });

  btnPrev.addEventListener('click', () => {
    goToStep(AppState.currentStep - 1);
  });

  // Step item click
  document.querySelectorAll('.step-item').forEach((item) => {
    item.addEventListener('click', () => {
      const targetStep = parseInt(item.dataset.step);
      if (targetStep < AppState.currentStep || AppState.pdfLoaded) {
        goToStep(targetStep);
      }
    });
  });
}

function goToStep(step) {
  if (step < 1 || step > 4) return;
  AppState.currentStep = step;

  // Update step indicators
  document.querySelectorAll('.step-item').forEach((item) => {
    const s = parseInt(item.dataset.step);
    item.classList.remove('active', 'completed');
    if (s === step) {
      item.classList.add('active');
    } else if (s < step) {
      item.classList.add('completed');
    }
  });

  // Update content tabs
  document.querySelectorAll('.step-content').forEach((content) => {
    content.classList.remove('active');
  });
  const currentTab = document.getElementById(`stepContent${step}`);
  if (currentTab) currentTab.classList.add('active');

  // Update button states
  const btnPrev = document.getElementById('btnPrevStep');
  const btnNext = document.getElementById('btnNextStep');
  btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';
  
  if (step === 4) {
    btnNext.style.display = 'none';
    updateSummaryCard();
  } else {
    btnNext.style.display = 'inline-flex';
    btnNext.textContent = 'Siguiente Paso →';
  }

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

/* ==========================================================
   DROPZONE & FILE UPLOAD
   ========================================================== */
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnSampleDemo = document.getElementById('btnLoadDemo');

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  if (btnSampleDemo) {
    btnSampleDemo.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        showToast('Cargando plantilla demo de presentación...', 'info');
        const res = await PdfHandler.createSampleDemoPdf();
        onPdfLoadedSuccess(res, 'Presentación Demo SCORM.pdf');
      } catch (err) {
        showToast('Error al cargar la demo: ' + err.message, 'error');
      }
    });
  }

  // Remove file button
  document.getElementById('btnRemoveFile').addEventListener('click', () => {
    AppState.pdfLoaded = false;
    AppState.pdfData = null;
    document.getElementById('fileLoadedCard').style.display = 'none';
    document.getElementById('thumbnailsContainerSection').style.display = 'none';
    dropzone.style.display = 'flex';
    fileInput.value = '';
  });
}

async function handleFileSelected(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'ppt' || ext === 'pptx') {
    alert('Has seleccionado un archivo PowerPoint (.pptx). Para garantizar una visualización 100% nítida y sin descuadre de fuentes en Moodle, por favor guárdalo como PDF ("Archivo > Guardar como > PDF") y carga el PDF resultante.');
    return;
  }

  if (ext !== 'pdf') {
    showToast('Por favor selecciona un archivo PDF válido.', 'error');
    return;
  }

  showToast('Procesando documento PDF...', 'info');
  try {
    const res = await PdfHandler.loadFromFile(file);
    onPdfLoadedSuccess(res, file.name);
  } catch (err) {
    showToast('Error al leer el archivo PDF: ' + err.message, 'error');
  }
}

function onPdfLoadedSuccess(res, filename) {
  AppState.pdfLoaded = true;
  AppState.pdfData = res;

  // Update default course title if not set
  if (res.title) {
    AppState.config.title = res.title;
    document.getElementById('inputCourseTitle').value = res.title;
  }

  // Update UI cards
  document.getElementById('dropzone').style.display = 'none';
  const fileLoadedCard = document.getElementById('fileLoadedCard');
  fileLoadedCard.style.display = 'flex';
  
  document.getElementById('loadedFileName').textContent = filename;
  const sizeMb = (res.fileSize / (1024 * 1024)).toFixed(2);
  document.getElementById('loadedFileInfo').textContent = `${res.numPages} páginas / diapositivas • ${sizeMb} MB`;

  // Render thumbnails in step 1
  const strip = document.getElementById('wizardThumbnailsStrip');
  strip.innerHTML = '';
  res.thumbnails.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'thumbnail-card';
    card.innerHTML = `<img src="${t.dataUrl}" alt="Página ${t.pageNumber}"><div class="thumbnail-num">Diapositiva ${t.pageNumber}</div>`;
    strip.appendChild(card);
  });
  document.getElementById('thumbnailsContainerSection').style.display = 'block';

  // Auto-generate questions based on PDF content
  if (res.extractedText && typeof QuizGenerator !== 'undefined') {
    const count = parseInt(document.getElementById('selectQuestionCount')?.value) || 3;
    const generated = QuizGenerator.generateFromText(res.extractedText, res.pagesText, count);
    if (generated && generated.length > 0) {
      AppState.config.quizQuestions = generated;
      renderQuizQuestionsList();
      const statusEl = document.getElementById('quizSourceStatus');
      if (statusEl) {
        statusEl.innerHTML = `✅ <strong>${generated.length} preguntas</strong> generadas automáticamente a partir del contenido de tu documento.`;
      }
    }
  }

  showToast('¡Documento procesado y preguntas generadas del contenido!', 'success');
}

/* ==========================================================
   OPTIONS & VISUALIZATION SELECTORS
   ========================================================== */
function setupOptionPickers() {
  // Viewer Mode selection (presentation vs continuous)
  document.querySelectorAll('.mode-option-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.config.viewerMode = card.dataset.mode;
    });
  });

  // Course Theme selection
  document.querySelectorAll('.theme-option-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.theme-option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.config.theme = card.dataset.theme;
    });
  });

  // Toggle: allow download
  const toggleDownload = document.getElementById('toggleAllowDownload');
  if (toggleDownload) {
    toggleDownload.addEventListener('change', (e) => {
      AppState.config.allowDownload = e.target.checked;
    });
  }

  // SCORM version radios
  document.querySelectorAll('input[name="scormVersion"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      AppState.config.scormVersion = e.target.value;
    });
  });

  // Course metadata fields
  document.getElementById('inputCourseTitle').addEventListener('input', (e) => {
    AppState.config.title = e.target.value;
  });
  document.getElementById('inputCourseId').addEventListener('input', (e) => {
    AppState.config.courseId = e.target.value;
  });
  document.getElementById('inputCourseDesc').addEventListener('input', (e) => {
    AppState.config.description = e.target.value;
  });
}

/* ==========================================================
   COMPLETION CRITERIA (MULTI-SELECT COMBINABLE)
   ========================================================== */
function setupCompletionToggles() {
  // Criterion 1: Slide percentage
  const toggleSlides = document.getElementById('toggleRequireSlides');
  const slidePercentInput = document.getElementById('inputSlidePercent');
  toggleSlides.addEventListener('change', (e) => {
    AppState.config.requireSlides = e.target.checked;
    document.getElementById('slidePercentSettings').style.display = e.target.checked ? 'block' : 'none';
  });
  slidePercentInput.addEventListener('input', (e) => {
    AppState.config.requiredSlidePercent = parseInt(e.target.value) || 100;
  });

  // Criterion 2: Minimum time
  const toggleTime = document.getElementById('toggleRequireTime');
  const minTimeInput = document.getElementById('inputMinTime');
  toggleTime.addEventListener('change', (e) => {
    AppState.config.requireTime = e.target.checked;
    document.getElementById('timeSettings').style.display = e.target.checked ? 'block' : 'none';
  });
  minTimeInput.addEventListener('input', (e) => {
    AppState.config.minTimeMinutes = parseInt(e.target.value) || 1;
  });

  // Criterion 3: Evaluation quiz
  const toggleQuiz = document.getElementById('toggleRequireQuiz');
  toggleQuiz.addEventListener('change', (e) => {
    AppState.config.hasQuiz = e.target.checked;
    document.getElementById('quizBuilderSection').style.display = e.target.checked ? 'block' : 'none';
  });
}

/* ==========================================================
   QUIZ BUILDER
   ========================================================== */
function setupQuizBuilder() {
  const passingScoreInput = document.getElementById('inputQuizPassingScore');
  passingScoreInput.addEventListener('input', (e) => {
    AppState.config.quizPassingScore = parseInt(e.target.value) || 70;
  });

  const btnAddQuestion = document.getElementById('btnAddQuestion');
  btnAddQuestion.addEventListener('click', () => {
    AppState.config.quizQuestions.push({
      question: 'Nueva pregunta sobre el contenido...',
      options: ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D'],
      correctIndex: 0
    });
    renderQuizQuestionsList();
  });

  // Regenerate questions from PDF content
  const btnRegen = document.getElementById('btnRegeneratePdfQuestions');
  if (btnRegen) {
    btnRegen.addEventListener('click', () => {
      if (!AppState.pdfData || !AppState.pdfData.extractedText) {
        showToast('Primero carga un documento PDF para analizar su contenido.', 'error');
        return;
      }
      const count = parseInt(document.getElementById('selectQuestionCount')?.value) || 3;
      showToast('Analizando contenido del documento...', 'info');
      const generated = QuizGenerator.generateFromText(AppState.pdfData.extractedText, AppState.pdfData.pagesText, count);
      if (generated && generated.length > 0) {
        AppState.config.quizQuestions = generated;
        renderQuizQuestionsList();
        const statusEl = document.getElementById('quizSourceStatus');
        if (statusEl) {
          statusEl.innerHTML = `✅ <strong>${generated.length} preguntas</strong> generadas a partir del contenido del documento.`;
        }
        showToast(`¡Se han generado ${generated.length} preguntas del PDF!`, 'success');
      }
    });
  }

  // Toggle Gemini AI Drawer
  const btnToggleAi = document.getElementById('btnToggleAiDrawer');
  const aiDrawer = document.getElementById('geminiAiDrawer');
  const inputKey = document.getElementById('inputGeminiApiKey');
  if (inputKey) {
    inputKey.value = localStorage.getItem('gemini_api_key') || '';
  }
  if (btnToggleAi && aiDrawer) {
    btnToggleAi.addEventListener('click', () => {
      aiDrawer.style.display = aiDrawer.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Run Gemini AI Generation
  const btnRunAi = document.getElementById('btnRunGeminiAi');
  if (btnRunAi && inputKey) {
    btnRunAi.addEventListener('click', async () => {
      const key = inputKey.value.trim();
      if (!key) {
        showToast('Por favor introduce tu clave API de Gemini.', 'error');
        return;
      }
      if (!AppState.pdfData || !AppState.pdfData.extractedText) {
        showToast('Primero carga un archivo PDF para extraer su contenido.', 'error');
        return;
      }
      try {
        btnRunAi.disabled = true;
        btnRunAi.textContent = 'Analizando con IA...';
        localStorage.setItem('gemini_api_key', key);
        const count = parseInt(document.getElementById('selectQuestionCount')?.value) || 3;
        showToast('Gemini está analizando el documento...', 'info');
        const aiQuestions = await QuizGenerator.generateWithGemini(AppState.pdfData.extractedText, key, count);
        AppState.config.quizQuestions = aiQuestions;
        renderQuizQuestionsList();
        const statusEl = document.getElementById('quizSourceStatus');
        if (statusEl) {
          statusEl.innerHTML = `✨ <strong>${aiQuestions.length} preguntas</strong> generadas con Inteligencia Artificial (Gemini).`;
        }
        showToast('¡Preguntas generadas con éxito por Gemini!', 'success');
        if (aiDrawer) aiDrawer.style.display = 'none';
      } catch (err) {
        showToast('Error de IA: ' + err.message, 'error');
      } finally {
        btnRunAi.disabled = false;
        btnRunAi.textContent = 'Generar con IA';
      }
    });
  }

  renderQuizQuestionsList();
}

function renderQuizQuestionsList() {
  const container = document.getElementById('quizQuestionsContainer');
  container.innerHTML = '';

  AppState.config.quizQuestions.forEach((q, qIdx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-item';

    qDiv.innerHTML = `
      <div class="question-header">
        <strong style="color:var(--primary);">Pregunta ${qIdx + 1}</strong>
        ${AppState.config.quizQuestions.length > 1 ? `<button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteQuizQuestion(${qIdx})">Eliminar</button>` : ''}
      </div>
      <div class="form-group">
        <input type="text" class="form-control" value="${escapeHtml(q.question)}" placeholder="Enunciado de la pregunta" oninput="updateQuizQuestionText(${qIdx}, this.value)">
      </div>
      <div class="options-container" id="optionsContainer_${qIdx}">
        <p style="font-size:0.75rem; color:var(--text-sub); margin-bottom:0.5rem;">Marca el círculo de la opción que será la respuesta correcta:</p>
        ${q.options.map((opt, optIdx) => `
          <div class="answer-option-row">
            <input type="radio" name="correct_${qIdx}" class="answer-radio" ${q.correctIndex === optIdx ? 'checked' : ''} onchange="setQuizCorrectIndex(${qIdx}, ${optIdx})">
            <input type="text" class="form-control" value="${escapeHtml(opt)}" placeholder="Opción ${optIdx + 1}" oninput="updateQuizOptionText(${qIdx}, ${optIdx}, this.value)">
          </div>
        `).join('')}
      </div>
    `;

    container.appendChild(qDiv);
  });
}

window.updateQuizQuestionText = (qIdx, val) => {
  AppState.config.quizQuestions[qIdx].question = val;
};

window.updateQuizOptionText = (qIdx, optIdx, val) => {
  AppState.config.quizQuestions[qIdx].options[optIdx] = val;
};

window.setQuizCorrectIndex = (qIdx, optIdx) => {
  AppState.config.quizQuestions[qIdx].correctIndex = optIdx;
};

window.deleteQuizQuestion = (qIdx) => {
  AppState.config.quizQuestions.splice(qIdx, 1);
  renderQuizQuestionsList();
};

function escapeHtml(str) {
  return (str || '').replace(/"/g, '&quot;');
}

/* ==========================================================
   SUMMARY CARD (STEP 4)
   ========================================================== */
function updateSummaryCard() {
  const c = AppState.config;
  document.getElementById('sumTitle').textContent = c.title;
  document.getElementById('sumPages').textContent = AppState.pdfData ? `${AppState.pdfData.numPages} diapositivas` : '0';
  document.getElementById('sumVersion').textContent = `SCORM ${c.scormVersion}`;
  document.getElementById('sumViewerMode').textContent = c.viewerMode === 'presentation' ? 'Modo Diapositivas' : 'Documento Continuo';
  
  // Format rules
  const rules = [];
  if (c.requireSlides) rules.push(`Ver el ${c.requiredSlidePercent}% de diapositivas`);
  if (c.requireTime) rules.push(`Permanecer mínimo ${c.minTimeMinutes} minuto(s)`);
  if (c.hasQuiz) rules.push(`Aprobar cuestionario (${c.quizPassingScore}%) con ${c.quizQuestions.length} preguntas`);
  if (rules.length === 0) rules.push('Acceder al contenido');

  const rulesList = document.getElementById('sumRulesList');
  rulesList.innerHTML = rules.map(r => `<li>✓ ${r}</li>`).join('');
}

/* ==========================================================
   INTERACTIVE LIVE PREVIEW (WITH MOCK SCORM LMS API)
   ========================================================== */
function setupPreviewModal() {
  const modal = document.getElementById('previewModal');
  const btnOpen = document.getElementById('btnOpenPreview');
  const btnClose = document.getElementById('btnClosePreview');

  btnOpen.addEventListener('click', () => {
    launchInteractivePreview();
    modal.classList.add('active');
  });

  btnClosePreview.addEventListener('click', () => {
    modal.classList.remove('active');
    const iframe = document.getElementById('previewIframe');
    iframe.src = 'about:blank';
  });
}

function launchInteractivePreview() {
  const iframe = document.getElementById('previewIframe');
  const logDrawer = document.getElementById('scormLogEntries');
  logDrawer.innerHTML = '';

  const addLog = (msg, isSuccess = false) => {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'log-entry' + (isSuccess ? ' success' : '');
    div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;
    logDrawer.appendChild(div);
    logDrawer.scrollTop = logDrawer.scrollHeight;
  };

  addLog('🟢 [Simulador LMS Moodle] Iniciando entorno de ejecución SCORM...', true);

  // Setup mock SCORM 1.2 and 2004 APIs on window so iframe can find them
  const mockScormStore = {};

  window.API = {
    LMSInitialize: (param) => {
      addLog(`LMSInitialize("") -> "true"`, true);
      return "true";
    },
    LMSFinish: (param) => {
      addLog(`LMSFinish("") -> Sesión finalizada.`);
      return "true";
    },
    LMSGetValue: (key) => {
      const val = mockScormStore[key] || "";
      addLog(`LMSGetValue("${key}") -> "${val}"`);
      return val;
    },
    LMSSetValue: (key, val) => {
      mockScormStore[key] = val;
      const isCompleted = key === 'cmi.core.lesson_status' && (val === 'completed' || val === 'passed');
      addLog(`LMSSetValue("${key}", "${val}") -> "true"`, isCompleted);
      if (isCompleted) {
        addLog(`🎉 ¡ESTADO REGISTRADO EN MOODLE: "${val.toUpperCase()}"!`, true);
      }
      return "true";
    },
    LMSCommit: (param) => {
      addLog(`LMSCommit("") -> Datos persistidos en base de datos Moodle.`);
      return "true";
    },
    LMSGetLastError: () => "0",
    LMSGetErrorString: () => "No error",
    LMSGetDiagnostic: () => "OK"
  };

  window.API_1484_11 = {
    Initialize: (param) => {
      addLog(`Initialize("") -> "true" (SCORM 2004)`, true);
      return "true";
    },
    Terminate: (param) => {
      addLog(`Terminate("") -> Sesión finalizada.`);
      return "true";
    },
    GetValue: (key) => {
      const val = mockScormStore[key] || "";
      addLog(`GetValue("${key}") -> "${val}"`);
      return val;
    },
    SetValue: (key, val) => {
      mockScormStore[key] = val;
      const isCompleted = (key === 'cmi.completion_status' && val === 'completed') || (key === 'cmi.success_status' && val === 'passed');
      addLog(`SetValue("${key}", "${val}") -> "true"`, isCompleted);
      return "true";
    },
    Commit: (param) => {
      addLog(`Commit("") -> Datos guardados en LMS.`);
      return "true";
    },
    GetLastError: () => "0",
    GetErrorString: () => "No error",
    GetDiagnostic: () => "OK"
  };

  // Build temporary object URL for the PDF
  const pdfBlob = new Blob([AppState.PdfHandler ? AppState.PdfHandler.currentPdfArrayBuffer : PdfHandler.currentPdfArrayBuffer], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Generate preview HTML string
  let html = ScormTemplates.getPlayerHtml(AppState.config);
  const css = ScormTemplates.getPlayerCss();
  const playerJs = ScormTemplates.getPlayerJs();
  const courseData = `const COURSE_CONFIG = ${JSON.stringify(AppState.config, null, 2)};`;

  // Inject CSS & JS directly into the HTML
  html = html.replace('<link rel="stylesheet" href="player.css">', `<style>${css}</style>`);
  html = html.replace('<script src="course_data.js"></script>', `<script>${courseData}</script>`);
  html = html.replace('<script src="player.js"></script>', `<script>${playerJs}</script>`);
  html = html.replace("const url = 'document.pdf';", `const url = '${pdfUrl}';`);

  iframe.srcdoc = html;
}

/* ==========================================================
   PACKAGE GENERATION ACTION
   ========================================================== */
function setupGeneratorAction() {
  const btnGenerate = document.getElementById('btnGenerateScorm');
  const progressBox = document.getElementById('genProgressBox');
  const progressBar = document.getElementById('genProgressBar');
  const progressText = document.getElementById('genProgressText');

  btnGenerate.addEventListener('click', async () => {
    try {
      btnGenerate.disabled = true;
      progressBox.style.display = 'block';

      await ScormGenerator.buildPackage(
        AppState.config,
        PdfHandler.currentPdfArrayBuffer,
        (percent, statusMsg) => {
          progressBar.style.width = percent + '%';
          progressText.textContent = statusMsg;
        }
      );

      showToast('¡Paquete SCORM descargado exitosamente!', 'success');
      setTimeout(() => {
        progressBox.style.display = 'none';
        btnGenerate.disabled = false;
      }, 3000);
    } catch (err) {
      showToast('Error al generar el paquete: ' + err.message, 'error');
      btnGenerate.disabled = false;
    }
  });
}

/* ==========================================================
   TOAST NOTIFICATION UTILITY
   ========================================================== */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => container.removeChild(toast), 300);
  }, 4000);
}
