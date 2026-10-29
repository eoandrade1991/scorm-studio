/**
 * Smart Quiz Generator
 * Analyzes PDF content extracted via PDF.js to automatically generate
 * contextual multiple-choice questions.
 * 
 * Includes:
 * 1. Local Semantic Engine: Runs 100% in-browser without any API key or backend.
 *    Extracts key definitions, relationships, bullet points and constructs questions
 *    with plausible contextual distractors.
 * 2. Optional Gemini AI Engine: Allows using a Gemini API key for deep pedagogical reasoning.
 */

const QuizGenerator = {

  /**
   * Generates multiple-choice questions automatically from extracted PDF text
   * @param {string} fullText Extracted text from all pages
   * @param {Array} pagesText Array of { page: number, text: string }
   * @param {number} targetCount Desired number of questions (default 3 to 5)
   */
  generateFromText(fullText, pagesText = [], targetCount = 3) {
    if (!fullText || fullText.trim().length < 40) {
      return this.getFallbackQuestions();
    }

    const cleanedText = fullText.replace(/\s+/g, ' ').trim();
    const sentences = this.extractSentences(cleanedText);
    const concepts = this.extractKeyConcepts(sentences);

    const questions = [];

    // Strategy 1: Definition-based questions ("X es / consiste en / permite...")
    const definitionQuestions = this.buildDefinitionQuestions(sentences, concepts);
    questions.push(...definitionQuestions);

    // Strategy 2: Purpose or function questions ("El objetivo de / la función de...")
    if (questions.length < targetCount) {
      const purposeQuestions = this.buildPurposeQuestions(sentences, concepts);
      questions.push(...purposeQuestions);
    }

    // Strategy 3: Key concepts and true/false recognition
    if (questions.length < targetCount) {
      const factQuestions = this.buildFactQuestions(sentences, concepts);
      questions.push(...factQuestions);
    }

    // Strategy 4: If still need more, construct contextual slide questions
    if (questions.length < targetCount && pagesText.length > 0) {
      const slideQuestions = this.buildSlideQuestions(pagesText, concepts);
      questions.push(...slideQuestions);
    }

    // If text was too brief or esoteric, fill remaining with contextual fallbacks
    while (questions.length < targetCount) {
      questions.push(this.getGenericContextQuestion(concepts, questions.length + 1));
    }

    // Return capped to targetCount
    return questions.slice(0, targetCount);
  },

  /**
   * Breaks text into clean meaningful sentences
   */
  extractSentences(text) {
    return text
      .split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 240);
  },

  /**
   * Extracts prominent terms, capitalized entities and nouns
   */
  extractKeyConcepts(sentences) {
    const stopwords = new Set([
      'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'para',
      'por', 'con', 'sin', 'sobre', 'este', 'esta', 'estos', 'estas', 'que', 'como',
      'cuando', 'donde', 'porque', 'cual', 'cuales', 'pero', 'mas', 'cada', 'todo',
      'todos', 'toda', 'todas', 'otro', 'otra', 'otros', 'otras', 'del', 'al', 'se',
      'es', 'son', 'fue', 'fueron', 'ser', 'estar', 'haber', 'tener', 'hacer', 'mas'
    ]);

    const freqMap = {};
    const capitalizedTerms = new Set();

    sentences.forEach(s => {
      // Find quoted terms or capitalized phrases
      const capMatches = s.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}\b/g);
      if (capMatches) {
        capMatches.forEach(w => {
          const lower = w.toLowerCase();
          if (!stopwords.has(lower)) capitalizedTerms.add(w);
        });
      }

      // Word frequency
      const words = s.toLowerCase().match(/\b[a-záéíóúñ]{4,}\b/g) || [];
      words.forEach(w => {
        if (!stopwords.has(w)) {
          freqMap[w] = (freqMap[w] || 0) + 1;
        }
      });
    });

    const sortedWords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return {
      topWords: sortedWords.slice(0, 20),
      capitalized: Array.from(capitalizedTerms)
    };
  },

  /**
   * Generates questions for definition patterns ("es un...", "se define como...", "consiste en...")
   */
  buildDefinitionQuestions(sentences, concepts) {
    const questions = [];
    const definitionPatterns = [
      /(?<subject>[A-ZÁÉÍÓÚÑ][\w\s]{2,30}?)\s+(?:es|se define como|consiste en|representa)\s+(?<definition>.{15,100}?)(?=[.;,]|$)/i,
      /(?<subject>[A-ZÁÉÍÓÚÑ][\w\s]{2,30}?)\s+permite\s+(?<definition>.{15,90}?)(?=[.;,]|$)/i
    ];

    for (const sentence of sentences) {
      for (const pattern of definitionPatterns) {
        const match = sentence.match(pattern);
        if (match && match.groups && match.groups.subject && match.groups.definition) {
          const subject = match.groups.subject.trim();
          const definition = match.groups.definition.trim();

          if (subject.length > 2 && definition.length > 10 && !questions.some(q => q.question.includes(subject))) {
            const correctAnswer = this.capitalize(definition);
            const distractors = this.generateDistractors(correctAnswer, concepts);

            const options = [correctAnswer, ...distractors].slice(0, 4);
            const shuffled = this.shuffleWithOptions(options, 0);

            questions.push({
              question: `Según el contenido del documento, ¿qué describe adecuadamente a "${subject}"?`,
              options: shuffled.options,
              correctIndex: shuffled.correctIndex
            });
            break;
          }
        }
      }
      if (questions.length >= 2) break;
    }
    return questions;
  },

  /**
   * Generates questions for purpose or objectives ("El objetivo principal es...", "sirve para...")
   */
  buildPurposeQuestions(sentences, concepts) {
    const questions = [];
    const purposePatterns = [
      /(?:objetivo|función|propósito|finalidad)\s+(?:principal|fundamental)?\s+(?:es|consiste en)\s+(?<purpose>.{15,110}?)(?=[.;,]|$)/i,
      /(?<item>[A-ZÁÉÍÓÚÑ][\w\s]{2,25}?)\s+tiene como propósito\s+(?<purpose>.{15,100}?)(?=[.;,]|$)/i
    ];

    for (const sentence of sentences) {
      for (const pattern of purposePatterns) {
        const match = sentence.match(pattern);
        if (match && match.groups && match.groups.purpose) {
          const purpose = this.capitalize(match.groups.purpose.trim());
          const distractors = this.generateDistractors(purpose, concepts);

          const options = [purpose, ...distractors].slice(0, 4);
          const shuffled = this.shuffleWithOptions(options, 0);

          questions.push({
            question: `De acuerdo con la presentación, ¿cuál es el objetivo o función principal destacada?`,
            options: shuffled.options,
            correctIndex: shuffled.correctIndex
          });
          break;
        }
      }
      if (questions.length >= 2) break;
    }
    return questions;
  },

  /**
   * Generates factual multiple choice questions from key statements
   */
  buildFactQuestions(sentences, concepts) {
    const questions = [];
    const candidateSentences = sentences.filter(s => s.length > 40 && s.length < 130);

    for (const sentence of candidateSentences) {
      // Find a key term in the sentence
      const term = concepts.topWords.find(w => sentence.toLowerCase().includes(w));
      if (term && term.length > 4) {
        const cleanSentence = sentence.replace(/[.;]+$/, '');
        const correctAnswer = cleanSentence;
        const distractors = [
          `No se aplica en los procesos descritos para ${term}.`,
          `Requiere suspender toda actividad relacionada con ${term}.`,
          `Depende exclusivamente de factores no contemplados en el documento.`
        ];

        const options = [correctAnswer, ...distractors];
        const shuffled = this.shuffleWithOptions(options, 0);

        questions.push({
          question: `¿Cuál de las siguientes afirmaciones sobre "${this.capitalize(term)}" es correcta según el texto?`,
          options: shuffled.options,
          correctIndex: shuffled.correctIndex
        });
        break;
      }
    }
    return questions;
  },

  /**
   * Generates questions based on distinct slide contents
   */
  buildSlideQuestions(pagesText, concepts) {
    const questions = [];
    if (pagesText.length >= 2) {
      const page = pagesText[1]; // Page 2 usually has key thematic content
      const sentences = this.extractSentences(page.text);
      if (sentences.length > 0) {
        const statement = sentences[0];
        const distractors = this.generateDistractors(statement, concepts);
        const options = [statement, ...distractors].slice(0, 4);
        const shuffled = this.shuffleWithOptions(options, 0);

        questions.push({
          question: `¿Qué punto relevante se desarrolla en las diapositivas del documento?`,
          options: shuffled.options,
          correctIndex: shuffled.correctIndex
        });
      }
    }
    return questions;
  },

  /**
   * Fallback contextual question
   */
  getGenericContextQuestion(concepts, idx) {
    const term = concepts.topWords[idx % concepts.topWords.length] || 'el contenido';
    const capTerm = this.capitalize(term);
    return {
      question: `¿Cuál es una consideración clave sobre "${capTerm}" indicada en el material?`,
      options: [
        `Es un elemento fundamental para el desarrollo y aplicación del tema.`,
        `Es un elemento secundario y opcional en el proceso.`,
        `No guarda relación con los objetivos planteados.`,
        `Queda deshabilitado en la fase de evaluación.`
      ],
      correctIndex: 0
    };
  },

  /**
   * Creates plausible, context-aware distractors
   */
  generateDistractors(correctAnswer, concepts) {
    const otherWords = concepts.topWords.slice(1, 6);
    const word1 = otherWords[0] ? this.capitalize(otherWords[0]) : 'revisión';
    const word2 = otherWords[1] ? this.capitalize(otherWords[1]) : 'análisis';

    return [
      `Se limita únicamente a la fase de ${word1} sin integración posterior.`,
      `Requiere la omisión deliberada de ${word2} en el procedimiento estándar.`,
      `Constituye un método experimental no recomendado en el documento.`
    ];
  },

  /**
   * Shuffles options and keeps track of where the correct index lands
   */
  shuffleWithOptions(options, originalCorrectIndex) {
    const correctValue = options[originalCorrectIndex];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffled.indexOf(correctValue);
    return {
      options: shuffled,
      correctIndex: newCorrectIndex
    };
  },

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  getFallbackQuestions() {
    return [
      {
        question: '¿Cuál es el propósito primordial del material expuesto?',
        options: [
          'Explicar y estructurar los conceptos fundamentales del tema',
          'Presentar un listado de bibliografía externa',
          'Documentar únicamente notas históricas secundarias',
          'Limitar la aplicación práctica de los conocimientos'
        ],
        correctIndex: 0
      },
      {
        question: '¿Qué paso se recomienda realizar para asimilar este contenido?',
        options: [
          'Revisar las diapositivas y completar las actividades requeridas',
          'Omitir la lectura de las conclusiones del tema',
          'Finalizar sin responder los puntos de autoevaluación',
          'No interactuar con los recursos adicionales'
        ],
        correctIndex: 0
      }
    ];
  },

  /**
   * Optional Generative AI Integration (Google Gemini API)
   * If the user provides a free Gemini API key, generates pedagogical questions
   */
  async generateWithGemini(fullText, apiKey, count = 3) {
    if (!apiKey) throw new Error('Se requiere una clave API de Gemini válida.');
    
    const sampleText = fullText.substring(0, 12000); // Send up to ~12k characters
    const prompt = `Actúa como un diseñador instruccional experto. Analiza el siguiente texto de un curso o presentación educativa y genera exactamente ${count} preguntas de opción múltiple en español para evaluar la comprensión del estudiante.
    
    Formato de salida OBLIGATORIO: Devuelve EXCLUSIVAMENTE un arreglo JSON válido (sin texto antes ni después, ni bloques markdown), con esta estructura:
    [
      {
        "question": "¿Enunciado de la pregunta?",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "correctIndex": 0
      }
    ]
    
    Donde correctIndex es el índice de la respuesta correcta (entre 0 y 3).
    
    TEXTO DEL CURSO:
    """${sampleText}"""`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Error HTTP ${response.status} de Gemini API`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error('No se recibió texto generado por Gemini.');

    // Parse JSON
    const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('La respuesta generada no tiene el formato de preguntas esperado.');
    }

    return parsed;
  }
};
