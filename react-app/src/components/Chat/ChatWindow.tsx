import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { SendIcon, PhoneIcon, VideoIcon, InfoIcon, PaperclipIcon } from '../../icons';

const ChatWindow: React.FC = () => {
    const { chatHistories, activeChat, sendChat, availableUsers, loading: chatLoading } = useChat();
    const { user: currentUser } = useAuth();
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeUser = availableUsers.find((u) => u._id === activeChat);
    const messages = activeChat ? (chatHistories[activeChat] || []) : [];
    const isLoading = activeChat ? (chatLoading[activeChat] || false) : false;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && activeChat) {
            sendChat(activeChat, text);
            setText('');
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (d.toDateString() === now.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const groupedMessages = messages.reduce((acc: any, msg) => {
        const date = new Date(msg.timestamp).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    if (!activeChat) {
        return (
            <div className="chat-window-main chat-items-center chat-justify-center chat-p-2 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full chat-items-center chat-justify-center mb-6 shadow-inner">
                    <SendIcon size={40} className="text-[#0078C6] opacity-40 transform -rotate-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Professional Hub</h2>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                    Select a colleague from the sidebar to start a secure, real-time professional conversation.
                </p>
            </div>
        );
    }

    return (
        <div className="chat-window-main">
            {/* Header */}
            <div className="chat-window-top">
                <div className="chat-items-center chat-gap-2">
                    <div className="chat-user-avatar text-white font-extrabold" style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))'
                    }}>
                        {activeUser?.name?.charAt(0) || '?'}
                    </div>
                    <div className="chat-flex-col">
                        <h3 className="font-bold text-[#1e293b] text-[16px] leading-tight" style={{ margin: 0 }}>{activeUser?.name}</h3>
                        <div className="chat-items-center chat-gap-1" style={{ marginTop: '2px' }}>
                            <div className={`w-2 h-2 rounded-full ${activeUser?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ margin: 0 }}>
                                {activeUser?.isOnline ? 'Active Now' : 'Offline'} • {activeUser?.role}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="chat-items-center chat-gap-2">
                    <button className="chat-header-btn p-2" title="Call">
                        <PhoneIcon size={18} />
                    </button>
                    <button className="chat-header-btn p-2" title="Video Call">
                        <VideoIcon size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button className="chat-header-btn p-2" title="User Details">
                        <InfoIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-flex-1 chat-overflow-auto chat-p-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {isLoading && (
                    <div className="chat-justify-center">
                        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Syncing history...
                        </div>
                    </div>
                )}

                {Object.keys(groupedMessages).map((dateString) => (
                    <div key={dateString} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="chat-justify-center">
                            <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm border border-slate-200">
                                {formatDate(dateString)}
                            </div>
                        </div>
                        {groupedMessages[dateString].map((msg: any) => (
                            <div
                                key={msg._id}
                                className={`chat-flex ${msg.senderId === currentUser?._id ? 'chat-justify-end' : 'chat-justify-start'} fade-in`}
                            >
                                <div
                                    className={`max-w-[70%] chat-p-2 rounded-2xl shadow-sm chat-relative ${msg.senderId === currentUser?._id
                                        ? 'bg-gradient-to-br from-[#199DFF] to-[#0078C6] text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                        }`}
                                >
                                    <p className="text-[14px] leading-relaxed font-medium" style={{ margin: 0 }}>{msg.text}</p>
                                    <div className={`chat-items-center chat-justify-end chat-gap-1 mt-2 ${msg.senderId === currentUser?._id ? 'text-blue-100' : 'text-slate-400'}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ margin: 0 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </p>
                                        {msg.senderId === currentUser?._id && (
                                            <div className="chat-flex" style={{ marginLeft: '-4px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-p-2 chat-border-t bg-white">
                <form onSubmit={handleSend} className="chat-flex chat-gap-2 chat-items-end">
                    <div className="chat-flex-1 bg-[#f8fafc] border border-slate-200 rounded-2xl chat-p-2 shadow-inner group transition-all">
                        <textarea
                            rows={1}
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a professional message..."
                            className="chat-w-full chat-p-2 bg-transparent border-none focus:outline-none resize-none max-h-32 text-slate-800 font-medium text-sm placeholder:text-slate-400"
                        />
                        <div className="chat-items-center chat-justify-between chat-p-2" style={{ paddingTop: 0 }}>
                            <div className="chat-items-center chat-gap-1">
                                <button type="button" className="chat-header-btn p-2" title="Attach Files">
                                    <PaperclipIcon size={18} />
                                </button>
                                <div className="text-[10px] text-slate-400 font-bold ml-1 hidden sm:block uppercase tracking-widest">
                                    Press Enter to send
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!text.trim()}
                        className="p-4 bg-gradient-to-br from-[#0078C6] to-[#199DFF] text-white rounded-2xl transition-all"
                        style={{ width: '54px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                    >
                        <SendIcon size={22} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
