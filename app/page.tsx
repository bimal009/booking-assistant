"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Send, Loader2 } from "lucide-react";
import { main } from "@/lib/gorq";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const suggestions = [
  "Show available rooms",
  "I want to book a room",
  "What are your prices?",
];

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello! 👋 I'm your Booking Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const reply = await main(msg);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <div className="w-full max-w-md flex flex-col rounded-xl border bg-background shadow-lg overflow-hidden h-[700px]">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <div className="relative">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <CalendarDays className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          <div>
            <p className="text-sm font-semibold">Booking Assistance</p>
            <p className="text-xs text-muted-foreground">Online · Always available</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</span>
              <Separator className="flex-1" />
            </div>

            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <CalendarDays className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[75%] whitespace-pre-wrap ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {isUser && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-end gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <CalendarDays className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pt-2 pb-1 border-t">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <Badge key={s} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => send(s)}>
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Input */}
        <div className="px-3 py-3 flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-lg border bg-muted/30 px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Type a message…"
              disabled={loading}
              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            />
          </div>
          <Button
            size="icon"
            className="h-9 w-9 rounded-lg shrink-0"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

      </div>
    </div>
  );
}