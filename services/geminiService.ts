
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Claim, TrustState } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fast claim extraction using gemini-2.5-flash-lite
 */
export const extractAndAnalyzeClaims = async (text: string): Promise<Claim[]> => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite", // Fast AI Responses as requested
    contents: `Extract factual claims and analyze plausibility: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            plausibility: { type: Type.STRING, enum: ["high", "medium", "low"] },
            confidence_score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            red_flags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "text", "plausibility", "confidence_score", "reasoning", "red_flags"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

/**
 * Maps Grounding using gemini-2.5-flash
 */
export const performMapsVerification = async (query: string, lat?: number, lng?: number) => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Verify location-based claim: "${query}"`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
        }
      }
    }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// Added performWebSearch to fix the missing export error
/**
 * Search Grounding using gemini-3-flash-preview
 */
export const performWebSearch = async (query: string) => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Verify this claim using search: "${query}"`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

/**
 * Deep Thinking Review using Gemini 3 Pro
 */
export const performDeepTrustReview = async (state: TrustState): Promise<{ explanation: string, scoreAdjustment: number }> => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Deep verify this analysis state for hidden hallucinations: ${JSON.stringify(state)}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          scoreAdjustment: { type: Type.NUMBER }
        },
        required: ["explanation", "scoreAdjustment"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Multimodal Analysis (Image/Video) using Gemini 3 Pro
 */
export const analyzeMedia = async (fileBase64: string, mimeType: string, prompt: string) => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        { inlineData: { data: fileBase64, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: { thinkingConfig: { thinkingBudget: 16000 } }
  });
  return response.text;
};

/**
 * Speech Generation using Gemini 2.5 Flash Preview TTS
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

/**
 * Chatbot with gemini-3-pro-preview
 */
export const startChat = (systemInstruction: string) => {
  const ai = createAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};
