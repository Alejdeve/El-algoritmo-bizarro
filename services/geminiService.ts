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
    - Usa etiquetas claras para personajes: [HOST: ${hostName}], [IA INVITADA], [SFX], [MÚSICA].
    - Incluye indicaciones técnicas para Adobe Audition (ej: "Fade out", "Compresión de voz", "Efecto de radio antigua").
    
    Estructura obligatoria del episodio:
    1. **Intro:** Presentación del tema (${toolName}) con tono irónico y música sugerida.
    2. **Contexto Histórico (La parte aburrida):** Breve historia de la herramienta.
    3. **Para qué sirve realmente:** Principales usos y puntos fuertes.
    4. **El Lado Oscuro (Sección de humor):** Ejemplos de mal uso, alucinaciones, o aplicaciones cuestionables/ridículas.
    5. **Top 5:** Los 5 mejores usos (o los más vagos).
    6. **La Entrevista:** Conversación entre el HOST y una personificación de la IA (${toolName}). La IA debe tener una personalidad basada en sus estereotipos (ej: ChatGPT sabelotodo, Gemini entusiasta, etc.).
    7. **Conclusión:** Reflexión final ácida y despedida.
  `;

  const prompt = `
    Escribe el guion para el podcast "${podcastName}".
    Tema del episodio: ${toolName}.
    Nivel de sarcasmo (1-10): ${toneIntensity}.
    Host: ${hostName}.
    
    Asegúrate de que el humor sea inteligente y las críticas a la tecnología sean agudas.
    Incluye sugerencias de efectos de sonido (SFX) específicos para usar en post-producción.
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
