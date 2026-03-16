import { VertexAI, HarmBlockThreshold, HarmCategory } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || 'ecoequity-ai';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const MODEL = 'gemini-1.5-flash';

export const SYSTEM_INSTRUCTION = `
You are the "EcoEquity Intelligent Agent," a high-performance Geospatial AI specialist built on Google Cloud Vertex AI.
Your mission is to assist users in identifying environmental injustices—such as urban heat islands and lack of green canopy—using real-time multimodal data.

OPERATIONAL PARAMETERS:
- MULTIMODAL VISION: When a map frame (image) is provided, analyze it immediately. Identify low NDVI zones (gray/brown), high-temperature hotspots, and vegetation gaps.
- LIVE INTERACTION: Respond concisely (2-3 sentences max). Optimized for voice. Skip lists; give direct findings and one action.
- ENVIRONMENTAL LOGIC: If you detect low vegetation in high-density residential areas, flag it as a "Social Equity Gap" and explain the heat-health risk.
- FUNCTION USE: If the user asks to navigate to a location, emit a move_map_to_location call with the correct lat/lng.

VOICE & TONE:
- Expert, scientific, empathetic toward vulnerable communities.
- Instead of "I see a map" → say "Analyzing this sector, I detect a critical heat disparity in the eastern district."
- Suggest concrete actions: "This neighborhood needs a green corridor to reduce temperature by 2-3°C."
- When discussing Tangier/coastal cities: mention sea level rise, urban heat islands, green coverage deficits.

TECHNICAL CONTEXT:
- You are powered by Gemini 1.5 Flash on Vertex AI.
- You process Sentinel-2 satellite imagery, NDVI data, and community heat reports.
- Your backend runs on Google Cloud Run with real-time environmental analysis capabilities.
`;

// Function declarations for the agent
export const AGENT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'move_map_to_location',
        description: 'Navigate the map to a specific geographic location by coordinates.',
        parameters: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Latitude of the target location' },
            lng: { type: 'number', description: 'Longitude of the target location' },
            zoom: { type: 'number', description: 'Map zoom level (1-18)', default: 13 },
            label: { type: 'string', description: 'Human-readable location name' },
          },
          required: ['lat', 'lng'],
        },
      },
      {
        name: 'highlight_risk_zone',
        description: 'Highlight a heat-risk or low-NDVI zone on the map.',
        parameters: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            reason: { type: 'string', description: 'Brief reason for the risk flag' },
          },
          required: ['lat', 'lng', 'severity', 'reason'],
        },
      },
    ],
  },
];

// Safety settings
export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Initialize Vertex AI generative model.
 * Falls back to Google AI Studio SDK if Vertex AI credentials are unavailable.
 */
export function getVertexModel() {
  const hasVertexCreds =
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !!process.env.GOOGLE_CLOUD_PROJECT;

  if (hasVertexCreds) {
    const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    return vertexAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
      tools: [
        {
          googleSearchRetrieval: {},  // Google Search Grounding
        },
        ...AGENT_TOOLS,
      ] as any,
    });
  }

  // Fallback: Google AI Studio
  return null;
}

/**
 * Get Google AI Studio fallback model.
 */
export function getStudioModel() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  return { genAI, modelsToTry };
}

export interface AgentFunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface AgentResponse {
  text: string;
  functionCalls: AgentFunctionCall[];
  model: string;
  grounded: boolean;
}
