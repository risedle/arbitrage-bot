import cron from "node-cron";
import arbitrage from "./arbitrage";
import { ethers } from "ethers";
import { Token } from "@uniswap/sdk-core";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

cron.schedule("*/3 * * * *", async () => {
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

    try {
        await arbitrage(chainID, provider, token0, token1);
    } catch (e) {
        console.error("Failed to run arbitrage:", e);
    }
});
