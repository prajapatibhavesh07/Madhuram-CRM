import React from 'react';
import { useChat } from '../../context/ChatContext';
import { SearchIcon } from '../../icons';

const ChatList: React.FC = () => {
    const { availableUsers, activeChat, setActiveChat, unreadCounts } = useChat();
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="chat-list-container chat-border-r chat-shadow-sm">
            <div className="chat-list-header chat-flex-col chat-gap-1">
                <div className="chat-items-center chat-justify-between">
                    <h2 className="chat-list-title">Messages</h2>
                    <div className="chat-badge">
                        Staff
                    </div>
                </div>
                <div className="chat-search-wrapper">
                    <input
                        type="text"
                        placeholder="Search colleagues..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="chat-search-field"
                    />
                    <div className="chat-absolute" style={{ left: '12px', top: '10px', color: '#94a3b8' }}>
                        <SearchIcon size={16} />
                    </div>
                </div>
            </div>

            <div className="chat-flex-1 chat-overflow-auto chat-p-2">
                {filteredUsers.length === 0 ? (
                    <div className="chat-p-2 chat-justify-center" style={{ paddingTop: '32px' }}>
                        <p className="text-sm text-slate-400 font-medium">No results found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => setActiveChat(user._id)}
                            className={`group chat-p-2 cursor-pointer rounded-xl chat-items-center chat-gap-2 transition-all mb-1 ${activeChat === user._id
                                ? 'bg-[#f1f5f9] shadow-sm'
                                : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="chat-relative">
                                <div className="chat-user-avatar" style={{
                                    background: activeChat === user._id
                                        ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                        : '#f3f4f6',
                                    color: activeChat === user._id ? 'white' : '#64748b'
                                }}>
                                    {user.name.charAt(0)}
                                </div>
                                <div className={`chat-absolute w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} style={{ bottom: '2px', right: '2px' }}></div>
                                {unreadCounts[user._id] > 0 && (
                                    <div className="chat-absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white" style={{ top: '-2px', right: '-2px', zIndex: 10 }}></div>
                                )}
                            </div>
                            <div className="chat-flex-1 chat-min-w-0">
                                <div className="chat-justify-between" style={{ alignItems: 'baseline' }}>
                                    <p className={`font-bold chat-truncate text-[14px] ${activeChat === user._id ? 'text-[#0078C6]' : 'text-[#1e293b]'}`} style={{ margin: 0 }}>
                                        {user.name}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-medium">10:45 AM</span>
                                </div>
                                <div className="chat-items-center chat-gap-1" style={{ marginTop: '2px' }}>
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider chat-truncate" style={{ margin: 0 }}>{user.role}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatList;
