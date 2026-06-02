import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
    MessageIcon, XIcon, PaperclipIcon, SendIcon,
    ChevronDownIcon, SearchIcon
} from '../../icons';



const IndividualChatWindow: React.FC<{ userId: string }> = ({ userId }) => {
    const { availableUsers, chatHistories, sendChat, closeChat } = useChat();
    const { user: currentUser } = useAuth();
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const user = availableUsers.find(u => u._id === userId);
    const messages = chatHistories[userId] || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageText.trim()) {
            sendChat(userId, messageText);
            setMessageText('');
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, you'd upload this to a server
            // For now, we'll just send a placeholder message
            sendChat(userId, `[Attachment: ${file.name}]`);
            // Reset the input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!user) return null;

    return (
        <div className="chat-window fade-in">
            <div className="chat-window-header">
                <div className="chat-items-center chat-gap-2 chat-flex-1 chat-min-w-0">
                    <div className="message-avatar-tiny bg-slate-200 chat-items-center justify-center font-bold text-[10px] text-slate-600">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="chat-flex-col chat-min-w-0">
                        <span className="text-[13px] font-bold text-slate-800 chat-truncate leading-tight">
                            {user?.name}
                        </span>
                        <span className="text-[10px] text-green-500 font-medium leading-tight">
                            Active now
                        </span>
                    </div>
                </div>
                <div className="chat-items-center chat-gap-1">
                    <button className="chat-header-btn" title="Minimize">
                        <ChevronDownIcon size={14} />
                    </button>
                    <button className="chat-header-btn" onClick={() => closeChat(userId)} title="Close">
                        <XIcon size={14} />
                    </button>
                </div>
            </div>

            <div className="chat-messages-area custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="chat-flex chat-items-center justify-center h-full text-slate-400 text-[12px] italic">
                        No messages yet
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`message-row ${msg.senderId === currentUser?._id ? 'me' : ''}`}>
                            {msg.senderId !== currentUser?._id && (
                                <div className="message-avatar-tiny bg-slate-200 chat-items-center justify-center text-[9px] font-bold">
                                    {user?.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="chat-flex-col">
                                <div className={`chat-message-bubble ${msg.senderId === currentUser?._id ? 'chat-message-me' : 'chat-message-other'}`}>
                                    {msg.text}
                                </div>
                                <span className="chat-message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-window-footer">
                <form onSubmit={handleSend} className="chat-items-center chat-w-full chat-gap-2">
                    <div className="chat-input-wrapper-integrated chat-flex-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="chat-icon-btn-ghost"
                            onClick={handleAttachmentClick}
                            title="Attach File"
                        >
                            <PaperclipIcon size={16} />
                        </button>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="chat-text-input-modern"
                        />
                    </div>
                    <button type="submit" disabled={!messageText.trim()} className="chat-send-btn-circle">
                        <SendIcon size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const ChatWidget: React.FC = () => {
    const { availableUsers, openChatIds, openChat, unreadCounts } = useChat();
    const { user: currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser || currentUser.role === 'Normal User') return null;

    const filteredUsers = availableUsers.filter(u =>
        u.role !== 'Normal User' && u._id !== currentUser?._id &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Multi-window Dock */}
            <div className="chat-window-dock">
                {openChatIds.map(id => (
                    <IndividualChatWindow key={id} userId={id} />
                ))}
            </div>

            {/* Launcher */}
            <button onClick={() => setIsOpen(!isOpen)} className="chat-widget-launcher chat-relative" title="Open Chat">
                <MessageIcon size={24} />
                {Object.values(unreadCounts).some(count => count > 0) && (
                    <div className="chat-absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white" style={{ top: '-2px', right: '-2px' }}></div>
                )}
            </button>

            {/* Member List Launcher (Screenshot 1 Style) */}
            {isOpen && (
                <div className="chat-widget-container-list fade-in" style={{ width: '300px', height: '450px' }}>
                    <div className="chat-widget-header">
                        <span className="font-bold text-[14px] text-slate-800">Chat Members</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsOpen(false)} className="chat-header-btn hover:!text-red-500">
                                <XIcon size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-search-input-container">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="chat-search-input"
                        />
                        <div className="chat-search-icon"><SearchIcon size={14} /></div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.map(u => (
                            <div key={u._id} onClick={() => openChat(u._id)} className="chat-user-item-new">
                                <div className="chat-avatar-circle chat-relative">
                                    {u.name.charAt(0)}
                                    {unreadCounts[u._id] > 0 && (
                                        <div className="chat-absolute w-2.5 h-2.5 bg-red-500 rounded-full border border-white" style={{ top: '-1px', right: '-1px' }}></div>
                                    )}
                                </div>
                                <div className="chat-item-content">
                                    <div className="chat-item-header">
                                        <h4 className="chat-item-name">{u.name}</h4>
                                        <span className="chat-item-time">
                                            {u.lastMessageTime ? new Date(u.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                                        </span>
                                    </div>
                                    <div className="chat-item-footer">
                                        <p className="chat-item-snippet">{u.lastMessage || 'No messages'}</p>
                                        <div className={`status-indicator-dot ${u.isOnline ? 'status-online' : 'status-offline'}`}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
