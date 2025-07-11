# Chilliz Influencer Token Platform

This project is a platform that allows influencers to launch their own fan tokens on the Chiliz blockchain. It provides jejich communities with exclusive access to content and the ability to actively participate in their journey, turning the fan-influencer relationship into an interactive and rewarding experience for everyone.

## Features

-   **User Authentication**: Users can connect to the platform using their wallet via Privy.
-   **Influencer Dashboard**: Connected users can access a dashboard to create their own token.
-   **Secure API**: A server-side API route receives the token creation request but uses a secure "operator" wallet to pay for gas fees, so users don't have to spend their own funds to deploy.
-   **On-Chain Deployment**: The API calls a `TokenFactory` smart contract deployed on the Chiliz Spicy Testnet.
-   **Token Creation**: The `TokenFactory` deploys a new, standard ERC20 token contract.
-   **Ownership**: The influencer who made the request is set as the owner of the new token contract, giving them full control.
-   **User Feedback**: The interface displays a success message with the new contract address and a link to the block explorer to verify the transaction.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [pnpm](https://pnpm.io/)
-   A crypto wallet (like MetaMask) with a private key for testing.

### 2. Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project by copying the example below.

    ```bash
    # Get this from your Privy dashboard
    NEXT_PUBLIC_PRIVY_APP_ID="discord"

    # A private key from a test wallet you control (must start with 0x)
    OPERATOR_PRIVATE_KEY="YOUR_TEST_WALLET_PRIVATE_KEY"

    # This will be filled in after deploying the contract
    NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS="0x340653DD1fe8BcBfE518c544b9a83bCB2d600AD5"
    ```

### 3. Deploy the Smart Contract

1.  **Fund your operator wallet:**
    Get some test CHZ for the Chiliz Spicy Testnet from the [official faucet](https://spicy-faucet.chiliz.com/) and send it to the address corresponding to your `OPERATOR_PRIVATE_KEY`.

2.  **Run the deployment script:**
    This command deploys the `TokenFactory.sol` contract to the Chiliz Spicy Testnet.
    ```bash
    pnpm hardhat run scripts/deploy-factory.ts --network chilizSpicy
    ```

3.  **Update your environment file:**
    After the script succeeds, it will print a contract address to the console. Copy this address and paste it into your `.env.local` file for the `NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS` variable.

    ```diff
    - NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=""
    + NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS="0x...your...deployed...contract...address"
    ```

### 4. Run the Application

Now you can start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can now test the full flow: connect your wallet, go to the dashboard, and launch your first token!

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
