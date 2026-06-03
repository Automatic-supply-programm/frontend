import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface MessengerState {
  isOpen: boolean;
  activeUserId: string | null;
  conversations: Record<string, MessageItem[]>;
  unreadTotal: number;
  unreadBySender: Record<string, number>;
  position: { x: number; y: number } | null;
  size: { width: number; height: number };
}

const initialState: MessengerState = {
  isOpen: false,
  activeUserId: null,
  conversations: {},
  unreadTotal: 0,
  unreadBySender: {},
  position: null,
  size: { width: 400, height: 480 },
};

const messengerSlice = createSlice({
  name: 'messenger',
  initialState,
  reducers: {
    toggleMessenger(state) {
      state.isOpen = !state.isOpen;
    },
    closeMessenger(state) {
      state.isOpen = false;
    },
    setActiveUser(state, action: PayloadAction<string | null>) {
      state.activeUserId = action.payload;
    },
    setConversation(state, action: PayloadAction<{ userId: string; messages: MessageItem[] }>) {
      const { userId, messages } = action.payload;
      const existing = state.conversations[userId] ?? [];
      const merged = [...messages];
      existing.forEach((m) => {
        if (!merged.find((x) => x.id === m.id)) merged.push(m);
      });
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      state.conversations[userId] = merged;
    },
    addWsMessage(
      state,
      action: PayloadAction<{ currentUserId: string; message: MessageItem }>,
    ) {
      const { currentUserId, message } = action.payload;
      const otherUserId =
        message.senderId === currentUserId ? message.receiverId : message.senderId;

      const existing = state.conversations[otherUserId] ?? [];
      if (!existing.find((m) => m.id === message.id)) {
        state.conversations[otherUserId] = [...existing, message];
      }

      if (message.senderId !== currentUserId && otherUserId !== state.activeUserId) {
        state.unreadTotal += 1;
        state.unreadBySender[message.senderId] =
          (state.unreadBySender[message.senderId] ?? 0) + 1;
      }
    },
    setUnreadCounts(
      state,
      action: PayloadAction<{ total: number; bySender: Record<string, number> }>,
    ) {
      state.unreadTotal = action.payload.total;
      state.unreadBySender = action.payload.bySender;
    },
    clearUnreadFromSender(state, action: PayloadAction<string>) {
      const senderId = action.payload;
      const count = state.unreadBySender[senderId] ?? 0;
      state.unreadTotal = Math.max(0, state.unreadTotal - count);
      delete state.unreadBySender[senderId];
    },
    setPosition(state, action: PayloadAction<{ x: number; y: number }>) {
      state.position = action.payload;
    },
    setSize(state, action: PayloadAction<{ width: number; height: number }>) {
      state.size = action.payload;
    },
    resetMessenger() {
      return initialState;
    },
  },
});

export const {
  toggleMessenger,
  closeMessenger,
  setActiveUser,
  setConversation,
  addWsMessage,
  setUnreadCounts,
  clearUnreadFromSender,
  setPosition,
  setSize,
  resetMessenger,
} = messengerSlice.actions;

export default messengerSlice.reducer;
