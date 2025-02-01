import React, { useState, useEffect, useRef } from "react";
import {
  TelepartyClient,
  SocketEventHandler,
  SocketMessage,
  SocketMessageTypes,
  MessageList,
} from "teleparty-websocket-lib";
import { Toaster } from "react-hot-toast";
import { MessageSquarePlus, LogIn, User, Upload, X } from "lucide-react";
import { ChatRoom } from "./components/ChatRoom";
import toast from "react-hot-toast";

const DEFAULT_ICONS = [
  "https://api.multiavatar.com/johndoe.svg",
  "https://api.multiavatar.com/Starcrasher.png",
  "https://api.multiavatar.com/BinxBond.png",
];

interface ChatMessage {
  isSystemMessage: boolean;
  userIcon?: string;
  userNickname?: string;
  body: string;
  permId: string;
  timestamp: number;
  messageId?: string;
}

function App() {
  const [client, setClient] = useState<TelepartyClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICONS[0]);
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const setupClient = () => {
      const handler: SocketEventHandler = {
        onMessage: (message: SocketMessage) => {
          console.log("App.tsx received message:", message);
          if (message.type === SocketMessageTypes.SEND_MESSAGE) {
            const chatMessage = message.data as ChatMessage;
            setMessages((prev) => [...prev, chatMessage]);
          } else if (message.type === SocketMessageTypes.SET_TYPING_PRESENCE) {
            const typingData = message.data as {
              anyoneTyping: boolean;
              usersTyping: string[];
            };
            setUsersTyping(typingData.usersTyping);
          }
        },
        onClose: () => {
          setIsConnected(false);
          toast.error("Connection lost. Please reload the page.");
        },
        onError: (error: Error) => {
          console.error("Socket error:", error);
          toast.error(`Error: ${error.message}`);
        },
        onConnectionReady: () => {
          setIsConnected(true);
          toast.success("Connected to server");
        },
      };

      const newClient = new TelepartyClient(handler);
      setClient(newClient);
      return newClient;
    };

    const newClient = setupClient();

    return () => {
      if (newClient) {
        // newClient.disconnect();
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!client || !nickname) return;
    try {
      const response = await client.createChatRoom(nickname, selectedIcon);
      setRoomId(response);
      setMessages([]);
      setHasJoinedRoom(true);
      toast.success("Room created successfully!");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!client || !roomId || !nickname) return;
    try {
      const messageList = await client.joinChatRoom(
        nickname,
        roomId,
        selectedIcon
      );
      console.log("Joined room with message list:", messageList);

      if (messageList && Array.isArray(messageList.messages)) {
        setMessages(messageList.messages);
      } else {
        setMessages([]);
      }
      setHasJoinedRoom(true);
      toast.success("Joined room successfully!");
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
      setRoomId("");
      return;
    }
  };

  const handleDisconnect = () => {
    // if (client) {
    //   client.disconnect();
    //   setupClient();
    // }
    setRoomId("");
    setNickname("");
    setMessages([]);
    setUsersTyping([]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedIcon(result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetToDefaultIcon = () => {
    setSelectedIcon(DEFAULT_ICONS[0]);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Connecting to server...</div>
      </div>
    );
  }

  if (hasJoinedRoom && client) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <ChatRoom
          client={client}
          roomId={roomId}
          nickname={nickname}
          onDisconnect={handleDisconnect}
          messages={messages}
          usersTyping={usersTyping}
        />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome to Chat App
        </h1>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Choose your avatar
            </label>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="relative group">
                <img
                  src={selectedIcon}
                  alt="Selected avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600"
                />
                <button
                  onClick={resetToDefaultIcon}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Reset to default"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={triggerFileInput}
                className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-indigo-500 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-500" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setJoinMode("create")}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg ${
                joinMode === "create"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <MessageSquarePlus className="w-5 h-5" />
              Create Room
            </button>
            <button
              onClick={() => setJoinMode("join")}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg ${
                joinMode === "join"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <LogIn className="w-5 h-5" />
              Join Room
            </button>
          </div>

          {joinMode === "join" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            onClick={joinMode === "create" ? handleCreateRoom : handleJoinRoom}
            disabled={!nickname || (joinMode === "join" && !roomId)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            {joinMode === "create" ? "Create New Room" : "Join Room"}
          </button>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
