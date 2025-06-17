import { useState, useCallback, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

interface EliminationData {
    attemptsMade: number;
    maxAttempts: number;
    score: number;
}

export const useElimination = () => {
    const { showError, showWarning } = useNotification();

    const [showEliminationModal, setShowEliminationModal] = useState(false);
    const [showEliminationNotification, setShowEliminationNotification] = useState(false);
    const [eliminationData, setEliminationData] = useState<EliminationData>({
        attemptsMade: 0,
        maxAttempts: 0,
        score: 0
    });
    const [eliminatedPlayerName, setEliminatedPlayerName] = useState('');

    const hasShownElimination = useRef(false);

    const handlePlayerEliminated = useCallback((
        attempts: number,
        maxAttempts: number,
        score: number,
        isCurrentPlayer: boolean = true
    ) => {
        if (hasShownElimination.current) return;
        hasShownElimination.current = true;

        setEliminationData({ attemptsMade: attempts, maxAttempts, score });

        if (isCurrentPlayer) {
            showError(`💀 Vous avez été éliminé ! ${attempts}/${maxAttempts} tentatives utilisées.`);
            setTimeout(() => setShowEliminationModal(true), 1500);
        }
    }, [showError]);

    const handleOtherPlayerEliminated = useCallback((playerName: string, attempts: number, maxAttempts: number) => {
        setEliminatedPlayerName(playerName);
        setEliminationData({ attemptsMade: attempts, maxAttempts, score: 0 });
        setShowEliminationNotification(true);
        showWarning(`⚠️ ${playerName} a été éliminé !`);
    }, [showWarning]);

    const closeEliminationModal = useCallback(() => {
        setShowEliminationModal(false);
    }, []);

    const closeEliminationNotification = useCallback(() => {
        setShowEliminationNotification(false);
    }, []);

    const reset = useCallback(() => {
        hasShownElimination.current = false;
        setShowEliminationModal(false);
        setShowEliminationNotification(false);
    }, []);

    return {
        showEliminationModal,
        showEliminationNotification,
        eliminationData,
        eliminatedPlayerName,
        handlePlayerEliminated,
        handleOtherPlayerEliminated,
        closeEliminationModal,
        closeEliminationNotification,
        reset
    };
};
