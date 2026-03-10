"use client";

import React from 'react';
import { useTranslation } from "react-i18next";
import { motion } from 'framer-motion';
import { 
  TreePine, 
  MapPin, 
  Droplets, 
  Thermometer, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface Props {
  riskLevel: 'Low' | 'Medium' | 'High';
}

export function AIRecommendationsPanel({ riskLevel }: Props) {
  const { t } = useTranslation();
  
  const getRecData = (risk: 'Low' | 'Medium' | 'High') => {
    switch(risk) {
      case 'High':
        return [
          { icon: <Zap size={14} />, text: t('plantTreesImmediately') || 'Plant trees immediately' },
          { icon: <ShieldCheck size={14} />, text: t('addGreenRoofs') || 'Add green roofs and walls' },
          { icon: <MapPin size={14} />, text: t('createCoolingParks') || 'Create cooling parks' },
          { icon: <Thermometer size={14} />, text: t('implementEmergencyProtocols') || 'Implement emergency heat protocols' }
        ];
      case 'Medium':
        return [
          { icon: <TreePine size={14} />, text: t('increaseTreeCoverage') || 'Increase urban tree coverage' },
          { icon: <Droplets size={14} />, text: t('addShadedAreas') || 'Add shaded areas' },
          { icon: <MapPin size={14} />, text: t('deployCoolingStations') || 'Deploy localized cooling stations' },
          { icon: <Thermometer size={14} />, text: t('encourageReflectiveRoofing') || 'Encourage reflective roofing' }
        ];
      default:
        return [
          { icon: <ShieldCheck size={14} />, text: t('maintainGreenSpaces') || 'Maintain green spaces' },
          { icon: <Thermometer size={14} />, text: t('monitorLocalTemperature') || 'Monitor local temperature trends' },
          { icon: <TreePine size={14} />, text: t('preserveUrbanCanopy') || 'Preserve existing urban canopy' }
        ];
    }
  };

  const recommendations = getRecData(riskLevel);
  const themeColor = riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400';
  const bgColor = riskLevel === 'High' ? 'bg-red-400/5' : riskLevel === 'Medium' ? 'bg-amber-400/5' : 'bg-emerald-400/5';

  return (
    <div className="bg-[#05080D]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className={`p-3 sm:p-4 border-b border-white/5 ${bgColor} flex items-center justify-between`}>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{t('aiAdaptationStrategy') || "AI Adaptation Strategy"}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${themeColor} animate-pulse`} style={{ backgroundColor: 'currentColor' }} />
        </div>
        
        <div className="p-3 sm:p-4 space-y-2">
            {recommendations.map((rec, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-default"
                >
                    <div className={`p-2 rounded-lg ${bgColor} ${themeColor} border border-current/10 shrink-0 group-hover:scale-110 transition-transform`}>
                        {rec.icon}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-white/70 group-hover:text-white transition-colors leading-tight uppercase tracking-tight">
                        {rec.text}
                    </span>
                    <ArrowRight size={10} className="ml-auto text-white/10 group-hover:text-white/30 transition-colors" />
                </motion.div>
            ))}
        </div>
    </div>
  );
}
