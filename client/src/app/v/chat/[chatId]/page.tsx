"use client";

import { useParams } from "next/navigation";
import ChatLayout from "@/components/chat/chatLayout";

export default function ChatDetailPage() {
  const { chatId } = useParams();
  return <ChatLayout initialChatId={chatId as string} />;
}