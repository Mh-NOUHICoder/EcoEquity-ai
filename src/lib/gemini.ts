import { NDVIFeature } from "@/types";
import { CITY_AVG_NDVI } from "./data";

// This is a mock function. In a real application, this would
// make a call to the Google Gemini API.
export async function generateAIInsight(feature: NDVIFeature): Promise<string> {
  const { name, ndvi, population, treeCount, avgTemp } = feature.properties;
  const diff = ((ndvi - CITY_AVG_NDVI) / CITY_AVG_NDVI) * 100;
  const isHot = ndvi < 0.2;

  // Simulate API call delay
  await new Promise(res => setTimeout(res, 800 + Math.random() * 500));

  if (isHot) {
    return `
      ${name} is a critical heat island with an NDVI of ${ndvi.toFixed(2)}, which is 
      ${Math.abs(diff).toFixed(0)}% below the city average. The high average temperature of 
      ${avgTemp}°C, combined with a low tree count of ${treeCount} for a population of 
      ${population.toLocaleString()}, poses significant health risks. Urgent greening interventions, 
      such as planting shade trees, are recommended to mitigate heat stress.
    `;
  }

  return `
    ${name} has an NDVI of ${ndvi.toFixed(2)}, which is ${diff > 0 ? `${diff.toFixed(0)}% above` : `${Math.abs(diff).toFixed(0)}% below`} 
    the city average. With a population of ${population.toLocaleString()} and ${treeCount} trees, its thermal profile is relatively stable. 
    Continued investment in maintaining its green spaces is advised.
  `;
}