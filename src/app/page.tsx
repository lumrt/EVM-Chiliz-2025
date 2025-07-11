"use client";
import { usePrivy } from "@privy-io/react-auth";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  return (
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
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Connect Wallet
            </button>
          ) : null}

          {ready && authenticated ? (
            <div>
              <button
                onClick={logout}
                className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Logout
              </button>
              <a
                href="/dashboard"
                className="ml-4 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Go to Dashboard
              </a>
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <p className="text-sm font-medium text-gray-900">
                  Connected Wallet
                </p>
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {user?.wallet?.address}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
