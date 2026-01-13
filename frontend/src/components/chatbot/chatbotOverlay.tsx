import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";

type MessageType = {
  text: string;
  isUser?: boolean;
};

export default function ChatbotOverlay() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  //Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Send user message
  const handleSend = () => {
    if (!input.trim()) return;

    //Add user message
    setMessages((prev) => [...prev, { text: input, isUser: true }]);
    setInput("");

    //After timeout, show bot message
    setTimeout(() => {

      const botMessage: MessageType = {
        text: "ComChat is currently down. Please try again later.",
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 2500);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Open Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-2 right-4 z-[9999] w-12 h-12 rounded-full bg-[#E4F2D6] flex items-center justify-center shadow-lg transition-transform duration-300 ease-in-out
          ${open ? "scale-0 pointer-events-none" : "scale-100"}`}
      >
      </button>

      {/* Chat Overlay */}
      <div
        className={`fixed top-4 right-4 z-[9999] w-[360px] h-[560px] bg-[#F3F4F6] rounded-2xl shadow-xl border flex flex-col transform transition-all duration-300 ease-in-out
          ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-2xl border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ComChat</span>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <Message key={idx} isUser={msg.isUser}>
              {msg.text}
            </Message>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white rounded-b-2xl border-t">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-slate-100 rounded-full text-sm placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
          />
        </div>
      </div>
    </>
  );
}

// Message Component
function Message({
  children,
  isUser = false,
}: {
  children: React.ReactNode;
  isUser?: boolean;
}) {
  return (
    <div
      className={`text-sm rounded-2xl px-4 py-3 max-w-[85%] ${
        isUser
          ? "bg-[#0062FF] text-white ml-auto"
          : "bg-white text-slate-400"
      }`}
    >
      {children}
    </div>
  );
}
