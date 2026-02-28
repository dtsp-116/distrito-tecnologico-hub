"use client";

import { useEffect, useRef, useState } from "react";
import { MensagemChat } from "@/types";

interface UseChatOptions {
  initialMessages?: MensagemChat[];
  botName?: string;
  noticeId?: string;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<MensagemChat[]>(options?.initialMessages ?? []);
  const [isReplying, setIsReplying] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<MensagemChat[]>(options?.initialMessages ?? []);

  const toRole = (usuario: string): "user" | "assistant" => {
    const nome = usuario.toLowerCase();
    if (
      nome.includes("assistente") ||
      nome.includes("especialista") ||
      nome.includes("hub assistente")
    ) {
      return "assistant";
    }
    return "user";
  };

  const sendMessage = async (text: string, author = "Voce") => {
    const content = text.trim();
    if (!content) return;

    const now = new Date();
    const horario = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const userMessage: MensagemChat = {
      id: crypto.randomUUID(),
      usuario: author,
      conteudo: content,
      horario
    };

    const conversationSnapshot = [...messagesRef.current, userMessage];

    setMessages(conversationSnapshot);
    messagesRef.current = conversationSnapshot;

    setIsReplying(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: options?.botName,
          noticeId: options?.noticeId,
          messages: conversationSnapshot.map((message) => ({
            role: toRole(message.usuario),
            content: message.conteudo
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Falha na requisicao.");
      }

      const data = (await response.json()) as { content?: string };
      const botText = data.content?.trim();
      if (!botText) {
        throw new Error("Resposta vazia.");
      }

      const responseData = data as { content?: string; sources?: string[] };
      const sources = responseData.sources ?? [];
      const sourcesLabel =
        sources.length > 0
          ? `\n\nFontes consultadas: ${sources.join(", ")}`
          : "";

      const botNow = new Date();
      const botHorario = botNow.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const botMessage: MensagemChat = {
        id: crypto.randomUUID(),
        usuario: options?.botName ?? "Assistente",
        conteudo: `${botText}${sourcesLabel}`,
        horario: botHorario
      };

      const updatedConversation = [...messagesRef.current, botMessage];
      setMessages(updatedConversation);
      messagesRef.current = updatedConversation;
    } catch {
      const fallbackTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const fallbackMessage: MensagemChat = {
        id: crypto.randomUUID(),
        usuario: options?.botName ?? "Assistente",
        conteudo:
          "Nao foi possivel consultar a IA agora. Verifique a configuracao da chave GROQ_API_KEY e tente novamente.",
        horario: fallbackTime
      };
      const updatedConversation = [...messagesRef.current, fallbackMessage];
      setMessages(updatedConversation);
      messagesRef.current = updatedConversation;
    } finally {
      setIsReplying(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, isReplying]);

  return {
    messages,
    isReplying,
    sendMessage,
    containerRef
  };
}
