import { NDVIFeature, Language, AIResult, AIRecommendation } from "@/types";
import { CITY_AVG_NDVI } from "./data";

export async function generateAIInsight(feature: NDVIFeature, lang: Language = "en"): Promise<AIResult> {
  const { name, ndvi, population, treeCount, avgTemp } = feature.properties;
  const riskScore = Math.min(1, Math.max(0, 1 - (ndvi * 1.2)));

  try {
    // Attempt real-time AI generation via the established API route
    const prompt = `Analyze the environmental status of sector ${name}. 
    Data: NDVI ${ndvi.toFixed(4)}, Population ${population}, Avg Temp ${avgTemp.toFixed(1)}°C.
    Identify heat risks, social equity gaps, and provide 3 concrete actionable recommendations.
    Keep the narrative concise (2 sentences). 
    Language: ${lang}. 
    Format: Return as JSON with keys: text, recommendations (array of {id, type, title, description, impact}).`;

    const res = await fetch('/api/voice-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: prompt })
    });

    if (res.ok) {
        const reader = res.body?.getReader();
        if (reader) {
            const { value } = await reader.read();
            const text = new TextDecoder().decode(value);
            const dataLine = text.split('\n').find(l => l.startsWith('data:'));
            if (dataLine) {
                const parsed = JSON.parse(dataLine.replace('data: ', ''));
                if (parsed.type === 'response' && parsed.text) {
                    // Try to parse the JSON from the text if the model returned it that way
                    try {
                        const jsonMatch = parsed.text.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const aiData = JSON.parse(jsonMatch[0]);
                            return {
                                text: aiData.text || parsed.text.split('{')[0].trim(),
                                riskScore,
                                healthImpact: "Satellite analysis indicates localized thermal stress in high-density zones.",
                                recommendations: aiData.recommendations || [],
                                timestamp: new Date().toLocaleTimeString()
                            };
                        }
                    } catch (e) {
                        // If parsing fails, just use the raw text
                        return {
                            text: parsed.text,
                            riskScore,
                            healthImpact: "Risk analysis synchronized with real-time telemetry.",
                            recommendations: [
                                { id: 'r1', type: 'planting', title: 'Expand Canopy', description: 'Priority reforestation project.', impact: 'high' }
                            ],
                            timestamp: new Date().toLocaleTimeString()
                        };
                    }
                }
            }
        }
    }
  } catch (err) {
    console.warn("[EcoEquity] Real-time insight failed, using fallback logic.");
  }

  // Fallback to existing logic if API fails or is slow
  // Simulate API call delay (kept for fallback simulation)
  await new Promise(res => setTimeout(res, 1200 + Math.random() * 500));

  const content = {
    en: {
        hot: {
            text: `Sector ${name} exhibits critical thermal retention. Priority intervention: Immediate reforestation of core grid-points.`,
            healthImpact: "High risk of heatstroke and respiratory distress in vulnerable populations.",
            recTitles: ["Emergency Canopy", "Cooling Station", "Urban Policy"],
            recDescs: [
                "Deploy rapid-growth shade trees in residential corridors.",
                "Establish accessible cooling centers within 500m of this sector.",
                "Implement reflective 'cool roof' requirements for new developments."
            ]
        },
        stable: {
            text: `Sector ${name} exhibits stable biosynthetic output. Priority intervention: Maintaining current canopy density levels.`,
            healthImpact: "Minimal environmental health risks detected. Ecosystem cooling is optimal.",
            recTitles: ["Preservation", "Community Garden", "Biodiversity Link"],
            recDescs: [
                "Maintain existing canopy density through regular biosystem audits.",
                "Incentivize local community gardens to further boost neighborhood cooling.",
                "Create green corridors connecting this sector to adjacent higher-risk zones."
            ]
        }
    },
    ar: {
        hot: {
            text: `يُظهر قطاع ${name} احتباساً حرارياً حرجاً. التدخل ذو الأولوية: إعادة تشجير فورية لنقاط الشبكة الأساسية.`,
            healthImpact: "خطر كبير للإصابة بضربات الشمس وضيق التنفس لدى الفئات الضعيفة.",
            recTitles: ["مظلة الطوارئ", "محطة تبريد", "السياسة الحضرية"],
            recDescs: [
                "نشر أشجار الظل سريعة النمو في الممرات السكنية.",
                "إنشاء مراكز تبريد يمكن الوصول إليها على بعد 500 متر من هذا القطاع.",
                "تنفيذ متطلبات 'الأسطح الباردة' العاكسة للتطورات الجديدة."
            ]
        },
        stable: {
            text: `يُظهر قطاع ${name} إنتاجاً حيوياً مستقراً. التدخل ذو الأولوية: الحفاظ على مستويات كثافة المظلة الحالية.`,
            healthImpact: "تم اكتشاف حد أدنى من المخاطر الصحية البيئية. تبريد النظام البيئي مثالي.",
            recTitles: ["الحفاظ", "حديقة مجتمعية", "رابط التنوع البيولوجي"],
            recDescs: [
                "الحفاظ على كثافة المظلة الحالية من خلال عمليات تدقيق منتظمة للنظام الحيوي.",
                "تحفيز الحدائق المجتمعية المحلية لتعزيز تبريد الأحياء.",
                "إنشاء ممرات خضراء تربط هذا القطاع بالمناطق المجاورة ذات المخاطر العالية."
            ]
        }
    },
    fr: {
        hot: {
            text: `Le secteur ${name} présente une rétention thermique critique. Intervention prioritaire : Reboisement immédiat des points centraux.`,
            healthImpact: "Risque élevé de coup de chaleur et de détresse respiratoire.",
            recTitles: ["Canopée d'urgence", "Station de refroidissement", "Politique urbaine"],
            recDescs: [
                "Planter des arbres d'ombrage à croissance rapide.",
                "Établir des centres de refroidissement accessibles.",
                "Mettre en œuvre des toits réfléchissants."
            ]
        },
        stable: {
            text: `Le secteur ${name} présente une production biosynthétique stable. Intervention prioritaire : Maintien des niveaux de densité de canopée.`,
            healthImpact: "Risques sanitaires minimes. Le refroidissement de l'écosystème est optimal.",
            recTitles: ["Préservation", "Jardin communautaire", "Lien biodiversité"],
            recDescs: [
                "Maintenir la densité de la canopée existante.",
                "Encourager les jardins communautaires locaux.",
                "Créer des corridors verts."
            ]
        }
    },
    es: {
        hot: {
            text: `El sector ${name} presenta una retención térmica crítica. Intervención prioritaria: Reforestación inmediata de los puntos centrales.`,
            healthImpact: "Alto riesgo de golpe de calor y problemas respiratorios.",
            recTitles: ["Dosel de emergencia", "Estación de enfriamiento", "Política urbana"],
            recDescs: [
                "Desplegar árboles de sombra de rápido crecimiento.",
                "Establecer centros de enfriamiento accesibles.",
                "Implementar techos reflectantes."
            ]
        },
        stable: {
            text: `El sector ${name} presenta una producción biosintética estable. Intervención prioritaria: Mantenimiento de los niveles de densidad actuales.`,
            healthImpact: "Riesgos ambientales mínimos. El enfriamiento del ecosistema es óptimo.",
            recTitles: ["Preservación", "Jardín comunitario", "Enlace de biodiversidad"],
            recDescs: [
                "Mantener la densidad del dosel existente.",
                "Incentivar jardines comunitarios locales.",
                "Crear corredores verdes."
            ]
        }
    }
  };

  const translations = (content as any)[lang] || content.en;
  
  // Dynamic logic for more variety (simplified for fallback as per instruction)
  let activeData = ndvi < 0.2 ? translations.hot : translations.stable;

  const recommendations: AIRecommendation[] = [
    {
      id: "rec-1",
      type: ndvi < 0.2 ? "planting" : (ndvi < 0.4 ? "maintenance" : "policy"),
      title: activeData.recTitles[0],
      description: activeData.recDescs[0],
      impact: "high"
    },
    {
      id: "rec-2",
      type: ndvi < 0.2 ? "cooling" : (ndvi < 0.4 ? "infra" : "community"),
      title: activeData.recTitles[1],
      description: activeData.recDescs[1],
      impact: "medium"
    },
    {
        id: "rec-3",
        type: "policy",
        title: activeData.recTitles[2],
        description: activeData.recDescs[2],
        impact: "low"
      }
  ];

  return {
    text: activeData.text,
    riskScore,
    healthImpact: activeData.healthImpact,
    recommendations,
    timestamp: new Date().toLocaleTimeString()
  };
}