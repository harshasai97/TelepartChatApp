import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Users } from "lucide-react";
import {
  TelepartyClient,
  SocketMessageTypes,
  SocketMessage,
} from "teleparty-websocket-lib";
import toast from "react-hot-toast";

interface ChatRoomProps {
  client: TelepartyClient;
  roomId: string;
  nickname: string;
  onDisconnect: () => void;
  messages: ChatMessage[];
  usersTyping: string[];
}

interface ChatMessage {
  isSystemMessage: boolean;
  userIcon?: string;
  userNickname?: string;
  body: string;
  permId: string;
  timestamp: number;
  messageId?: string;
}

const DEFAULT_ICONS = [
  "https://api.multiavatar.com/johndoe.svg",
  "https://api.multiavatar.com/Starcrasher.png",
  "https://api.multiavatar.com/BinxBond.png",
];

export const ChatRoom: React.FC<ChatRoomProps> = ({
  client,
  roomId,
  nickname,
  onDisconnect,
  messages,
  usersTyping,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    try {
      client.sendMessage(SocketMessageTypes.SEND_MESSAGE, {
        body: newMessage,
        timestamp: Date.now(),
      });
      setNewMessage("");
      setIsTyping(false);
      client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
        typing: false,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  }, [client, newMessage]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      try {
        client.sendMessage(SocketMessageTypes.SET_TYPING_PRESENCE, {
          typing: true,
        });
      } catch (error) {
        console.error("Failed to send typing status:", error);
      }
    }
  }, [client, isTyping]);

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex items-center justify-between bg-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Chat Room: {roomId}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span className="text-sm">{nickname}</span>
          <button
            onClick={onDisconnect}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.messageId || index}
            className={`flex ${
              msg.userNickname === nickname ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.isSystemMessage
                  ? "bg-gray-200 text-gray-600"
                  : msg.userNickname === nickname
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {!msg.isSystemMessage && (
                <div className="flex items-center gap-2 mb-2">
                  {msg.userIcon && (
                    <img
                      src={msg.userIcon}
                      alt={msg.userNickname || "User"}
                      className="w-8 h-8 rounded-full object-cover border border-white"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_ICONS[0];
                      }}
                    />
                  )}
                  {msg.userNickname && (
                    <div
                      className={`text-sm font-medium ${
                        msg.userNickname === nickname
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {msg.userNickname}
                    </div>
                  )}
                </div>
              )}
              <p className="break-words">{msg.body}</p>
              <div
                className={`text-xs mt-1 ${
                  msg.userNickname === nickname
                    ? "text-white/70"
                    : "text-gray-500"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {usersTyping.length > 0 && usersTyping[0] !== nickname && (
          <div className="text-gray-500 text-sm italic">
            {usersTyping.join(", ")} {usersTyping.length === 1 ? "is" : "are"}{" "}
            typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              handleTyping();
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
