<div align="center">
  <img src="public/ecoequity-ai.png" alt="EcoEquity AI Logo" width="400" height="auto" />
  <h1>🌿 EcoEquity AI</h1>
  <p><strong>Advanced Geospatial AI & Multimodal Climate Intelligence</strong></p>
  <p><em>Orchestrating satellite telemetry, real-time vision, and voice-driven AI to resolve urban thermal inequity.</em></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript" alt="TypeScript"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
    <a href="https://cloud.google.com/vertex-ai"><img src="https://img.shields.io/badge/Google_Cloud-Vertex_AI-4285F4?logo=google-cloud&logoColor=white" alt="Vertex AI"></a>
    <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/AI-Gemini-4285F4?logo=google-gemini&logoColor=white" alt="Gemini 1.5 Flash"></a>
    <a href="https://www.sentinel-hub.com/"><img src="https://img.shields.io/badge/Satellite-Sentinel_Hub-004B87" alt="Sentinel Hub"></a>
  </p>
</div>

<br />

---

## 🏆 Hackathon Compliance & Requirements
This project is purpose-built to exceed all mandatory hackathon criteria:

- **🚀 Leverage a Gemini Model**: EcoEquity AI orchestrates the entire intelligence lifecycle using **Gemini 2.0 Flash**, **Gemini 1.5 Pro**, and the latest **Gemini 3.1 Preview** cores. These models handle real-time geospatial reasoning, thermal anomaly detection, and community strategy generation.
- **🤖 Google GenAI SDK Implementation**: The **Eco-Sentinel Agent** is architected using the official **Google Generative AI SDK** (`@google/generative-ai`). It leverages advanced features like **Function Calling** for map control and **Streaming SSE** for low-latency voice-to-action responses.
- **☁️ Google Cloud Ecosystem**: The platform is deeply integrated with the **Google Cloud** ecosystem:
  - **Vertex AI**: Used as the primary high-performance neural infrastructure for mission-critical environmental analysis.
  - **Google AI Studio**: Utilized for rapid prototyping and as a reliable fallback for model orchestration.
  - **Google Cloud Project**: All API services and tactical grounding are managed through a centralized GCP project environment.

## 🌐 Proof of Google Cloud Integration (Code Reference)
Per the hackathon requirements for technical proof:
- **🔗 Primary Integration File**: [`src/app/api/agent-query/route.ts`](./src/app/api/agent-query/route.ts)
- **🛠️ Technical Implementation**: This file demonstrates direct, production-grade interaction with **Google Cloud Vertex AI** endpoints using the official `@google-cloud/vertexai` library. It manages high-performance context windows, multimodal vision telemetry, and secure link-handling via the automated **Google Sentinel** logic layer.

---

## 🤖 The EcoEquity Intelligent Agent
The heart of the platform is a high-performance **Geospatial AI Assistant** powered by **Gemini 1.5 Flash** on **Google Cloud Vertex AI**. This isn't just a chatbot; it's a multimodal companion that lives inside the map.

### 🌟 Core Live Capabilities:
*   **🎙️ Natural Voice Interaction:** Low-latency, full-duplex voice interface using Web Speech API + SpeechSynthesis for a hands-free geospatial exploration experience.
*   **👁️ Multimodal Computer Vision:** The agent can **"see" your screen**. It captures real-time frames from the map canvas to analyze NDVI (Vegetation) indices and Urban Heat Islands (UHI) directly from your current view.
*   **🛠️ Tool Use & Function Calling:** The agent has direct control over the platform's UI. It can autonomously:
    *   `move_map_to_location(lat, lng)`: Navigate the map to areas of concern.
    *   `highlight_risk_zone(lat, lng, severity)`: Flag thermal stress hotspots based on visual analysis.
*   **🌐 Google Search Grounding:** Real-time verification of climate policies and environmental reports via Vertex AI Grounding to ensure data accuracy.
*   **⚡ Streaming Intelligence:** Server-Sent Events (SSE) enable real-time streaming of AI reasoning and function calls for an "instant" feel.

---

## 🛰️ Ecosystem Overview

EcoEquity AI bridges the gap between aerospace telemetry and hyper-local urban advocacy. Our platform follows a specialized, five-stage lifecycle:

1.  **Space-Layer Acquisition** 🛰️  
    Capturing high-resolution multispectral imagery directly from the **EU Copernicus Sentinel-2** constellation via Sentinel Hub.
2.  **Neural Core Processing** 🧠  
    Extracting **Thermal Anomalies** and **NDVI Indices** from spectral data.
3.  **Multimodal Synthesis** 🤖  
    The **EcoEquity Agent** analyzes the visualized data using Gemini visibility, identifying "Social Equity Gaps" where low vegetation meets high population density.
4.  **Community Validation** 👥  
    Local residents validate AI predictions through high-fidelity field reports.
5.  **Strategic Action** 🎯  
    Generating site-specific AI reforestation protocols and cooling station deployments.

---

## ✨ Features & Visual Interface

### 📡 Satellite HUD (Sentinel Hub)
A premium aerospace-grade interface providing direct access to **Sentinel Hub STAC** data.
- **Dynamic STAC Inspection:** Live metadata streams for Sentinel-2 collections.
- **Real-time Spectral Overlay:** Immediate NDVI visualization on the flight path.

### 🗺️ Tactical Tactical Analytics
- **Live Vector Layers:** District-level polygons showing vulnerability scores.
- **Unified Geolocation Sync:** Cross-component coordinate broadcast (Dashboard ↔ Agent ↔ Map).

### 🎙️ The Voice Command Center
- **Floating Waves UI:** A premium Glassmorphism interface for the Gemini Live Agent.
- **Visual Feedback:** Real-time user transcript and AI response visualization.
- **Action Dashboard:** See the agent "thinking" and executing UI commands (map moves, highlights).

---

## 🏗️ Technical Architecture

### The Live Agent Stack
| Layer | Technology | Role |
|-------|-----------|-------------|
| **AI SDK** | `@google-cloud/vertexai` | Primary infrastructure for Vision/Voice/Tools. |
| **Logic Core** | `api/voice-query/route.ts` | SSE Streaming proxy with multi-model fallback. |
| **Voice Interface** | Web Speech API | Client-side transcription and text-to-speech. |
| **Vision Feed** | Canvas API | Captures 1080p frames of the map for AI analysis. |
| **Function Bridge** | TypeScript Hooks | Maps AI function calls to platform UI actions. |
| **Persistence** | Supabase | Storage for reports and community equity metrics. |

---

## 🚀 Deployment & Configuration

### 1. Initialization
```bash
git clone https://github.com/your-org/eco-equity-ai.git
cd eco-equity-ai
npm install
```

### 2. Configure Environment `.env.local`
```env
# Vertex AI (Primary - For Live Agent Challenge)
VERTEX_AI_PROJECT_ID="ecoequity-ai"
VERTEX_AI_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Google AI Studio (Fallback)
NEXT_PUBLIC_GEMINI_API_KEY="AIza..."

# Satellite & Database
SENTINEL_CLIENT_ID="your_id"
SENTINEL_CLIENT_SECRET="your_secret"
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### 3. Run Development Core
```bash
npm run dev
```

---

## 🌍 Spatial Data Interpretation Baseline

| Index | Category | Thermal Impact | Tactical Priority |
|:-----:|:---------|:---------------|:------------------|
| **< 0.2** | 🔴 Critical | Extreme Heat Island | **Immediate Reforestation** |
| **0.2 – 0.4**| 🟡 Moderate | Significant Thermal Stress | **Mitigation Planning** |
| **> 0.4** | 🟢 Optimal | Healthy Bio-Regulated Zone | **Active Preservation** |

---

<div align="center">
  <b>EcoEquity AI: Engineering a cooler, more equitable urban future through aerospace intelligence and Gemini Multimodal Live.</b>
</div>

--- 
