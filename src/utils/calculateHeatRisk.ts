

export interface CalculateHeatRiskParams {
  ndvi: number;
  temperature: number;
  urbanDensity: number;
}

export function calculateHeatRisk({ ndvi, temperature, urbanDensity }: CalculateHeatRiskParams): { score: number; riskLevel: "Low" | "Medium" | "High" } {
  // Score heuristics:
  // Lower NDVI (less green) increases risk. Normalized so NDVI=0 -> 1, NDVI=1 -> 0
  const normNdvi = Math.max(0, 1 - ndvi);
  const ndviRisk = normNdvi * 40; // max 40 points

  // Higher temperature increases risk. e.g. 20C -> 0, 45C -> 50
  const normTemp = Math.max(0, Math.min(100, (temperature - 20) * 2));
  const tempRisk = normTemp * 0.4; // max 40 points

  // Higher urban density increases risk. 0 -> 0, 1 -> 20
  const densityRisk = Math.max(0, Math.min(1, urbanDensity)) * 20;

  let score = Math.round(ndviRisk + tempRisk + densityRisk);
  
  // High vegetation acts as a powerful shield against heat risk
  if (ndvi >= 0.7) {
      score -= 30; // Massive cooling bonus for dense forests/parks
  } else if (ndvi >= 0.6) {
      score -= 20; 
  }

  score = Math.max(0, Math.min(100, score));

  let riskLevel: "Low" | "Medium" | "High" = "Low";
  if (score >= 60) {
    riskLevel = "High";
  } else if (score >= 30) {
    riskLevel = "Medium";
  }

  return { score, riskLevel };
}
