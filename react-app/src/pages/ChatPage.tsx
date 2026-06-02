import React from 'react';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const ChatPage: React.FC = () => {
    return (
        <div className="h-[calc(100vh-140px)] fade-in">
            <div className="h-full flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="w-80 flex-shrink-0">
                    <ChatList />
                </div>
                <div className="flex-1 bg-slate-50">
                    <ChatWindow />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
