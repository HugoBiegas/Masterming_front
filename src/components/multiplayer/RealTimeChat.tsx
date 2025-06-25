import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RealTimeChatProps {
    roomCode: string;
    className?: string;
}

export const RealTimeChat: React.FC<RealTimeChatProps> = ({ roomCode, className = "" }) => {
    const { user } = useAuth();
    const { isConnected, chatMessages, sendChatMessage, getConnectionInfo } = useWebSocket(roomCode);

    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Debug : Afficher les infos de connexion
    const connectionInfo = getConnectionInfo();

    console.log('🔍 RealTimeChat Debug:', {
        roomCode,
        isConnected,
        messagesCount: chatMessages?.length || 0,
        user: user?.username,
        connectionInfo
    });

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || isSending || !user) {
            console.log('❌ Envoi bloqué:', {
                hasMessage: !!newMessage.trim(),
                isSending,
                hasUser: !!user,
                isConnected
            });
            return;
        }

        try {
            setIsSending(true);
            const messageToSend = newMessage.trim();

            console.log('📤 Tentative envoi message:', messageToSend);

            const success = sendChatMessage(messageToSend);

            if (success) {
                console.log('✅ Message envoyé, nettoyage input');
                setNewMessage('');
            } else {
                console.error('❌ Échec envoi message');
            }

        } catch (error) {
            console.error('❌ Erreur envoi message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow border ${className}`}>
            {/* Debug Header */}
            <div className="bg-gray-100 p-2 border-b text-xs text-gray-600">
                🔍 Debug: {isConnected ? '✅ Connecté' : '❌ Déconnecté'} |
                Messages: {chatMessages?.length || 0} |
                Room: {roomCode}
            </div>

            {/* Header normal */}
            <div className={`p-4 border-b ${isConnected ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">💬 Chat temps réel</h3>
                    <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-2">
                {!chatMessages || chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center">Aucun message pour le moment...</p>
                ) : (
                    chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs p-2 rounded-lg text-sm ${
                                msg.type === 'system' ? 'bg-gray-100 text-gray-700' :
                                    msg.user_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                            }`}>
                                {msg.type !== 'system' && msg.user_id !== user?.id && (
                                    <div className="font-semibold text-xs mb-1">{msg.username}</div>
                                )}
                                <div>{msg.message}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isConnected ? "Tapez votre message..." : "Chat déconnecté..."}
                        disabled={!isConnected || isSending}
                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <button
                        type="submit"
                        disabled={!isConnected || !newMessage.trim() || isSending}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isSending ? '⏳' : '📤'}
                    </button>
                </div>

                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                    Debug: {newMessage.length}/500 chars |
                    Send enabled: {isConnected && !!newMessage.trim() && !isSending ? 'Yes' : 'No'}
                </div>
            </form>
        </div>
    );
};