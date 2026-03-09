import React from 'react';
import { useTranslation } from "react-i18next";

interface RiskBadgeProps {
  riskLevel: 'Low' | 'Medium' | 'High';
}

export function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const { t } = useTranslation();
  let colorStyles = '';
  let translatedText = '';
  
  switch (riskLevel) {
    case 'High':
      colorStyles = 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      translatedText = t('highRisk') || 'High Risk';
      break;
    case 'Medium':
      colorStyles = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
      translatedText = t('mediumRisk') || 'Medium Risk';
      break;
    case 'Low':
      colorStyles = 'bg-green-500/20 text-green-500 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      translatedText = t('lowRisk') || 'Low Risk';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all ${colorStyles} whitespace-nowrap`}>
      {translatedText}
    </span>
  );
}
