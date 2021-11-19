import cron from "node-cron";
import arbitrage from "./arbitrage";
import { ethers } from "ethers";
import { Token } from "@uniswap/sdk-core";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

// Load environment variables
dotenv.config();

// Initialize sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

const task = cron.schedule("*/5 * * * *", async () => {
    // Chains
    const chainID = parseInt(process.env.CHAIN_ID);

    // Initialize provider
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.ALCHEMY_URL
    );

    // Contract addresses
    const token0Address = process.env.TOKEN0_ADDRESS;
    const token0Decimal = parseInt(process.env.TOKEN0_DECIMAL);
    const token1Address = process.env.TOKEN1_ADDRESS;
    const token1Decimal = parseInt(process.env.TOKEN1_DECIMAL);

    // Create tokens
    const token0 = new Token(chainID, token0Address, token0Decimal);
    const token1 = new Token(chainID, token1Address, token1Decimal);

    // Create the wallet
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

    try {
        await arbitrage(token0, token1, wallet);
    } catch (e) {
        console.error("Failed to run arbitrage:", e);
        Sentry.captureException(e);
    }
});

process.on("SIGTERM", () => {
    console.info("SIGTERM signal received.");
    console.log("Stopping cron job ...");
    task.stop();
    console.log("Cronjob stopped ...");
});
