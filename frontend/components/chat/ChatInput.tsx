// src/components/chat/ChatInput.tsx
"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Command, SendIcon, LoaderIcon } from "lucide-react";
import { CustomTextareaProps } from "./types"; // Renamed to avoid conflict with HTMLTextareaElement
import { useAutoResizeTextarea } from "./hooks/useAutoResizeTextarea";

// Simplified Textarea implementation (can be a separate component if it grows)
const InternalTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CustomTextareaProps
>(({ className, containerClassName, showRing = true, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  return (
    <div className={cn("relative", containerClassName)}>
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "transition-all duration-200 ease-in-out placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          showRing
            ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            : "",
          className
        )}
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {showRing && isFocused && (
        <motion.span
          className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30 dark:ring-violet-400/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {/* Ripple div from original, if its JS trigger is still used elsewhere */}
      {props.onChange && (
        <div
          className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
          style={{ animation: "none" }}
          id="textarea-ripple"
        />
      )}
    </div>
  );
});
InternalTextarea.displayName = "InternalTextarea";

interface ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isTyping: boolean;
  showCommandPalette: boolean;
  onToggleCommandPalette: (e: React.MouseEvent<HTMLButtonElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  adjustTextareaHeight: (reset?: boolean) => void;
  placeholder?: string;
  inputContainerClassName?: string;
  textareaMinHeight?: number;
  showTextareaRing?: boolean;
  isChatView?: boolean; // To adjust styles for chat view vs initial view
}

export function ChatInput({
  value,
  onValueChange,
  onSendMessage,
  onKeyDown,
  onFocus,
  onBlur,
  isTyping,
  showCommandPalette,
  onToggleCommandPalette,
  textareaRef,
  adjustTextareaHeight,
  placeholder = "Ask something...",
  inputContainerClassName,
  textareaMinHeight = 60,
  showTextareaRing = true,
  isChatView = false,
}: ChatInputProps) {
  return (
    <div
      className={cn(
        isChatView ? "flex items-end gap-2" : "",
        inputContainerClassName
      )}
    >
      {/* Command Toggle Button */}
      <motion.button
        type="button"
        data-command-button
        onClick={onToggleCommandPalette}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white/90 rounded-lg transition-colors relative group",
          isChatView ? "mb-[calc(7px)]" : "", // Align with send button on multi-line
          showCommandPalette &&
            (isChatView
              ? "bg-neutral-200 dark:bg-white/10"
              : "bg-white/10 text-white/90")
        )}
      >
        <Command className="w-4 h-4" />
        {!isChatView && (
          <motion.span // Highlight for initial view only
            className="absolute inset-0 bg-neutral-500/[0.1] dark:bg-white/[0.08] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            layoutId="button-highlight"
          />
        )}
      </motion.button>

      {/* Textarea Input */}
      <InternalTextarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        containerClassName={isChatView ? "flex-1" : "w-full"}
        className={cn(
          "w-full px-4 py-3 resize-none text-sm focus:outline-none",
          `min-h-[${textareaMinHeight}px]`,
          isChatView
            ? "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-800 dark:text-white/90 placeholder:text-neutral-400 dark:placeholder:text-white/30"
            : "bg-transparent border-none text-neutral-800 dark:text-white/90 placeholder:text-neutral-400 dark:placeholder:text-white/30"
        )}
        style={{ overflow: "hidden" }}
        showRing={showTextareaRing}
        rows={1} // Important for auto-resize to start from a single line
      />

      {/* Send Message Button */}
      <motion.button
        type="button"
        onClick={onSendMessage}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        disabled={isTyping || !value.trim()}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
          isChatView
            ? `self-end mb-[calc(7px)] h-[${textareaMinHeight - 14}px]`
            : "", // Align and size with textarea
          `h-[46px]`, // Fixed height for consistency
          value.trim()
            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 dark:bg-white dark:text-[#0A0A0B] dark:shadow-lg dark:shadow-white/10"
            : "bg-neutral-200 text-neutral-400 dark:bg-white/[0.08] dark:text-neutral-500"
        )}
      >
        {isTyping ? (
          <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
        ) : (
          <SendIcon className="w-4 h-4" />
        )}
        {!isChatView && <span>Send</span>}{" "}
        {/* Show "Send" text only in initial view */}
      </motion.button>
    </div>
  );
}
