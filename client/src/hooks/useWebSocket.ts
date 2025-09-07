import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(streamId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!streamId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      setIsConnected(true);
      // Join the stream room
      socket.send(JSON.stringify({
        type: 'join_stream',
        streamId
      }));
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'listener_count_update':
            setListenerCount(message.count);
            break;
          case 'new_message':
            setMessages(prev => [message.message, ...prev]);
            break;
          case 'stream_liked':
            // Handle stream like events
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current = socket;
  }, [streamId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChatMessage = useCallback((messageText: string, userId: string) => {
    sendMessage({
      type: 'chat_message',
      message: messageText,
      userId
    });
  }, [sendMessage]);

  const likeStream = useCallback((userId: string) => {
    sendMessage({
      type: 'like_stream',
      userId
    });
  }, [sendMessage]);

  useEffect(() => {
    if (streamId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [streamId, connect, disconnect]);

  return {
    isConnected,
    listenerCount,
    messages,
    sendChatMessage,
    likeStream,
    connect,
    disconnect
  };
}
