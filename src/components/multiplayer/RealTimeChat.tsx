import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RealTimeChatProps {
    roomCode: string;
    className?: string;
}

export const RealTimeChat: React.FC<RealTimeChatProps> = ({
                                                              roomCode,
                                                              className = ""
                                                          }) => {
    const { user } = useAuth();
    const { isConnected, chatMessages, sendChatMessage } = useWebSocket(roomCode);

    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !isConnected || isSending || !user) return;

        try {
            setIsSending(true);
            const messageToSend = newMessage.trim();
            setNewMessage(''); // Vider immédiatement pour une meilleure UX

            const success = sendChatMessage(messageToSend);

            if (!success) {
                console.error('Failed to send message');
                setNewMessage(messageToSend); // Remettre le message si échec
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(newMessage); // Remettre le message si erreur
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {/* Header avec statut de connexion */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold">💬 Chat en temps réel</h3>
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-200' : 'bg-red-200'}`}></div>
                        <span className="text-sm">
                            {isConnected ? 'Connecté' : 'Déconnecté'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <div className="text-2xl mb-2">💬</div>
                        <p>Aucun message pour le moment...</p>
                        <p className="text-xs mt-1">
                            {isConnected ? 'Soyez le premier à écrire ! 🎉' : 'En attente de connexion...'}
                        </p>
                    </div>
                ) : (
                    chatMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`p-2 rounded-lg max-w-xs break-words ${
                                message.type === 'system'
                                    ? 'bg-blue-100 text-blue-800 text-center text-sm mx-auto max-w-full'
                                    : message.user_id === user?.id
                                        ? 'bg-blue-500 text-white ml-auto'
                                        : 'bg-white border border-gray-200'
                            }`}
                        >
                            {message.type !== 'system' && (
                                <div className="text-xs opacity-75 mb-1">
                                    {message.username}
                                    {message.user_id === user?.id && ' (vous)'}
                                </div>
                            )}
                            <div className="text-sm">{message.message}</div>
                            <div className="text-xs opacity-50 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? "Tapez votre message..." : "Chat déconnecté..."}
                        disabled={!isConnected || isSending}
                        maxLength={500}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim() || isSending}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                        {isSending ? '⏳' : '📤'}
                    </button>
                </div>

                {/* Informations */}
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>
                        {isConnected ? '✅ WebSocket connecté' : '❌ WebSocket déconnecté'}
                    </span>
                    <span className={newMessage.length > 450 ? 'text-red-500' : ''}>
                        {newMessage.length}/500
                    </span>
                </div>
            </form>
        </div>
    );
};
