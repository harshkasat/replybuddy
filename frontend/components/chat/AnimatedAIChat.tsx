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
  // const [recentCommand, setRecentCommand] = useState<string | null>(null); // Kept if needed for other UI feedback
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [conversationId] = useState<string>(generateConversationId());

  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60, // Default, can be overridden by ChatInput prop
    maxHeight: 200,
  });

  const commandSuggestions: CommandSuggestionType[] = commandSuggestionsData;

  // Inject global styles (e.g., for ripple)
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]); // also on isTyping for the typing indicator

  // Command palette visibility based on input
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

  // Mouse move for background effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Click outside command palette
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCommandSuggestion = (index: number) => {
    if (index < 0 || index >= commandSuggestions.length) return;
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + " ");
    setShowCommandPalette(false);
    // setRecentCommand(selectedCommand.label);
    // setTimeout(() => setRecentCommand(null), 2000); // Or 3500
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
      if (command.prefix === "/email") apiUrl = `${BASE_URL}/generate_email`;
      else if (command.prefix === "/upwork")
        apiUrl = `${BASE_URL}/generate_upwork`;
      else if (command.prefix === "/message")
        apiUrl = `${BASE_URL}/generate_message`;
    } else if (trimmedValue.startsWith("/")) {
      // Command typed but not matched or no space after
      // Check if it matches a prefix without space, to guide user or handle
      const simpleCmdMatch = commandSuggestions.find(
        (cmd) => cmd.prefix === trimmedValue
      );
      if (simpleCmdMatch) {
        setIsTyping(false); // Don't send to backend, maybe show help
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
      // No specific API command matched or not a command
      // Default handling if you want to send all non-command messages to a general endpoint
      // Or, as before, give a canned response if not sending to backend:
      setTimeout(() => {
        setIsTyping(false);
        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          conversation_id: conversationId,
          role: "assistant",
          message: "Thanks for your message! How can I help?", // Generic response
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 1000);
      return;
    }

    try {
      const response = await axios.post(
        apiUrl,
        { company_info: messageToSend },
        { headers: { "Content-Type": "application/json" } }
      );
      setIsTyping(false);
      let aiMsgText = "Sorry, I received an unexpected response.";
      if (response.data?.data?.response?.message) {
        aiMsgText = response.data.data.response.message;
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
    if (!showCommandPalette) textareaRef.current?.focus(); // Focus input if opening palette
  };

  return (
    <div className="min-h-screen flex flex-col w-full items-center justify-center bg-gray-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 p-6 relative overflow-hidden">
      {/* Background decorative blurbs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      {!chatStarted ? (
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
      ) : (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-screen"> 
          <motion.div
            className="relative z-10 flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4"> {/* flex-1 and overflow-y-auto for scrolling messages */}
              <MessageList
                messages={messages}
                isTyping={isTyping}
                chatContainerRef={chatContainerRef}
              // chatContainerRef is now on this div
              />
            </div>
            <div className="p-4">
              {" "}
              {/* Input area wrapper for chat view */}
              <AnimatePresence>
                {showCommandPalette && (
                  <CommandPalette
                    suggestions={commandSuggestions}
                    activeSuggestion={activeSuggestion}
                    onSelectSuggestion={handleSelectCommandSuggestion}
                    commandPaletteRef={commandPaletteRef}
                    className="bottom-[calc(4rem+1.5rem)]" // Position above chat input (adjust based on actual input height)
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

      {/* Mouse Follow Gradient Effect */}
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
