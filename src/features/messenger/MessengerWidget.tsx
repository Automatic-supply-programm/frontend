import { useState, useEffect, useRef } from 'react';
import { Badge, Input, Avatar, Typography, Spin, Button, theme } from 'antd';
import { SendOutlined, SearchOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  closeMessenger,
  setActiveUser,
  setConversation,
  clearUnreadFromSender,
  setPosition,
  setSize,
  type MessageItem,
} from './messengerSlice';
import { useGetConversationQuery, useMarkAsReadMutation } from './messengerApi';
import { useGetUsersDirectoryQuery } from '../users/usersApi';
import { ROLE_LABELS } from '../../utils/statusLabels';

interface Props {
  collapsed: boolean;
  sendMessage: (receiverId: string, content: string) => void;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 700;

export default function MessengerWidget({ collapsed, sendMessage }: Props) {
  const dispatch = useDispatch();
  const { token: designToken } = theme.useToken();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const { activeUserId, conversations, unreadBySender, position, size } = useSelector(
    (s: RootState) => s.messenger,
  );

  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);

  const { data: users = [], isLoading: usersLoading } = useGetUsersDirectoryQuery();
  const { currentData: history } = useGetConversationQuery(activeUserId ?? '', {
    skip: !activeUserId,
  });
  const [markAsRead] = useMarkAsReadMutation();

  const activeUser = users.find((u) => u.id === activeUserId);
  const messages: MessageItem[] = conversations[activeUserId ?? ''] ?? [];

  const siderWidth = collapsed ? 80 : 220;
  const defaultPos = {
    x: siderWidth + 8,
    y: Math.max(0, window.innerHeight - size.height - 8),
  };
  const pos = position ?? defaultPos;

  useEffect(() => {
    if (!position) dispatch(setPosition(defaultPos));
  }, []);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (isDragging.current || isResizing.current) return;
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        dispatch(closeMessenger());
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [dispatch]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeMessenger());
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (history && activeUserId) {
      dispatch(setConversation({ userId: activeUserId, messages: history }));
    }
  }, [history, activeUserId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (activeUserId) {
      dispatch(clearUnreadFromSender(activeUserId));
      markAsRead(activeUserId);
    }
  }, [activeUserId, dispatch, markAsRead]);

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDragging.current = true;

    const startMouseX = e.clientX - pos.x;
    const startMouseY = e.clientY - pos.y;

    const onMove = (ev: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - size.width, ev.clientX - startMouseX));
      const newY = Math.max(0, Math.min(window.innerHeight - size.height, ev.clientY - startMouseY));
      dispatch(setPosition({ x: newX, y: newY }));
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + (ev.clientX - startMouseX)));
      const newH = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + (ev.clientY - startMouseY)));
      dispatch(setSize({ width: newW, height: newH }));
    };

    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      u.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSend = () => {
    if (!activeUserId || !inputText.trim()) return;
    sendMessage(activeUserId, inputText.trim());
    setInputText('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (createdAt: string) => {
    const d = dayjs(createdAt);
    return d.isSame(dayjs(), 'day') ? d.format('HH:mm') : d.format('DD.MM HH:mm');
  };

  const getInitials = (fullName: string) =>
    fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: size.width,
        height: size.height,
        zIndex: 1000,
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        background: designToken.colorBgContainer,
        border: `1px solid ${designToken.colorBorderSecondary}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: 48,
          borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
          flexShrink: 0,
          cursor: 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeUserId && (
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => dispatch(setActiveUser(null))}
            />
          )}
          <Typography.Text strong style={{ fontSize: 14 }}>
            {activeUser ? activeUser.fullName : 'Мессенджер'}
          </Typography.Text>
          {activeUser && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {ROLE_LABELS[activeUser.role]}
            </Typography.Text>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={() => dispatch(closeMessenger())}
        />
      </div>

      {!activeUserId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', flexShrink: 0 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск пользователя..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {usersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: designToken.colorTextSecondary,
                  fontSize: 13,
                }}
              >
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map((user) => {
                const unread = unreadBySender[user.id] ?? 0;
                return (
                  <div
                    key={user.id}
                    onClick={() => dispatch(setActiveUser(user.id))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = designToken.colorBgTextHover)
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Badge count={unread} size="small" offset={[-2, 2]}>
                      <Avatar
                        style={{ backgroundColor: designToken.colorPrimary, flexShrink: 0 }}
                      >
                        {getInitials(user.fullName)}
                      </Avatar>
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
                        {user.fullName}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {ROLE_LABELS[user.role]}
                      </Typography.Text>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeUserId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: designToken.colorTextSecondary,
                  fontSize: 13,
                }}
              >
                Начните диалог
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '8px 12px',
                        borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        background: isMine
                          ? designToken.colorPrimary
                          : designToken.colorFillSecondary,
                        color: isMine ? '#fff' : designToken.colorText,
                      }}
                    >
                      <div style={{ fontSize: 13, wordBreak: 'break-word', lineHeight: 1.5 }}>
                        {msg.content}
                      </div>
                      <div
                        style={{ fontSize: 10, marginTop: 3, opacity: 0.65, textAlign: 'right' }}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: '8px 12px',
              borderTop: `1px solid ${designToken.colorBorderSecondary}`,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            <Input.TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Введите сообщение... (Enter — отправить)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ resize: 'none', flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputText.trim()}
            />
          </div>
        </div>
      )}

      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 18,
          height: 18,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '0 3px 3px 0',
          zIndex: 1,
        }}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <circle cx="7.5" cy="7.5" r="1" fill={designToken.colorTextQuaternary} />
          <circle cx="4.5" cy="7.5" r="1" fill={designToken.colorTextQuaternary} />
          <circle cx="7.5" cy="4.5" r="1" fill={designToken.colorTextQuaternary} />
        </svg>
      </div>
    </div>
  );
}
