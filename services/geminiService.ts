import { GoogleGenAI } from "@google/genai";
import { ScriptRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePodcastScript = async (request: ScriptRequest): Promise<string> => {
  const { toolName, toneIntensity, podcastName, hostName } = request;

  const systemInstruction = `
    Actúa como un guionista y productor creativo de un podcast de tecnología de culto.
    El tono debe ser: Informativo pero altamente Crítico, Sarcástico, Ácido y Humorístico.
    Estilo inspirado en: "La Tele", "El Siguiente Programa", "En caso de que el mundo se desintegre".
    
    Tu objetivo es escribir un guion completo para un episodio de 20-30 minutos (aprox 2500 palabras si fuera real, pero dame una versión condensada pero completa de unas 1000-1500 palabras).
    
    Audiencia: Millennials y Gen X desencantados (20-45 años).
    
    Formato del guion:
    - Usa etiquetas claras para personajes: [HOST: ${hostName}], [IA INVITADA], [SFX], [MÚSICA], [TRANSICIÓN].
    - Incluye indicaciones técnicas para Adobe Audition (ej: "Fade out", "Compresión de voz", "Efecto de radio antigua").
    - **TRANSICIONES:** Entre cada sección del guion, DEBES insertar explícitamente una transición de audio creativa. Ejemplo: [TRANSICIÓN: Ruido blanco y corte seco], [TRANSICIÓN: Sintonización de radio vieja], [TRANSICIÓN: Fade out con eco].
    
    Estructura obligatoria del episodio:
    1. **Banda Sonora (Intro):** Sugiere una música de intro específica y libre de derechos (Royalty Free). Describe el estilo (ej: "Jazz Noir Cyberpunk", "Polka Industrial") y explica sarcásticamente por qué encaja con el tema de hoy.
    2. **Intro:** Presentación del tema (${toolName}) con tono irónico.
    3. **Contexto Histórico (La parte aburrida):** Breve historia de la herramienta.
    4. **Para qué sirve realmente:** Principales usos y puntos fuertes.
    5. **El Lado Oscuro (Sección de humor):** Ejemplos de mal uso, alucinaciones, o aplicaciones cuestionables/ridículas.
    6. **Top 5:** Los 5 mejores usos (o los más vagos).
    7. **La Entrevista:** Conversación entre el HOST y una personificación de la IA (${toolName}). La IA debe tener una personalidad basada en sus estereotipos (ej: ChatGPT sabelotodo, Gemini entusiasta, etc.).
    8. **Conclusión:** Reflexión final ácida y despedida.
  `;

  const prompt = `
    Escribe el guion para el podcast "${podcastName}".
    Tema del episodio: ${toolName}.
    Nivel de sarcasmo (1-10): ${toneIntensity}.
    Host: ${hostName}.
    
    Asegúrate de que el humor sea inteligente y las críticas a la tecnología sean agudas.
    Incluye sugerencias de efectos de sonido (SFX) específicos para usar en post-producción.
    IMPORTANTE: 
    1. No olvides la sección de sugerencia musical al principio.
    2. Añade sugerencias de transiciones de audio (corte seco, fade out, efectos) entre CADA sección.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // High creativity
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster literary generation
      }
    });

    return response.text || "Hubo un error generando el guion. Intenta de nuevo.";
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script via Gemini API.");
  }
};

export const processAudio = async (
  audioBase64: string, 
  mimeType: string, 
  mode: 'transcribe' | 'humor', 
  sarcasmLevel: number = 5
): Promise<string> => {
  
  let promptText = "";
  
  if (mode === 'transcribe') {
    promptText = "Transcribe este audio exactamente palabra por palabra. No añadas comentarios, ni descripciones, solo el texto hablado.";
  } else {
    promptText = `
      Escucha este audio. Tu tarea es reescribir lo que se dice pero con un nivel de sarcasmo y acidez de ${sarcasmLevel}/10.
      Mantén el significado central del mensaje, pero hazlo gracioso, cínico y burlón.
      Si el audio es serio, búrlate de su seriedad. Si es tonto, exagera su estupidez.
      Formato de salida: Texto plano listo para ser leído por un locutor sarcástico.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: promptText }
        ]
      }
    });

    return response.text || "No se pudo procesar el audio.";
  } catch (error) {
    console.error("Error processing audio:", error);
    throw new Error("Failed to process audio via Gemini API.");
  }
};