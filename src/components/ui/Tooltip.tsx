"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  id: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, id }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={id}
        tabIndex={0}
        className="cursor-help flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-full"
      >
        {children || <Info size={14} className="text-white/40 group-hover:text-emerald-400 transition-colors" />}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 z-[1000] bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-none"
          >
            <p className="text-[11px] leading-relaxed font-medium text-white/90">
              {content}
            </p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 border-l border-b border-white/10 bg-black/90 rotate-[-45deg] -translate-y-1.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
