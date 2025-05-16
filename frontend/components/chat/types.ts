// src/components/chat/types.ts
import * as React from "react";

export interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
}

export interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

export interface CustomTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}
