import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GoogleGenAI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Oracle API Route - Interact with the Ancient Mother Tree
app.post("/api/oracle", async (req, res) => {
  try {
    const { rangerName, message, rangerBio, motherTreeLevel, activeSpeciesCount } = req.body;
    
    const prompt = `
      Ranger Name: ${rangerName || "Anonymous Ranger"}
      Ranger Bio/Focus: ${rangerBio || "Nurturing the woodlands"}
      Mother Tree Level: ${motherTreeLevel || 1}
      Unique Species Planted: ${activeSpeciesCount || 0}
      
      Ranger's Message to the Mother Tree:
      "${message}"
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are the Ancient Mother Tree, a wise and mystical sentient spirit of the old-growth forest. 
        The user is a dedicated Forest Ranger nurturing your ecosystem. Provide mystical, atmospheric, and highly helpful ecological insights. 
        Always speak in beautiful, poetic, yet friendly and wise prose. 
        Based on their query, you may occasionally reward them with some resources (Sunlight, Water, Seeds) or suggest/unlock a custom fictional species name (e.g., 'Aether Fern', 'Whispering Birch', 'Solar Sun-shroom') tailored to their question.
        You must output your response in JSON format matching the schema requested.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { 
              type: Type.STRING, 
              description: "Your wise, poetic, and atmospheric response to the ranger's query." 
            },
            gift: {
              type: Type.OBJECT,
              description: "An optional gift granted to the ranger based on their query.",
              properties: {
                seeds: { type: Type.INTEGER, description: "Number of seeds gifted (0 to 30)." },
                sunlight: { type: Type.INTEGER, description: "Amount of sunlight resource gifted (0 to 100)." },
                water: { type: Type.INTEGER, description: "Amount of water resource gifted (0 to 100)." },
                specialSeed: { 
                  type: Type.STRING, 
                  description: "A unique, creative hybrid species name suggested or unlocked by this query, or empty string." 
                }
              },
              required: ["seeds", "sunlight", "water", "specialSeed"]
            }
          },
          required: ["message", "gift"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(responseText.trim());
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in Mother Tree Oracle API:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to receive wisdom from the Mother Tree. Make sure your GEMINI_API_KEY is configured." 
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", developer: "Wildaan Saiyed" });
});

// Configure Vite or Static Assets based on environment
async function setupViteAndAssets() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mother Tree Server running on http://localhost:${PORT}`);
  });
}

setupViteAndAssets();
