"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import axios from 'axios';
import {
  Briefcase,
  Mail,
  SendIcon,
  User,
  Bot,
  LoaderIcon,
  Sparkles,
  Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing
              ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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

        {props.onChange && (
          <div
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-violet-500 rounded-full"
            style={{
              animation: "none",
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
}

export function AnimatedAIChat() {
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const [conversationId, setConversationId] = useState<string>(() => {
    // Generate a unique conversation ID (you can use a library like uuid)
    return Math.random().toString(36).substring(2, 15);
  });
  const commandSuggestions: CommandSuggestion[] = [
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Cold Email",
      description: "Generate Cold Email",
      prefix: "/email",
    },
    {
      icon: <Briefcase className="w-4 h-4" />,
      label: "Upwork Proposal",
      description: "Generate a Upwork Proposal",
      prefix: "/upwork",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Message",
      description: "Improve Message Response",
      prefix: "/message",
    },
  ];

  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(scrollTimeout);
  }, [messages]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      if (chatContainer.scrollHeight > chatContainer.clientHeight) {
        chatContainer.style.overflowY = 'auto';
      } else {
        chatContainer.style.overflowY = 'hidden';
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  interface Message {
    id: string;
    conversation_id: string;
    role: "user" | "assistant";
    message: string; // Changed 'text' to 'message' to match your format
    timestamp: string;
  }

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);

      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value)
      );

      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex);
      } else {
        setActiveSuggestion(-1);
      }
    } else {
      setShowCommandPalette(false);
    }
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setValue(selectedCommand.prefix + " ");
          setShowCommandPalette(false);

          setRecentCommand(selectedCommand.label);
          setTimeout(() => setRecentCommand(null), 3500);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSendMessage();
      }
    }
  };


  const handleSendMessage = async () => {
    if (value.trim()) {
      // Add user message
      const timestamp = new Date().toISOString();
      const userMessage: Message = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        role: "user",
        message: value.trim(), // Use 'message' here
        timestamp: timestamp,
      };
      setMessages((prev) => [...prev, userMessage]);
      setValue("");
      adjustHeight(true);
      if (!chatStarted) {
        setChatStarted(true);
      }

      setIsTyping(true);
      let apiUrl = "";
      let messageToSend = value.trim();

      if (value.startsWith("/email")) {
        apiUrl = `${BASE_URL}/generate_email`;
        messageToSend = value.substring("/email".length).trim(); // Extract the actual message
      } else if (value.startsWith("/upwork")) {
        apiUrl = `${BASE_URL}/generate_upwork`;
        messageToSend = value.substring("/upwork".length).trim(); // Extract the actual message
      } else if (value.startsWith("/message")) {
        apiUrl = `${BASE_URL}/generate_message`;
        messageToSend = value.substring("/message".length).trim(); // Extract the actual message
      } else {
        // Default AI response for regular messages (without a command)
        setTimeout(() => {
          setIsTyping(false);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            conversation_id: conversationId,
            role: "assistant",
            message: "Thanks for your message! I'm currently not connected to a specific command. How else can I help?",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
        return;
      }

      try {
        const response = await axios.post(
          apiUrl,
          { company_info: messageToSend }, // Or adjust the payload as needed
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'csrftoken=4ai1LBgqJAPHbH0Gy7eRaSS8id2dPabc', // Make sure this cookie is handled correctly
            },
          }
        );

        setIsTyping(false);
        if (response.data && response.data.data && response.data.data.response && response.data.data.response.message) {
          const aiMessage: Message = {
            id: (Date.now() + 2).toString(),
            conversation_id: conversationId,
            role: "assistant",
            message: response.data.data.response.message, // Use 'message' here
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else if (response.data && response.data.error) {
          const aiMessage: Message = {
            id: (Date.now() + 2).toString(),
            conversation_id: conversationId,
            role: "assistant",
            message: `Error: ${response.data.error}`, // Use 'message' here
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        } else {
          const aiMessage: Message = {
            id: (Date.now() + 2).toString(),
            conversation_id: conversationId,
            role: "assistant",
            message: "Sorry, I received an unexpected response from the server.", // Use 'message' here
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error: any) {
        setIsTyping(false);
        console.error("API Error:", error);
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          conversation_id: conversationId,
          role: "assistant",
          message: `Sorry, there was an error communicating with the server: ${error.message}`, // Use 'message' here
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      };
    }
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + " ");
    setShowCommandPalette(false);
    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col w-full items-center justify-center bg-gray-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 p-6 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      {!chatStarted ? (
        // Initial UI - Show before chat starts
        <div className="w-full max-w-2xl mx-auto relative">
          <motion.div
            className="relative z-10 space-y-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
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

            <motion.div
              className={cn(
                "relative backdrop-blur-2xl rounded-2xl shadow-2xl",
                // Light theme styles
                "bg-neutral-50 border border-neutral-200", // Or bg-gray-50, bg-zinc-50. border-neutral-200 for a subtle border.
                // Dark theme styles
                "dark:bg-white/[0.02] dark:border-white/[0.05]"
              )}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div
                    ref={commandPaletteRef}
                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-lg bg-white dark:bg-neutral-900 rounded-lg z-50 shadow-lg border border-neutral-200 dark:border-white/20 overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="py-1 bg-neutral-50 dark:bg-neutral-950">
                      {commandSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                            activeSuggestion === index
                              ? "bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-white"
                              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                          )}
                          onClick={() => selectCommandSuggestion(index)}
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
                )}
              </AnimatePresence>

              <div className="p-4 pt-0">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Ask zap a question..."
                  containerClassName="w-full"
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none",
                    "bg-transparent", // This is fine
                    "border-none", // This is fine
                    "text-neutral-800 dark:text-white/90 text-sm", // Adjusted text color
                    "focus:outline-none",
                    "placeholder:text-neutral-400 dark:placeholder:text-white/30", // Adjusted placeholder
                    "min-h-[60px]"
                  )}
                  style={{
                    overflow: "hidden",
                  }}
                  showRing={false}
                />
              </div>

              <div
                className={cn(
                  "p-4 border-t flex items-center justify-between gap-4",
                  "border-neutral-200", // Or border-gray-200, border-zinc-200. This will be the visible thin line.
                  "dark:border-white/[0.05]"
                )}
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    data-command-button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommandPalette((prev) => !prev);
                    }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white/90 rounded-lg transition-colors relative group",
                      showCommandPalette && "bg-white/10 text-white/90"
                    )}
                  >
                    <Command className="w-4 h-4" />
                    <motion.span
                      className="absolute inset-0 bg-neutral-500/[0.1] dark:bg-white/[0.08] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      layoutId="button-highlight"
                    />
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  onClick={handleSendMessage}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isTyping || !value.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "flex items-center gap-2",
                    value.trim()
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30 dark:bg-white dark:text-[#0A0A0B] dark:shadow-lg dark:shadow-white/10" // Example: Violet for light, white for dark
                      : "bg-neutral-200 text-neutral-400 dark:bg-white/[0.08] dark:text-neutral-500"
                  )}
                >
                  {isTyping ? (
                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  <span>Send</span>
                </motion.button>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {commandSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.prefix}
                  onClick={() => selectCommandSuggestion(index)}
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] rounded-lg text-sm text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all relative group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {suggestion.icon}
                  <span>{suggestion.label}</span>
                  <motion.div
                    className="absolute inset-0 border border-neutral-200 dark:border-white/[0.07] rounded-lg"
                    initial={false}
                    animate={{
                      opacity: [0, 1],
                      scale: [0.98, 1],
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        // Chat UI - Show after chat starts
        <div className="w-full max-w-2xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
          <motion.div
            className="relative z-10 flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-1 overflow-hidden pb-6">
              <div
                ref={chatContainerRef}
                className="h-full overflow-y-auto px-6 space-y-4 scroll-smooth"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      message.role === "user"
                        ? "bg-violet-50 dark:bg-violet-900/20 ml-6"
                        : "bg-neutral-100 dark:bg-white/[0.03] mr-6"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === "user"
                          ? "bg-violet-100 dark:bg-violet-700/30 text-violet-600 dark:text-violet-300"
                          : "bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/90"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.message}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-4">
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div
                    ref={commandPaletteRef}
                    className="absolute left-4 right-4 bottom-24 backdrop-blur-lg bg-white dark:bg-neutral-900 rounded-lg z-50 shadow-lg border border-neutral-200 dark:border-white/20 overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="py-1 bg-neutral-50 dark:bg-neutral-950">
                      {commandSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                            activeSuggestion === index
                              ? "bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-white"
                              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                          )}
                          onClick={() => selectCommandSuggestion(index)}
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
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    data-command-button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommandPalette((prev) => !prev);
                    }}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white/90 rounded-lg transition-colors relative group",
                      showCommandPalette && "bg-white/10 text-white/90"
                    )}
                  >
                    <Command className="w-4 h-4" />
                  </motion.button>
                </div>

                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Ask zap a question..."
                  containerClassName="flex-1"
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none",
                    "bg-white dark:bg-neutral-900",
                    "border border-neutral-200 dark:border-neutral-800",
                    "rounded-lg",
                    "text-neutral-800 dark:text-white/90 text-sm",
                    "focus:outline-none",
                    "placeholder:text-neutral-400 dark:placeholder:text-white/30",
                    "min-h-[60px]"
                  )}
                  style={{
                    overflow: "hidden",
                  }}
                  showRing={false}
                />

                <motion.button
                  type="button"
                  onClick={handleSendMessage}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isTyping || !value.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "flex items-center gap-2",
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
                  <span>Send</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-neutral-600 dark:bg-white/90 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-all relative overflow-hidden group"
    >
      <div className="relative z-10 flex items-center gap-2">
        {icon}
        <span className="text-xs relative z-10">{label}</span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.span
        className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = rippleKeyframes;
  document.head.appendChild(style);
}
