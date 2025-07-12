"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useToast } from "@/components/Toast";

interface UserProfile {
  id: string;
  email: string;
  wallet: string;
  username: string;
  profilePicture?: string;
  bio?: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  profilePicture?: string;
}

export function useOnboarding() {
  const { ready, authenticated, user } = usePrivy();
  const { addToast } = useToast();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur existe dans la base de données
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      checkUserProfile();
    }
  }, [ready, authenticated, user?.wallet?.address]);

  const checkUserProfile = async () => {
    if (!user?.wallet?.address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/profile?wallet=${user.wallet.address}`);
      
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
        setIsOnboardingComplete(true);
      } else if (response.status === 404) {
        // L'utilisateur n'existe pas encore, onboarding nécessaire
        setIsOnboardingComplete(false);
      } else {
        console.error("Erreur lors de la vérification du profil");
        addToast("Erreur lors de la vérification du profil", "error");
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du profil:", error);
      addToast("Erreur de connexion", "error");
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (profileData: ProfileData) => {
    if (!user?.wallet?.address || !user?.email?.address) {
      throw new Error("Informations utilisateur manquantes");
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email.address,
          wallet: user.wallet.address,
          username: profileData.username,
          displayName: profileData.displayName,
          bio: profileData.bio,
          profilePicture: profileData.profilePicture,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création du profil");
      }

      const newProfile = await response.json();
      setUserProfile(newProfile);
      setIsOnboardingComplete(true);
      addToast("Profil créé avec succès ! Bienvenue ! 🎉", "success");
      
      return newProfile;
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
      addToast(error instanceof Error ? error.message : "Erreur lors de la création du profil", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOnboardingComplete,
    userProfile,
    isLoading,
    completeOnboarding,
    needsOnboarding: ready && authenticated && isOnboardingComplete === false,
  };
}
