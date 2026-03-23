import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { askChatbot, approveChange, rejectChange, undoChange } from "../../api/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProposedChange } from "../data/types";

type MessageType = {
  text: string;
  isUser?: boolean;
  proposed_changes?: ProposedChange[];
};

export default function ChatbotOverlay() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [canUndo, setCanUndo] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  //Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //Send user message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setMessages((prev) => [...prev, { text: userText, isUser: true }]);
    setInput("");
    setLoading(true);
    setCanUndo(false);

    try {
      const data = await askChatbot(userText, "guest", sessionId);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.proposed_changes && data.proposed_changes.length > 0) setHasPendingChanges(true);
      setMessages((prev) => [
        ...prev,
        { text: data.response, isUser: false, proposed_changes: data.proposed_changes }
      ]);
    } catch {
      setMessages((prev: MessageType[]) => [
        ...prev,
        { text: "ComChat is currently down. Please try again later.", isUser: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: "approve" | "reject") => {
    if (!sessionId || loading) return;
    setLoading(true);

    try {
      // Clear the proposed_changes from the last message in UI so buttons disappear
      setMessages((prev) => {
        const copy = [...prev];
        const lastMsg = { ...copy[copy.length - 1] };
        delete lastMsg.proposed_changes;
        copy[copy.length - 1] = lastMsg;
        return copy;
      });

      const data = actionType === "approve"
        ? await approveChange(sessionId)
        : await rejectChange(sessionId);

      setHasPendingChanges(false);
      if (actionType === "approve") setCanUndo(true);
      if (data.proposed_changes && data.proposed_changes.length > 0) setHasPendingChanges(true);
      setMessages((prev) => [
        ...prev,
        { text: data.response, isUser: false, proposed_changes: data.proposed_changes }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Failed to process the requested action. Please try again.", isUser: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!sessionId || loading) return;
    setCanUndo(false);
    setLoading(true);
    try {
      const data = await undoChange(sessionId);
      setMessages((prev) => [
        ...prev,
        { text: data.response, isUser: false }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Failed to undo the change. Please try again.", isUser: false },
      ]);
    } finally {
      setLoading(false);
    }
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
       <span className="material-icons-outlined text-lime-600">
          chat
        </span>
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
            <Message
              key={idx}
              isUser={msg.isUser}
              proposedChanges={msg.proposed_changes}
              onAction={handleAction}
              isDisabled={loading}
            >
              {msg.text}
            </Message>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Undo last action strip */}
        {canUndo && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
            <span className="text-xs text-amber-700">Last AI change can be undone</span>
            <button
              onClick={handleUndo}
              disabled={loading}
              className={`flex items-center gap-1 text-xs font-medium text-amber-700 border border-amber-400 rounded-full px-3 py-1 bg-white hover:bg-amber-100 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              ↩ Undo last action
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white rounded-b-2xl border-t">
          <input
            type="text"
            placeholder={hasPendingChanges ? "Approve or reject the pending action first..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={hasPendingChanges || loading}
            className={`w-full px-4 py-3 bg-slate-100 rounded-full text-sm placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#0062FF]
              ${hasPendingChanges ? "opacity-50 cursor-not-allowed" : ""}`}
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
  proposedChanges,
  onAction,
  isDisabled,
}: {
  children: React.ReactNode;
  isUser?: boolean;
  proposedChanges?: ProposedChange[];
  onAction?: (type: "approve" | "reject") => void;
  isDisabled?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`text-sm rounded-2xl px-4 py-3 max-w-[85%] ${isUser
            ? "bg-[#0062FF] text-white"
            : "bg-white text-slate-700 shadow-sm border border-slate-100"
          }`}
      >
        {isUser ? children : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{children as string}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Confirmation Card if Proposed Changes Exist */}
      {proposedChanges && proposedChanges.length > 0 && (
        <div className="max-w-[85%] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mt-1">
          <div className="px-4 py-3 border-b border-slate-100">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">Pending Actions:</h4>
            <div className="space-y-2">
              {proposedChanges.map((change) => (
                <div key={change.id} className="bg-slate-50 p-2 rounded text-xs text-slate-600 font-mono">
                  <span className="font-bold text-slate-700">{change.description}</span>
                  <br className="my-1" />
                  {JSON.stringify(change.data, null, 2)}
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 flex justify-end gap-3 items-center">
            <button
              onClick={() => onAction?.("reject")}
              disabled={isDisabled}
              className={`border border-red-600 text-red-600 rounded px-3 py-1 bg-transparent transition-colors ${!isDisabled && "hover:bg-red-50 hover:text-red-700"} ${isDisabled && "opacity-50 cursor-not-allowed"}`}
            >
              Reject
            </button>
            <button
              onClick={() => onAction?.("approve")}
              disabled={isDisabled}
              className={`bg-blue-600 text-white rounded px-3 py-1 ${!isDisabled && "hover:bg-blue-700 active:bg-blue-800"} ${isDisabled && "opacity-50 cursor-not-allowed"}`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
