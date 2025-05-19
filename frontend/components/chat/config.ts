// src/components/chat/config.ts
import { Briefcase, Mail, Sparkles, Search } from "lucide-react";
import { CommandSuggestion } from "./types";
import * as React from "react";

export const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const commandSuggestionsData: CommandSuggestion[] = [
  {
    icon: React.createElement(Mail, { className: "w-4 h-4" }),
    label: "Cold Email",
    description: "Generate Cold Email",
    prefix: "/email",
  },
  {
    icon: React.createElement(Briefcase, { className: "w-4 h-4" }),
    label: "Upwork Proposal",
    description: "Generate a Upwork Proposal",
    prefix: "/upwork",
  },
  {
    icon: React.createElement(Sparkles, { className: "w-4 h-4" }),
    label: "Message",
    description: "Improve Message Response",
    prefix: "/message",
  },
  {
    icon:  React.createElement(Search, {className: "w-4 h-4"}),
    label: "Search",
    description: "Find Email Website",
    prefix: "/search-email"
  }
];

export const generateConversationId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// It's good practice to put CSS keyframes in a CSS file if possible.
// If you must do it via JS, this is one way:
export const rippleKeyframes = `
  @keyframes ripple {
    0% { transform: scale(0.5); opacity: 0.6; }
    100% { transform: scale(2); opacity: 0; }
  }
`;

export const injectGlobalStyles = () => {
  if (typeof document !== "undefined") {
    const existingStyle = document.getElementById("chat-global-styles");
    if (!existingStyle) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "chat-global-styles";
      styleSheet.type = "text/css";
      styleSheet.innerText = rippleKeyframes;
      document.head.appendChild(styleSheet);
    }
  }
};
