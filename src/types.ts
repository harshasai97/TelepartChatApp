import { SessionChatMessage } from "teleparty-websocket-lib";

export interface ChatState {
  messages: SessionChatMessage[];
  isConnected: boolean;
  roomId: string | null;
  nickname: string;
  userIcon: string;
  isTyping: boolean;
  usersTyping: string[];
}
