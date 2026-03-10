import { NDVIFeature, Language, AIResult, AIRecommendation } from "@/types";
import { CITY_AVG_NDVI } from "./data";

export async function generateAIInsight(feature: NDVIFeature, lang: Language = "en"): Promise<AIResult> {
  const { name, ndvi, population, treeCount, avgTemp } = feature.properties;
  const diff = ((ndvi - CITY_AVG_NDVI) / CITY_AVG_NDVI) * 100;
  const isHot = ndvi < 0.2;
  const riskScore = Math.min(1, Math.max(0, 1 - (ndvi * 1.2)));

  // Simulate API call delay
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

  const translations = content[lang] || content.en;
  const activeData = isHot ? translations.hot : translations.stable;

  const recommendations: AIRecommendation[] = [
    {
      id: "rec-1",
      type: isHot ? "planting" : "policy",
      title: activeData.recTitles[0],
      description: activeData.recDescs[0],
      impact: "high"
    },
    {
      id: "rec-2",
      type: isHot ? "cooling" : "community",
      title: activeData.recTitles[1],
      description: activeData.recDescs[1],
      impact: "medium"
    },
    {
        id: "rec-3",
        type: isHot ? "policy" : "community",
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