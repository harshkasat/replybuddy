// src/components/chat/InitialScreen.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatInput } from "./ChatInput";
import { CommandPalette } from "./CommandPalette";
import { CommandSuggestion as CommandSuggestionType } from "./types"; // Renamed import to avoid conflict
import { ActionButton } from "./ActionButton"; // Assuming ActionButton is used for command suggestions here
import * as React from "react";

interface InitialScreenProps {
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  isTyping: boolean;
  showCommandPalette: boolean;
  activeSuggestion: number;
  commandSuggestions: CommandSuggestionType[];
  onSelectCommandSuggestion: (index: number) => void;
  onToggleCommandPalette: (e: React.MouseEvent<HTMLButtonElement>) => void;
  commandPaletteRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  adjustTextareaHeight: (reset?: boolean) => void;
}

export function InitialScreen({
  inputValue,
  onInputValueChange,
  onSendMessage,
  onKeyDown,
  onInputFocus,
  onInputBlur,
  isTyping,
  showCommandPalette,
  activeSuggestion,
  commandSuggestions,
  onSelectCommandSuggestion,
  onToggleCommandPalette,
  commandPaletteRef,
  textareaRef,
  adjustTextareaHeight,
}: InitialScreenProps) {
  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <motion.div
        className="relative z-10 space-y-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header Text */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block"
          >
            <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-700 via-neutral-900 to-neutral-700 dark:from-white/90 dark:via-white dark:to-white/70 pb-1">
              How can I help today?
            </h1>
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-neutral-400 dark:via-white/20 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </motion.div>
          <motion.p
            className="text-sm text-neutral-500 dark:text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Type a command or ask a question
          </motion.p>
        </div>

        {/* Input Area Container */}
        <motion.div
          className={cn(
            "relative backdrop-blur-2xl rounded-2xl shadow-2xl",
            "bg-neutral-50 border border-neutral-200",
            "dark:bg-white/[0.02] dark:border-white/[0.05]"
          )}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence>
            {showCommandPalette && (
              <CommandPalette
                suggestions={commandSuggestions}
                activeSuggestion={activeSuggestion}
                onSelectSuggestion={onSelectCommandSuggestion}
                commandPaletteRef={commandPaletteRef}
                className="bottom-full mb-2" // Position above input
              />
            )}
          </AnimatePresence>

          <div className="p-4 pt-0">
            {" "}
            {/* Original padding was here */}
            <ChatInput
              value={inputValue}
              onValueChange={onInputValueChange}
              onSendMessage={onSendMessage}
              onKeyDown={onKeyDown}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              isTyping={isTyping}
              showCommandPalette={showCommandPalette} // For styling command button
              onToggleCommandPalette={onToggleCommandPalette}
              textareaRef={textareaRef}
              adjustTextareaHeight={adjustTextareaHeight}
              placeholder="Ask zap a question..."
              inputContainerClassName="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-white/[0.05]" // Classes for footer structure
              showTextareaRing={false}
              textareaMinHeight={60}
              isChatView={false} // For specific styling of initial screen input
            />
          </div>
        </motion.div>

        {/* Suggestion Buttons below input area */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {commandSuggestions.map((suggestion, index) => (
            <ActionButton
              key={suggestion.prefix}
              icon={suggestion.icon}
              label={suggestion.label}
              onClick={() => onSelectCommandSuggestion(index)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
