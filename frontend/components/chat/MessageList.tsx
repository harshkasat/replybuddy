// src/components/chat/MessageList.tsx
"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming you have this utility
import { User, Bot } from "lucide-react";
import { Message } from "./types";
import { TypingDots } from "./TypingDots";
import * as React from "react";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  // chatContainerRef removed from props
}

export function MessageList({
  messages,
  isTyping,
}: MessageListProps) {
  // The parent div in AnimatedAIChat.tsx is now the scroll container
  return (
    <div className="space-y-4"> {/* Removed px-6 and pb-6, handled by parent */}
      {messages.map((message) => (
        <motion.div
          key={message.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg w-fit", // Added w-fit to prevent full width
            message.role === "user"
              ? "bg-violet-50 dark:bg-violet-900/20 ml-auto max-w-[80%]"
              : "bg-neutral-100 dark:bg-white/[0.03] mr-auto max-w-[80%]"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.role === "user"
                ? "bg-violet-100 dark:bg-violet-700/30 text-violet-600 dark:text-violet-300 order-2"
                : "bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/90 order-1"
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
              "text-sm whitespace-pre-wrap", // Removed order-1, order-2 as parent flex handles alignment
              message.role === "user" ? "order-1" : "order-2" // Keep for internal text order if avatar moves
            )}
          >
            {message.message}
          </div>
        </motion.div>
      ))}
      {isTyping && (
        <motion.div
          className="flex items-start gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-white/[0.03] mr-auto max-w-[80%] w-fit"
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
  );
}