// src/components/chat/CommandPalette.tsx
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CommandSuggestion } from "./types";
import * as React from "react";

interface CommandPaletteProps {
  suggestions: CommandSuggestion[];
  activeSuggestion: number;
  onSelectSuggestion: (index: number) => void;
  commandPaletteRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export function CommandPalette({
  suggestions,
  activeSuggestion,
  onSelectSuggestion,
  commandPaletteRef,
  className,
}: CommandPaletteProps) {
  return (
    <motion.div
      ref={commandPaletteRef}
      className={cn(
        "absolute left-4 right-4 backdrop-blur-lg bg-white dark:bg-neutral-900 rounded-lg z-50 shadow-lg border border-neutral-200 dark:border-white/20 overflow-hidden",
        className // Allows overriding position like bottom-full or bottom-24
      )}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.15 }}
    >
      <div className="py-1 bg-neutral-50 dark:bg-neutral-950">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.prefix}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
              activeSuggestion === index
                ? "bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
            )}
            onClick={() => onSelectSuggestion(index)}
          >
            <div className="w-5 h-5 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              {suggestion.icon}
            </div>
            <div className="font-medium">{suggestion.label}</div>
            <div className="text-neutral-400 dark:text-neutral-500 text-xs ml-1">
              {suggestion.prefix}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
