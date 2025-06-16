import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { validateEmail, validatePassword } from '@/utils/helpers';

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
    const { register, isLoading } = useAuth();
    const { showError, showSuccess, showWarning } = useNotification();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        accept_terms: false
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState<{
        isValid: boolean;
        errors: string[];
    }>({ isValid: false, errors: [] });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Le nom d\'utilisateur est requis';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et _';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est requis';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Format d\'email invalide';
        }

        // Password validation
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors[0]; // Show first error
        }

        // Password confirmation
        if (!formData.password_confirm) {
            newErrors.password_confirm = 'Veuillez confirmer votre mot de passe';
        } else if (formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
        }

        // Terms acceptance
        if (!formData.accept_terms) {
            newErrors.accept_terms = 'Vous devez accepter les conditions d\'utilisation';
        }

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getErrorMessage = (error: any): string => {
        if (!error.response) {
            return 'Erreur de connexion. Vérifiez votre connexion internet.';
        }

        const status = error.response.status;
        const detail = error.response.data?.detail;

        switch (status) {
            case 400:
                if (detail?.includes('username')) {
                    return 'Ce nom d\'utilisateur est déjà utilisé.';
                }
                if (detail?.includes('email')) {
                    return 'Cette adresse email est déjà utilisée.';
                }
                return 'Données d\'inscription invalides.';
            case 422:
                if (detail?.includes('username')) {
                    return 'Nom d\'utilisateur invalide ou déjà pris.';
                }
                if (detail?.includes('email')) {
                    return 'Adresse email invalide ou déjà utilisée.';
                }
                if (detail?.includes('password')) {
                    return 'Le mot de passe ne respecte pas les critères de sécurité.';
                }
                return 'Données d\'inscription invalides.';
            case 429:
                return 'Trop de tentatives d\'inscription. Veuillez patienter.';
            case 500:
                return 'Erreur serveur. Veuillez réessayer plus tard.';
            default:
                return detail || 'Erreur d\'inscription inattendue.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showError('Veuillez corriger les erreurs dans le formulaire.');
            return;
        }

        try {
            await register(formData);
            showSuccess('Inscription réussie ! Bienvenue dans Quantum Mastermind !');
        } catch (err: any) {
            const errorMessage = getErrorMessage(err);
            showError(errorMessage);

            // Handle specific error cases
            if (err.response?.status === 400) {
                const detail = err.response.data?.detail || '';
                if (detail.includes('username')) {
                    setFieldErrors(prev => ({ ...prev, username: 'Ce nom d\'utilisateur est déjà pris' }));
                }
                if (detail.includes('email')) {
                    setFieldErrors(prev => ({ ...prev, email: 'Cette adresse email est déjà utilisée' }));
                }
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

        // Real-time password strength check
        if (name === 'password') {
            const strength = validatePassword(value);
            setPasswordStrength(strength);
        }
    };

    const getPasswordStrengthColor = () => {
        if (!formData.password) return 'bg-gray-200';
        if (passwordStrength.isValid) return 'bg-green-500';
        if (formData.password.length >= 6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Inscription</h2>
                <p className="text-gray-600 mt-2">Créez votre compte pour jouer</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur
                </label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Choisissez un nom d'utilisateur"
                />
                {fieldErrors.username && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.username}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="votre@email.com"
                />
                {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.email}
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
                    placeholder="Choisissez un mot de passe sécurisé"
                />

                {/* Password strength indicator */}
                {formData.password && (
                    <div className="mt-2">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                    style={{ width: passwordStrength.isValid ? '100%' : '50%' }}
                                ></div>
                            </div>
                            <span className={`text-xs font-medium ${
                                passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {passwordStrength.isValid ? 'Fort' : 'Faible'}
                            </span>
                        </div>
                        {passwordStrength.errors.length > 0 && (
                            <ul className="mt-1 text-xs text-gray-600 space-y-1">
                                {passwordStrength.errors.map((error, index) => (
                                    <li key={index} className="flex items-center">
                                        <span className="mr-1">•</span>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.password}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                </label>
                <input
                    type="password"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        fieldErrors.password_confirm ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirmez votre mot de passe"
                />
                {fieldErrors.password_confirm && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.password_confirm}
                    </p>
                )}
                {formData.password_confirm && formData.password === formData.password_confirm && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                        <span className="mr-1">✅</span>
                        Les mots de passe correspondent
                    </p>
                )}
            </div>

            <div>
                <div className="flex items-start">
                    <input
                        type="checkbox"
                        name="accept_terms"
                        checked={formData.accept_terms}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                        J'accepte les{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                            conditions d'utilisation
                        </a>{' '}
                        et la{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-500">
                            politique de confidentialité
                        </a>
                    </label>
                </div>
                {fieldErrors.accept_terms && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.accept_terms}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <div className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Inscription...
                    </div>
                ) : (
                    'S\'inscrire'
                )}
            </button>

            <div className="text-center">
                <span className="text-gray-600">Déjà un compte ? </span>
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                >
                    Se connecter
                </button>
            </div>
        </form>
    );
};