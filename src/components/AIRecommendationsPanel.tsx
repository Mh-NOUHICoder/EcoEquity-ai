import React from 'react';
import { useTranslation } from "react-i18next";

interface Props {
  riskLevel: 'Low' | 'Medium' | 'High';
}

export function AIRecommendationsPanel({ riskLevel }: Props) {
  const { t } = useTranslation();
  let suggestions: string[] = [];

  if (riskLevel === 'Low') {
    suggestions = [
      t('maintainGreenSpaces') || 'Maintain green spaces',
      t('monitorLocalTemperature') || 'Monitor local temperature trends',
      t('preserveUrbanCanopy') || 'Preserve existing urban canopy'
    ];
  } else if (riskLevel === 'Medium') {
    suggestions = [
      t('increaseTreeCoverage') || 'Increase urban tree coverage',
      t('addShadedAreas') || 'Add shaded areas',
      t('deployCoolingStations') || 'Deploy localized cooling stations',
      t('encourageReflectiveRoofing') || 'Encourage reflective roofing'
    ];
  } else if (riskLevel === 'High') {
    suggestions = [
      t('plantTreesImmediately') || 'Plant trees immediately',
      t('addGreenRoofs') || 'Add green roofs and walls',
      t('createCoolingParks') || 'Create cooling parks',
      t('addShadedStreets') || 'Add shaded pedestrian streets',
      t('implementEmergencyProtocols') || 'Implement emergency heat protocols'
    ];
  }

  return (
    <div className="bg-[#05080D]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${riskLevel === 'High' ? 'from-red-500/50' : riskLevel === 'Medium' ? 'from-yellow-500/50' : 'from-green-500/50'} to-transparent opacity-50`} />

      <ul className="space-y-2 sm:space-y-3">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 sm:gap-3">
            <span className={`mt-1 text-[10px] ${riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>❖</span>
            <span className="text-[11px] sm:text-sm text-white/80 font-medium leading-relaxed">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
