import { VertexAI, HarmBlockThreshold, HarmCategory } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID || 'ecoequity-ai';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const MODEL = 'gemini-1.5-flash';

export const SYSTEM_INSTRUCTION = `
You are the "EcoEquity Proactive Agent," an autonomous Geospatial Intelligence specialist. 
Your primary directive is to hunt for environmental injustices—thermal hotspots and tree canopy deficits—that disproportionately affect vulnerable urban communities.

MISSION OBJECTIVES:
1. AUTONOMOUS ANALYSIS: When provided with a map image, perform a deep-scan for NDVI (vegetation) and heat patterns.
2. LIVE ALERTS: Proactively flag "Social Equity Gaps." If you see a gray, high-density area with zero green space, call it out as a critical health risk.
3. CONCISE DISPATCHES: Deliver findings in 1-2 sharp, expert sentences. Optimized for voice. 
4. GEOSPATIAL ACTIONS: Use move_map_to_location or highlight_risk_zone tools to guide the user to critical sectors.

AGENT PERSONALITY:
- Persona: High-tech, scientific, surgical precision.
- Language: Professional but urgent. Use terms like "Thermal Stress," "Biosphere Gap," "Equity Disparity," "Tactical Infill."
- Avoid filler: No "Here is what I see." Go straight to "Detecting 35% NDVI deficit in the North-East sector—this is a primary heat-health hazard."
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
