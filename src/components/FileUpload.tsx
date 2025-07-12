"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  onFileUpload: (url: string) => void;
  currentImage?: string;
  disabled?: boolean;
}

export default function FileUpload({ onFileUpload, currentImage, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation côté client
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Le fichier est trop volumineux. Taille maximale : 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Créer une preview locale
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Upload le fichier
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'upload");
      }

      const result = await response.json();
      
      // Nettoyer l'URL de preview locale
      URL.revokeObjectURL(localPreview);
      
      // Mettre à jour avec l'URL finale
      setPreviewUrl(result.url);
      onFileUpload(result.url);

    } catch (error) {
      console.error("Erreur upload:", error);
      setError(error instanceof Error ? error.message : "Erreur lors de l'upload");
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setError(null);
    onFileUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Aperçu de la photo de profil"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                disabled={isUploading}
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {!disabled && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Upload...
                </span>
              ) : previewUrl ? (
                "Changer l'image"
              ) : (
                "Choisir une image"
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 text-center">{error}</div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Formats supportés : JPG, PNG, GIF, WebP<br />
        Taille maximale : 5MB
      </div>
    </div>
  );
}
