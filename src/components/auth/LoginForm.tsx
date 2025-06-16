import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface LoginFormProps {
    onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
    const { login, isLoading } = useAuth();
    const { showError, showSuccess } = useNotification();
    const [formData, setFormData] = useState({
        username_or_email: '',
        password: '',
        remember_me: false
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.username_or_email.trim()) {
            errors.username_or_email = 'Le nom d\'utilisateur ou email est requis';
        }

        if (!formData.password.trim()) {
            errors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 3) {
            errors.password = 'Le mot de passe doit contenir au moins 3 caractères';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getErrorMessage = (error: any): string => {
        if (!error.response) {
            return 'Erreur de connexion. Vérifiez votre connexion internet.';
        }

        const status = error.response.status;
        const detail = error.response.data?.detail;

        switch (status) {
            case 401:
                return 'Nom d\'utilisateur/email ou mot de passe incorrect.';
            case 403:
                return 'Votre compte est désactivé. Contactez l\'administrateur.';
            case 422:
                if (detail?.includes('username')) {
                    return 'Nom d\'utilisateur invalide.';
                }
                if (detail?.includes('password')) {
                    return 'Mot de passe invalide.';
                }
                return 'Données de connexion invalides.';
            case 429:
                return 'Trop de tentatives de connexion. Veuillez patienter.';
            case 500:
                return 'Erreur serveur. Veuillez réessayer plus tard.';
            default:
                return detail || 'Erreur de connexion inattendue.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showError('Veuillez corriger les erreurs dans le formulaire.');
            return;
        }

        try {
            await login(formData);
            showSuccess('Connexion réussie ! Bienvenue !');
        } catch (err: any) {
            const errorMessage = getErrorMessage(err);
            showError(errorMessage);

            // Effacer le mot de passe en cas d'erreur de connexion
            if (err.response?.status === 401) {
                setFormData(prev => ({ ...prev, password: '' }));
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
                <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur ou Email
                </label>
                <input
                    type="text"
                    name="username_or_email"
                    value={formData.username_or_email}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.username_or_email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Entrez votre nom d'utilisateur ou email"
                />
                {fieldErrors.username_or_email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.username_or_email}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                </label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Entrez votre mot de passe"
                />
                {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.password}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="remember_me"
                        checked={formData.remember_me}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                        Se souvenir de moi
                    </label>
                </div>
                <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                >
                    Mot de passe oublié ?
                </button>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <div className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Connexion...
                    </div>
                ) : (
                    'Se connecter'
                )}
            </button>

            <div className="text-center">
                <span className="text-gray-600">Pas de compte ? </span>
                <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                >
                    S'inscrire
                </button>
            </div>
        </form>
    );
};