import fetch from "node-fetch";
import { ethers, Contract, providers } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";

// Uniswap V3 contract interface
import { abi as UniswapV3FactoryABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";
import { abi as UniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

// Get the latest token price from coingecko
async function getUSDPriceFromCoinGecko(id: string): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=USD`;
    const response = await fetch(url);
    const coingeckoData = await response.json();
    return coingeckoData[id]["usd"];
}

// Get the latest token price from uniswap
async function getUSDPriceFromUniswapV3(
    provider: ethers.providers.Provider,
    token0: Token,
    token1: Token
): Promise<number> {
    // Create the Uniswap V3 factory contract
    const uniswapV3FactoryContractAddress =
        "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    const uniswapV3FactoryContract = new Contract(
        uniswapV3FactoryContractAddress,
        UniswapV3FactoryABI,
        provider
    );

    // Get the pool address
    const poolAddress = await uniswapV3FactoryContract.getPool(
        token0.address,
        token1.address,
        500
    );

    // Create the pool contract
    const uniswapV3PoolContract = new Contract(
        poolAddress,
        UniswapV3PoolABI,
        provider
    );
    const [liquidity, slot0] = await Promise.all([
        uniswapV3PoolContract.liquidity(),
        uniswapV3PoolContract.slot0(),
    ]);
    const sqrtPriceX96 = slot0[0];
    const tick = slot0[1];

    // Create Uniswap V3 Pool instance
    const pool = new Pool(
        token0,
        token1,
        500,
        sqrtPriceX96.toString(),
        liquidity.toString(),
        tick
    );

    // Get the price
    const token1Price = pool.token1Price.toFixed(2);
    return parseFloat(token1Price);
}

async function arbitrage(
    chainID: number,
    provider: providers.Provider,
    token0: Token,
    token1: Token
): Promise<void> {
    // Get the coingecko price
    const coingeckoPrice = await getUSDPriceFromCoinGecko("ethereum");
    console.log("Coingecko price =", coingeckoPrice);

    const uniswapPrice = await getUSDPriceFromUniswapV3(
        provider,
        token0,
        token1
    );
    console.log("Uniswap price = ", uniswapPrice);

    // Arbitrage the pool
}

export default arbitrage;
