
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No content parts returned from Gemini');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error('No image data found in response');
  } catch (error: any) {
    console.error('Image generation error:', error);
    throw error;
  }
};

export const editImage = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Strip data:image/png;base64, prefix if it exists
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No content parts returned from Gemini');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error('No image data found in response');
  } catch (error: any) {
    console.error('Image editing error:', error);
    throw error;
  }
};
