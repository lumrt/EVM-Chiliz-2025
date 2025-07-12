"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import FileUpload from "./FileUpload";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profileData: ProfileData) => void;
}

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profilePicture?: string;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user } = usePrivy();
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    displayName: "",
    bio: "",
    profilePicture: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores";
    } else if (formData.username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Le nom d'affichage est requis";
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "La bio ne peut pas dépasser 500 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      onComplete(formData);
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue ! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            Complétez votre profil pour commencer à utiliser la plateforme.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo de profil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil (optionnel)
              </label>
              <FileUpload
                onFileUpload={(url) => handleInputChange("profilePicture", url)}
                currentImage={formData.profilePicture}
                disabled={isLoading}
              />
            </div>

            {/* Nom d'utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur *
              </label>
              <input
                type="text"
                placeholder="@votre_username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Nom d'affichage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'affichage *
              </label>
              <input
                type="text"
                placeholder="Votre nom complet"
                value={formData.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.displayName ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (optionnel)
              </label>
              <textarea
                placeholder="Parlez-nous de vous..."
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.bio ? "border-red-500" : "border-gray-300"
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.bio && (
                  <p className="text-sm text-red-600">{errors.bio}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.bio.length}/500
                </p>
              </div>
            </div>

            {/* Wallet connecté */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700">Wallet connecté</p>
              <p className="text-sm text-gray-500 truncate">
                {user?.wallet?.address}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Création du profil..." : "Créer mon profil"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
