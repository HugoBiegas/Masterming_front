import React from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface AttemptHistoryProps {
    attempts: Attempt[];
    maxAttempts?: number;
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({ attempts, maxAttempts }) => {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-lg border-2 border-amber-200">
            <div className="bg-white rounded-lg p-4 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Historique des tentatives</h3>
                    <div className="text-sm text-gray-600">
                        {attempts.length}{maxAttempts ? ` / ${maxAttempts}` : ''}
                    </div>
                </div>

                {attempts.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">🎯</div>
                        <p className="text-gray-500">Aucune tentative pour le moment</p>
                        <p className="text-xs text-gray-400 mt-1">Faites votre première tentative !</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {attempts.map((attempt) => (
                            <div
                                key={attempt.id}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border-2 transition-all
                                    ${attempt.is_correct
                                    ? 'bg-green-50 border-green-300 shadow-green-100'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                }
                                `}
                            >
                                {/* Attempt number */}
                                <div className="flex items-center space-x-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                        ${attempt.is_correct
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-400 text-white'
                                    }
                                    `}>
                                        {attempt.attempt_number}
                                    </div>

                                    {/* Color combination */}
                                    <div className="flex space-x-1">
                                        {attempt.combination.map((color, index) => (
                                            <div
                                                key={index}
                                                className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm relative"
                                                style={{
                                                    backgroundColor: COLOR_PALETTE[color - 1],
                                                    boxShadow: `0 2px 4px ${COLOR_PALETTE[color - 1]}40, inset 0 -1px 2px rgba(0,0,0,0.2)`
                                                }}
                                                title={`Position ${index + 1}`}
                                            >
                                                {/* Glossy effect */}
                                                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-50"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback indicators - Mastermind style */}
                                <div className="flex items-center space-x-4">
                                    {/* Black pegs (correct position) */}
                                    <div className="flex items-center space-x-1">
                                        <div className="grid grid-cols-2 gap-1">
                                            {Array.from({ length: 4 }, (_, index) => (
                                                <div
                                                    key={index}
                                                    className={`w-3 h-3 rounded-full border ${
                                                        index < attempt.correct_positions
                                                            ? 'bg-black border-gray-600'
                                                            : 'bg-gray-200 border-gray-300'
                                                    }`}
                                                    title={index < attempt.correct_positions ? 'Bonne couleur, bonne position' : 'Vide'}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 ml-1">
                                            {attempt.correct_positions}✓
                                        </span>
                                    </div>

                                    {/* White pegs (correct color, wrong position) */}
                                    <div className="flex items-center space-x-1">
                                        <div className="grid grid-cols-2 gap-1">
                                            {Array.from({ length: 4 }, (_, index) => (
                                                <div
                                                    key={index}
                                                    className={`w-3 h-3 rounded-full border ${
                                                        index < attempt.correct_colors
                                                            ? 'bg-white border-gray-600 shadow-inner'
                                                            : 'bg-gray-200 border-gray-300'
                                                    }`}
                                                    title={index < attempt.correct_colors ? 'Bonne couleur, mauvaise position' : 'Vide'}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 ml-1">
                                            {attempt.correct_colors}~
                                        </span>
                                    </div>

                                    {/* Success indicator */}
                                    {attempt.is_correct && (
                                        <div className="flex items-center space-x-1">
                                            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                🏆 GAGNÉ!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-black rounded-full border"></div>
                            <span>Bonne couleur, bonne position</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-white rounded-full border border-gray-600 shadow-inner"></div>
                            <span>Bonne couleur, mauvaise position</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};