interface PlayerStatusIndicatorProps {
    username: string;
    status: 'active' | 'eliminated' | 'finished' | 'disconnected';
    attempts: number;
    maxAttempts: number;
    score: number;
    isCurrentUser: boolean;
    isWinner: boolean;
}

export const PlayerStatusIndicator: React.FC<PlayerStatusIndicatorProps> = ({
                                                                                username,
                                                                                status,
                                                                                attempts,
                                                                                maxAttempts,
                                                                                score,
                                                                                isCurrentUser,
                                                                                isWinner
                                                                            }) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'finished': return isWinner ? '🏆' : '🏁';
            case 'eliminated': return '💀';
            case 'active': return '⚡';
            case 'disconnected': return '📴';
            default: return '❓';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'finished': return isWinner ? 'border-green-500 bg-green-50' : 'border-gray-500 bg-gray-50';
            case 'eliminated': return 'border-red-500 bg-red-50';
            case 'active': return 'border-blue-500 bg-blue-50';
            case 'disconnected': return 'border-gray-400 bg-gray-100';
            default: return 'border-gray-300 bg-white';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'finished': return isWinner ? 'Gagnant' : 'Terminé';
            case 'eliminated': return 'Éliminé';
            case 'active': return 'En cours';
            case 'disconnected': return 'Déconnecté';
            default: return 'Inconnu';
        }
    };

    return (
        <div className={`border-2 rounded-lg p-3 ${getStatusColor()} ${
            isCurrentUser ? 'ring-2 ring-purple-300' : ''
        } transition-all duration-200`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon()}</span>
                    <div>
                        <div className={`font-medium text-sm ${
                            isCurrentUser ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                            {username} {isCurrentUser && '(Vous)'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {getStatusText()}
                        </div>
                    </div>
                </div>

                <div className="text-right text-xs">
                    <div className="font-mono text-gray-600">
                        {attempts}/{maxAttempts}
                    </div>
                    <div className="text-gray-500">
                        {score} pts
                    </div>
                </div>
            </div>

            {/* Barre de progression des tentatives */}
            <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            status === 'eliminated' ? 'bg-red-500' :
                                status === 'finished' ? 'bg-green-500' :
                                    'bg-blue-500'
                        }`}
                        style={{ width: `${(attempts / maxAttempts) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
