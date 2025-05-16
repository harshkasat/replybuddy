// src/components/chat/MessageList.tsx
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { Message } from "./types";
import { TypingDots } from "./TypingDots";
import * as React from "react";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  isTyping,
  chatContainerRef,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-hidden pb-6">
      <div
        ref={chatContainerRef}
        className="h-full overflow-y-auto px-6 space-y-4 scroll-smooth"
        style={{ maxHeight: "calc(100vh - 200px)" }} // Adjust as needed
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              message.role === "user"
                ? "bg-violet-50 dark:bg-violet-900/20 ml-auto max-w-[80%]" // User messages to the right
                : "bg-neutral-100 dark:bg-white/[0.03] mr-auto max-w-[80%]" // AI messages to the left
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === "user"
                  ? "bg-violet-100 dark:bg-violet-700/30 text-violet-600 dark:text-violet-300 order-2" // Avatar on right for user
                  : "bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/90 order-1" // Avatar on left for AI
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={cn(
                "text-sm order-1 whitespace-pre-wrap",
                message.role === "user" ? "order-1" : "order-2"
              )}
            >
              {message.message}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            className="flex items-start gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-white/[0.03] mr-auto max-w-[80%]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/90">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-sm flex items-center h-full">
              <TypingDots />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
