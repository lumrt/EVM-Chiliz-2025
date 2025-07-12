"use client";
import { usePrivy } from "@privy-io/react-auth";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingModal from "@/components/OnboardingModal";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { 
    isOnboardingComplete, 
    userProfile, 
    isLoading, 
    completeOnboarding, 
    needsOnboarding 
  } = useOnboarding();

  const handleOnboardingComplete = async (profileData: any) => {
    try {
      await completeOnboarding(profileData);
    } catch (error) {
      console.error("Erreur lors de l'onboarding:", error);
      // Vous pouvez ajouter une notification d'erreur ici
    }
  };

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Launch your influencer token on Chiliz
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Turn your community into an economy. Offer exclusive access, interact
            with your fans, and create a new source of income.
          </p>
          <div className="mt-10">
            {ready && !authenticated ? (
              <button
                onClick={login}
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Connect Wallet
              </button>
            ) : null}

            {ready && authenticated && isOnboardingComplete === true ? (
              <div>
                <button
                  onClick={logout}
                  className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Logout
                </button>
                <a
                  href="/dashboard"
                  className="ml-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Go to Dashboard
                </a>
                <div className="mt-4 p-4 bg-white rounded-lg shadow">
                  <p className="text-sm font-medium text-gray-900">
                    Bienvenue, {userProfile?.displayName || userProfile?.username}!
                  </p>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {user?.wallet?.address}
                  </p>
                </div>
              </div>
            ) : null}

            {ready && authenticated && isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Modal d'onboarding */}
      <OnboardingModal
        isOpen={needsOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
