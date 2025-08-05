// src/components/chat/AnimatedAIChat.tsx
"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAutoResizeTextarea } from "./hooks/useAutoResizeTextarea";
import {
  Message as MessageType,
  CommandSuggestion as CommandSuggestionType,
} from "./types";
import {
  BASE_URL,
  commandSuggestionsData,
  generateConversationId,
  injectGlobalStyles,
} from "./config";

import { InitialScreen } from "./InitialScreen";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { CommandPalette } from "./CommandPalette";
import * as React from "react";

export function AnimatedAIChat() {
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [conversationId] = useState<string>(generateConversationId());

  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // For scrolling to bottom of messages
  const chatInputContainerRef = useRef<HTMLDivElement>(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const commandSuggestions: CommandSuggestionType[] = commandSuggestionsData;

  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // Scroll to bottom of the message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);
      const matchingIdx = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value)
      );
      setActiveSuggestion(matchingIdx >= 0 ? matchingIdx : -1);
    } else {
      setShowCommandPalette(false);
    }
  }, [value, commandSuggestions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");
      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target) &&
        textareaRef.current && !textareaRef.current.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCommandSuggestion = (index: number) => {
    if (index < 0 || index >= commandSuggestions.length) return;
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + " ");
    setShowCommandPalette(false);
    textareaRef.current?.focus();
    adjustHeight();
  };

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
          handleSelectCommandSuggestion(activeSuggestion);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      conversation_id: conversationId,
      role: "user",
      message: trimmedValue,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    adjustHeight(true);
    if (!chatStarted) setChatStarted(true);
    setIsTyping(true);

    let apiUrl = "";
    let messageToSend = trimmedValue;

    const command = commandSuggestions.find((cmd) =>
      trimmedValue.startsWith(cmd.prefix + " ")
    );
    if (command) {
      messageToSend = trimmedValue.substring(command.prefix.length).trim();
      if (command.prefix === "/email")
        apiUrl = `${BASE_URL}/generate_email`;
      else if (command.prefix === "/upwork")
        apiUrl = `${BASE_URL}/generate_upwork`;
      else if (command.prefix === "/message")
        apiUrl = `${BASE_URL}/generate_message`;
      else if (command.prefix === '/search-email')
        apiUrl = `${BASE_URL}/search_email`;
    } else if (trimmedValue.startsWith("/")) {
      const simpleCmdMatch = commandSuggestions.find(
        (cmd) => cmd.prefix === trimmedValue
      );
      if (simpleCmdMatch) {
        setIsTyping(false);
        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          conversation_id: conversationId,
          role: "assistant",
          message: `Please provide details for the ${simpleCmdMatch.label} command. Type '${simpleCmdMatch.prefix} your details'.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }
    }

    if (!apiUrl) {
      apiUrl = `${BASE_URL}/query`;
      messageToSend = trimmedValue;
    }

    try {
      const response = await axios.post(
        apiUrl,
        { company_info: messageToSend },
        { headers: { "Content-Type": "application/json" } }
      );
      setIsTyping(false);
      let aiMsgText = "Sorry, I received an unexpected response.";
      if (response.data && response.data.data) {
        aiMsgText = response.data.data;
      } else if (response.data?.error) {
        aiMsgText = `Error: ${response.data.error}`;
      }
      const aiMessage: MessageType = {
        id: (Date.now() + 2).toString(),
        conversation_id: conversationId,
        role: "assistant",
        message: aiMsgText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      setIsTyping(false);
      console.error("API Error:", error);
      const aiMessage: MessageType = {
        id: (Date.now() + 2).toString(),
        conversation_id: conversationId,
        role: "assistant",
        message: `Sorry, there was an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  const handleToggleCommandPalette = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setShowCommandPalette((prev) => !prev);
    if (!showCommandPalette) textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 relative overflow-y-auto">
      {/* Background decorative blurbs - ensure these don't interfere with layout if position fixed/absolute */}
      <div className="absolute inset-0 w-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      {!chatStarted ? (
         <div className="flex-1 flex items-center justify-center p-6 relative">
            <InitialScreen
                inputValue={value}
                onInputValueChange={setValue}
                onSendMessage={handleSendMessage}
                onKeyDown={handleKeyDown}
                onInputFocus={() => setInputFocused(true)}
                onInputBlur={() => setInputFocused(false)}
                isTyping={isTyping}
                showCommandPalette={showCommandPalette}
                activeSuggestion={activeSuggestion}
                commandSuggestions={commandSuggestions}
                onSelectCommandSuggestion={handleSelectCommandSuggestion}
                onToggleCommandPalette={handleToggleCommandPalette}
                commandPaletteRef={commandPaletteRef}
                textareaRef={textareaRef}
                adjustTextareaHeight={adjustHeight}
            />
        </div>
      ) : (
        // Main chat view: Takes full width and constrained height
        <div className="flex flex-col h-full items-center"> {/* Use h-full to take parent's height */}
          <motion.div
            className="flex flex-col flex-1 relative z-10 w-full max-w-5xl" // Added flex-1 here to grow and fill
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Message List Area - This will scroll */}
            <div className="flex-1 overflow-y-auto p-6"> {/* Add padding here for messages */}
              <MessageList
                messages={messages}
                isTyping={isTyping}
                // chatContainerRef is removed as MessageList's root is now the scrollable container
              />
              <div ref={messagesEndRef} /> {/* Element to scroll to */}
            </div>

            {/* Input Area - Stays at the bottom */}
            <div ref={chatInputContainerRef} className="p-4 border-t border-neutral-200 dark:border-neutral-800 relative bg-gray-50 dark:bg-neutral-950"> {/* Added background to match */}
              <AnimatePresence>
                {showCommandPalette && (
                  <CommandPalette
                    suggestions={commandSuggestions}
                    activeSuggestion={activeSuggestion}
                    onSelectSuggestion={handleSelectCommandSuggestion}
                    commandPaletteRef={commandPaletteRef}
                    className="absolute bottom-full left-4 right-4 mb-2 z-20" // Ensure z-index is higher if needed
                  />
                )}
              </AnimatePresence>
              <ChatInput
                value={value}
                onValueChange={setValue}
                onSendMessage={handleSendMessage}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                isTyping={isTyping}
                showCommandPalette={showCommandPalette}
                onToggleCommandPalette={handleToggleCommandPalette}
                textareaRef={textareaRef}
                adjustTextareaHeight={adjustHeight}
                placeholder="Ask something..."
                showTextareaRing={true}
                isChatView={true}
              />
            </div>
          </motion.div>
        </div>
      )}

      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none -z-10 opacity-[0.02] dark:opacity-[0.03] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{ x: mousePosition.x - 400, y: mousePosition.y - 400 }}
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