import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'user' | 'system' | 'game';
    is_creator?: boolean;
}

interface ChatBoxProps {
    gameId?: string;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    maxHeight?: string;
    showTimestamps?: boolean;
    placeholder?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
                                                    gameId,
                                                    messages,
                                                    onSendMessage,
                                                    disabled = false,
                                                    maxHeight = '400px',
                                                    showTimestamps = true,
                                                    placeholder = 'Tapez votre message...'
                                                }) => {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus sur l'input quand le composant se monte
    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage || disabled) return;

        onSendMessage(trimmedMessage);
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMessageTypeStyles = (type: ChatMessage['type']) => {
        switch (type) {
            case 'system':
                return 'bg-gray-100 border-gray-200 text-gray-700 italic';
            case 'game':
                return 'bg-blue-100 border-blue-200 text-blue-700';
            default:
                return 'bg-white border-gray-200';
        }
    };

    const getMessageIcon = (type: ChatMessage['type']) => {
        switch (type) {
            case 'system':
                return '🔧';
            case 'game':
                return '🎮';
            default:
                return '💬';
        }
    };

    return (
        <div className="flex flex-col h-full">

            {/* Zone des messages */}
            <div
                className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2"
                style={{ maxHeight }}
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <div className="text-3xl mb-2">💬</div>
                            <p className="text-sm">Aucun message pour le moment</p>
                            <p className="text-xs">Soyez le premier à écrire !</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`p-3 rounded-lg border ${getMessageTypeStyles(message.type)} ${
                                    message.user_id === user?.id ? 'ml-8' : 'mr-8'
                                }`}
                            >
                                {/* En-tête du message */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">{getMessageIcon(message.type)}</span>
                                        <span className="font-medium text-sm">
                                            {message.type === 'user' ? (
                                                <>
                                                    {message.username}
                                                    {message.is_creator && <span className="text-yellow-600">👑</span>}
                                                    {message.user_id === user?.id && (
                                                        <span className="text-blue-600 text-xs ml-1">(vous)</span>
                                                    )}
                                                </>
                                            ) : (
                                                'Système'
                                            )}
                                        </span>
                                    </div>

                                    {showTimestamps && (
                                        <span className="text-xs text-gray-500">
                                            {formatTimestamp(message.timestamp)}
                                        </span>
                                    )}
                                </div>

                                {/* Contenu du message */}
                                <div className="text-sm leading-relaxed">
                                    {message.message}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Zone de saisie */}
            <form onSubmit={handleSubmit} className="mt-3">
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={disabled ? 'Chat désactivé' : placeholder}
                        disabled={disabled}
                        maxLength={500}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={disabled || !newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        📤
                    </button>
                </div>

                {/* Compteur de caractères */}
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                        {isTyping && (
                            <span className="flex items-center">
                                <div className="animate-pulse">✍️</div>
                                <span className="ml-1">En train d'écrire...</span>
                            </span>
                        )}
                    </div>

                    <span className={`${newMessage.length > 450 ? 'text-red-500' : ''}`}>
                        {newMessage.length}/500
                    </span>
                </div>
            </form>

            {/* Raccourcis clavier */}
            {!disabled && (
                <div className="mt-2 text-xs text-gray-400">
                    💡 Appuyez sur Entrée pour envoyer
                </div>
            )}
        </div>
    );
};

// Composant simplifié pour les notifications de chat
export const ChatNotification: React.FC<{
    message: ChatMessage;
    onDismiss: () => void;
}> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm z-50">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span>💬</span>
                        <span className="font-medium text-sm">{message.username}</span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

// Hook personnalisé pour gérer le chat
export const useChat = (gameId?: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const addMessage = (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);

        if (!isVisible) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const markAsRead = () => {
        setUnreadCount(0);
    };

    const sendMessage = (content: string) => {
        // Cette fonction sera connectée au WebSocket
        console.log('Envoi message:', content);
    };

    const addSystemMessage = (content: string) => {
        const systemMessage: ChatMessage = {
            id: `system_${Date.now()}`,
            user_id: 'system',
            username: 'Système',
            message: content,
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        addMessage(systemMessage);
    };

    return {
        messages,
        unreadCount,
        isVisible,
        setIsVisible,
        addMessage,
        markAsRead,
        sendMessage,
        addSystemMessage
    };
};