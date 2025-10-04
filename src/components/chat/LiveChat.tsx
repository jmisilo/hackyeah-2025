'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Info, CheckCircle, MessageCircle } from 'lucide-react';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success' | 'chat';
  routeId?: string;
  location?: {
    lat: number;
    lng: number;
    stopName?: string;
  };
}

interface LiveChatProps {
  routeId: string;
  isActive: boolean;
  onSendMessage?: (message: string, type: ChatMessage['type']) => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ routeId, isActive, onSendMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<ChatMessage['type']>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'Anna K.',
        message: 'Tramwaj linia 3 ma 5 minut opóźnienia na Rondzie Mogilskim',
        timestamp: new Date(Date.now() - 300000),
        type: 'warning',
        routeId,
        location: { lat: 50.0775, lng: 19.9289, stopName: 'Rondo Mogilskie' }
      },
      {
        id: '2',
        userId: 'user2',
        username: 'Marcin P.',
        message: 'Wszystko OK na Dworcu Głównym, tramwaje jadą punktualnie',
        timestamp: new Date(Date.now() - 180000),
        type: 'success',
        routeId,
        location: { lat: 50.0677, lng: 19.9449, stopName: 'Dworzec Główny' }
      },
      {
        id: '3',
        userId: 'user3',
        username: 'Kasia M.',
        message: 'Czy ktoś wie czy autobus 124 jedzie dzisiaj normalnie?',
        timestamp: new Date(Date.now() - 120000),
        type: 'chat',
        routeId
      },
      {
        id: '4',
        userId: 'user4',
        username: 'Tomek W.',
        message: 'Tak, 124 jedzie bez problemów. Właśnie wsiadłem na Teatrze Bagatela',
        timestamp: new Date(Date.now() - 60000),
        type: 'info',
        routeId,
        location: { lat: 50.0625, lng: 19.9375, stopName: 'Teatr Bagatela' }
      }
    ];
    setMessages(mockMessages);
  }, [routeId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current_user',
      username: 'Ty',
      message: newMessage,
      timestamp: new Date(),
      type: messageType,
      routeId
    };

    setMessages(prev => [...prev, message]);
    onSendMessage?.(newMessage, messageType);
    setNewMessage('');
    setMessageType('chat');
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMessageBorderColor = (type: ChatMessage['type']) => {
    switch (type) {
      case 'info':
        return 'border-l-blue-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'success':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isActive) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="text-center text-white/70">
          <Info className="w-12 h-12 mx-auto mb-3 text-white/50" />
          <p className="text-lg font-medium mb-2">Live Chat</p>
          <p className="text-sm">Rozpocznij trasę, aby dołączyć do live chat z innymi pasażerami</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg flex flex-col h-96">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{messages.length} wiadomości</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">Trasa: {routeId}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg border-l-4 ${getMessageBorderColor(message.type)} bg-gray-50`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2">
                {getMessageIcon(message.type)}
                <span className="font-medium text-gray-900 text-sm">{message.username}</span>
                {message.location?.stopName && (
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    📍 {message.location.stopName}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            </div>
            <p className="text-gray-800 text-sm">{message.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Napisz wiadomość..."
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;