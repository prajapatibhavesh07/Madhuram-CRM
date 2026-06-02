import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api, BASE_URL } from '../services/api';
import { useToast } from './ToastContext';

interface Message {
    _id: string;
    senderId: string; // Renamed for clarity and consistency
    recipientId: string; // Renamed for clarity and consistency
    text: string;
    timestamp: string; // Renamed to match component expectation
}

interface ChatUser {
    _id: string;
    name: string;
    username: string;
    role: string;
    isOnline: boolean;
    lastMessage?: string;
    lastMessageTime?: string;
}

interface ChatContextType {
    socket: Socket | null;
    openChatIds: string[];
    openChat: (userId: string) => void;
    closeChat: (userId: string) => void;
    chatHistories: Record<string, Message[]>;
    sendChat: (recipientId: string, text: string) => void;
    availableUsers: ChatUser[];
    loading: Record<string, boolean>;
    activeChat: string | null;
    setActiveChat: (userId: string | null) => void;
    unreadCounts: Record<string, number>;
    clearUnread: (userId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [openChatIds, setOpenChatIds] = useState<string[]>([]);
    const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
    const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // Refs for socket listeners to access current state without re-registering
    const activeChatRef = useRef<string | null>(null);
    const openChatIdsRef = useRef<string[]>([]);
    const availableUsersRef = useRef<ChatUser[]>([]);
    const chatHistoriesRef = useRef<Record<string, Message[]>>({});

    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
    useEffect(() => { openChatIdsRef.current = openChatIds; }, [openChatIds]);
    useEffect(() => { availableUsersRef.current = availableUsers; }, [availableUsers]);
    useEffect(() => { chatHistoriesRef.current = chatHistories; }, [chatHistories]);

    // 1. Helper Functions
    const openChat = useCallback(async (userId: string) => {
        if (!openChatIdsRef.current.includes(userId)) {
            setOpenChatIds(prev => [...prev, userId]);

            // Fetch history if not already loaded
            if (!chatHistories[userId]) {
                setLoading(prev => ({ ...prev, [userId]: true }));
                try {
                    const rawHistory = await api.getChatHistory(userId);
                    const history: Message[] = rawHistory.map((msg: any) => ({
                        _id: msg._id,
                        senderId: msg.sender,
                        recipientId: msg.recipient,
                        text: msg.text,
                        timestamp: msg.createdAt
                    }));
                    setChatHistories(prev => ({ ...prev, [userId]: history }));
                } catch (error) {
                    console.error(`Failed to fetch history for ${userId}`, error);
                } finally {
                    setLoading(prev => ({ ...prev, [userId]: false }));
                }
            }
        }
    }, [openChatIds, chatHistories]);

    const closeChat = useCallback((userId: string) => {
        setOpenChatIds(prev => prev.filter(id => id !== userId));
    }, []);

    const clearUnread = useCallback((userId: string) => {
        setUnreadCounts(prev => ({ ...prev, [userId]: 0 }));
    }, []);

    const sendChat = useCallback((recipientId: string, text: string) => {
        if (socket && user) {
            socket.emit('send_message', {
                senderId: user._id,
                recipientId,
                text
            });
        }
    }, [socket, user]);

    const showNotification = useCallback((title: string, body: string, data?: any) => {
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
            const notification = new Notification(title, {
                body,
                icon: '/favicon.ico',
                tag: 'chat-notification',
                renotify: true
            } as any);

            notification.onclick = () => {
                window.focus();
                if (data?.senderId) {
                    openChat(data.senderId);
                } else if (data?.path) {
                    window.location.href = data.path;
                }
                notification.close();
            };
        }
    }, [openChat]);

    const playNotificationSound = useCallback(() => {
        // Simple subtle bell sound (base64 encoded to avoid external assets)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5); // Drop to A4

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }, []);

    const speakNotification = useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 0.5;
            utterance.rate = 1.1; // Slightly faster than default
            
            // Try to use a natural English voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const showNotificationRef = useRef(showNotification);
    const playNotificationSoundRef = useRef(playNotificationSound);
    const speakNotificationRef = useRef(speakNotification);

    useEffect(() => { showNotificationRef.current = showNotification; }, [showNotification]);
    useEffect(() => { playNotificationSoundRef.current = playNotificationSound; }, [playNotificationSound]);
    useEffect(() => { speakNotificationRef.current = speakNotification; }, [speakNotification]);

    // 2. Initial Permissions
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Clear unread when activeChat changes
    useEffect(() => {
        if (activeChat) {
            setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
        }
    }, [activeChat]);

    useEffect(() => {
        if (user) {
            const newSocket = io(BASE_URL, {
                transports: ['websocket'],
                autoConnect: true
            });
            setSocket(newSocket);

            newSocket.emit('join', user._id);

            newSocket.on('receive_message', (rawMessage: any) => {
                // Map backend fields to frontend interface
                const message: Message = {
                    _id: rawMessage._id,
                    senderId: rawMessage.sender,
                    recipientId: rawMessage.recipient,
                    text: rawMessage.text,
                    timestamp: rawMessage.createdAt
                };

                const otherPartyId = message.senderId;
                setChatHistories(prev => ({
                    ...prev,
                    [otherPartyId]: [...(prev[otherPartyId] || []), message]
                }));

                // Increment unread if NOT active and NOT open in a widget
                const isActive = activeChatRef.current === otherPartyId;
                const isOpen = openChatIdsRef.current.includes(otherPartyId);

                if (!isActive && !isOpen) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [otherPartyId]: (prev[otherPartyId] || 0) + 1
                    }));
                }

                // Show browser notification, sound, and voice if tab is hidden
                if (document.visibilityState === 'hidden') {
                    const sender = availableUsersRef.current.find(u => u._id === otherPartyId);
                    const senderName = sender ? sender.name : 'someone';
                    
                    showNotificationRef.current(
                        `New message from ${senderName}`,
                        message.text,
                        { senderId: otherPartyId }
                    );
                    
                    // Play sound
                    playNotificationSoundRef.current();
                    
                    // Announce via voice
                    speakNotificationRef.current(`New message from ${senderName}`);
                }
            });

            newSocket.on('message_sent', (rawMessage: any) => {
                const message: Message = {
                    _id: rawMessage._id,
                    senderId: rawMessage.sender,
                    recipientId: rawMessage.recipient,
                    text: rawMessage.text,
                    timestamp: rawMessage.createdAt
                };

                const otherPartyId = message.recipientId;
                setChatHistories(prev => ({
                    ...prev,
                    [otherPartyId]: [...(prev[otherPartyId] || []), message]
                }));
            });
            
            newSocket.on('new_notification', (notification: any) => {
                // 1. Show Toast
                showToast(notification.title, notification.type || 'info');
                
                // 2. Play Sound (Always, as per user request)
                playNotificationSoundRef.current();
                
                // 3. Browser Notification if hidden
                if (document.visibilityState === 'hidden') {
                    showNotificationRef.current(
                        notification.title,
                        notification.message,
                        { path: notification.path }
                    );
                }

                // 4. Dispatch a custom event for MainLayout to listen to
                window.dispatchEvent(new CustomEvent('notification_received', { detail: notification }));
            });

            newSocket.on('user_status_changed', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
                setAvailableUsers((prev) =>
                    prev.map(u => u._id === userId ? { ...u, isOnline } : u)
                );
            });

            return () => {
                console.log('Disconnecting Chat Socket');
                newSocket.disconnect();
            };
        }
    }, [user?._id]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const users = await api.getChatUsers();
                    setAvailableUsers(users);
                } catch (error) {
                    console.error('Failed to fetch chat users', error);
                }
            }
        };
        fetchData();
    }, [user]);
    return (
        <ChatContext.Provider value={{
            socket, openChatIds, openChat, closeChat,
            chatHistories, sendChat, availableUsers, loading,
            activeChat, setActiveChat, unreadCounts, clearUnread
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
