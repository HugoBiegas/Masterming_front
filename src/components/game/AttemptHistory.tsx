import React from 'react';
import { Attempt } from '@/types/game';
import { COLOR_PALETTE } from '@/utils/constants';

interface AttemptHistoryProps {
    attempts: Attempt[];
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({ attempts }) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-4">Historique des tentatives</h3>

            {attempts.length === 0 ? (
                <p className="text-gray-500 text-center">Aucune tentative pour le moment</p>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {attempts.map((attempt) => (
                        <div key={attempt.id} className="flex items-center space-x-4 p-2 border rounded">
                            <span className="text-sm font-medium w-8">#{attempt.attempt_number}</span>

                            <div className="flex space-x-1">
                                {attempt.combination.map((color, index) => (
                                    <div
                                        key={index}
                                        className="w-6 h-6 rounded-full border"
                                        style={{ backgroundColor: COLOR_PALETTE[color - 1] }}
                                    />
                                ))}
                            </div>

                            <div className="flex space-x-2 text-sm">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {attempt.correct_positions} ✓
                </span>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {attempt.correct_colors} ~
                </span>
                            </div>

                            {attempt.is_correct && (
                                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
                  GAGNÉ!
                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
