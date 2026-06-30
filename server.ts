import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support larger base64 uploads for images and files
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Initialize server-side Google Gen AI client
  // Clave de API integrada directamente para que funcione al subir a tu servidor
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBzlFVEBAU2N0dPhRX5CDb4XLHHzB4yvts";

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Helper to query Gemini with fallback models for high resilience against 503 errors
  const callGeminiWithFallback = async (
    contents: any,
    schema: any
  ): Promise<string> => {
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError: any = null;

    for (const model of models) {
      try {
        console.log(`Intentando llamar a Gemini con el modelo: ${model}`);
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const text = response.text;
        if (text && text.trim()) {
          console.log(`Respuesta exitosa recibida del modelo: ${model}`);
          return text.trim();
        }
      } catch (err: any) {
        console.warn(`Error con modelo ${model}:`, err.message || err);
        lastError = err;
      }
    }
    throw lastError || new Error("Todos los modelos de Gemini fallaron.");
  };

  // API endpoints FIRST
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, schema } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Falta el prompt de consulta." });
      }

      console.log("Calling Gemini generateContent with prompt...");
      const text = await callGeminiWithFallback(prompt, schema);
      res.json({ result: JSON.parse(text) });
    } catch (error: any) {
      console.error("Error en /api/gemini/generate:", error);
      res.status(500).json({ error: error.message || "Error al procesar la consulta de IA." });
    }
  });

  app.post("/api/gemini/vision", async (req, res) => {
    try {
      const { prompt, schema, image, mimeType } = req.body;
      if (!image || !mimeType || !prompt) {
        return res.status(400).json({ error: "Faltan parámetros: imagen, mimeType o prompt." });
      }

      console.log("Calling Gemini Vision generateContent with base64 image...");
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      };
      const textPart = {
        text: prompt,
      };

      const text = await callGeminiWithFallback({ parts: [imagePart, textPart] }, schema);
      res.json({ result: JSON.parse(text) });
    } catch (error: any) {
      console.error("Error en /api/gemini/vision:", error);
      res.status(500).json({ error: error.message || "Error al analizar la imagen pericial." });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode with static assets serving");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
});
