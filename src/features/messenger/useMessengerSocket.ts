import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { addWsMessage, type MessageItem } from './messengerSlice';

export function useMessengerSocket() {
  const token = useSelector((s: RootState) => s.auth.token);
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id);
  const dispatch = useDispatch();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token || !currentUserId) return;

    // В проде VITE_API_BASE_URL = https://xxx.railway.app/api → ws на том же хосте
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
    const wsUrl = `${apiBase}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: { Authorization: `Bearer_${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/messages', (frame) => {
          const msg: MessageItem = JSON.parse(frame.body);
          dispatch(addWsMessage({ currentUserId, message: msg }));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token, currentUserId, dispatch]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: '/app/chat',
        body: JSON.stringify({ receiverId, content }),
      });
    }
  }, []);

  return { sendMessage };
}
