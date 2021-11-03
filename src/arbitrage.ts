import fetch from "node-fetch";
import { ethers, Contract, Wallet, BigNumber } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";

// Uniswap V3 contract interface
import { abi as UniswapV3FactoryABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json";
import { abi as UniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as UniswapV3SwapRouterABI } from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";
// Get the latest token price from coingecko
async function getUSDPriceFromCoinGecko(id: string): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=USD`;
    const response = await fetch(url);
    const coingeckoData = await response.json();
    return coingeckoData[id]["usd"];
}

// Get the pool
async function getPool(
    provider: ethers.providers.Provider,
    token0: Token,
    token1: Token
): Promise<Pool> {
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
    return pool;
}

// Get the latest token price from uniswap
async function getUSDPriceFromUniswapV3(pool: Pool): Promise<number> {
    // Get the price
    const token1Price = pool.token1Price.toFixed(2);
    return parseFloat(token1Price);
}

const ERC20ABI = [
    // Read only
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",

    // Write
    "function approve(address spender, uint256 amount) external",

    // Events
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
];

// Swap exact amount of input
async function swapExactInput(
    tokenIn: Token,
    amountIn: BigNumber,
    tokenOut: Token,
    wallet: Wallet
): Promise<void> {
    // Create call params
    console.log("wallet.address", wallet.address);
    const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

    // Approve contract to spend the tokenIn
    const tokenInContract = new Contract(tokenIn.address, ERC20ABI, wallet);
    console.log("Approving 0 ....");
    const txApprove1 = await tokenInContract.approve(swapRouterAddress, 0);
    console.log("txApprove1", txApprove1.hash);
    await txApprove1.wait();

    console.log(`Approving ${amountIn} ....`);
    const txApprove2 = await tokenInContract.approve(
        swapRouterAddress,
        amountIn
    );
    console.log("txApprove2", txApprove2.hash);
    await txApprove2.wait();

    // Execute the swap
    const swapRouterContract = new Contract(
        swapRouterAddress,
        UniswapV3SwapRouterABI,
        wallet
    );
    console.log("Swapping ...");
    const swapTx = await swapRouterContract.exactInputSingle(
        {
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            fee: 500,
            recipient: wallet.address,
            deadline: 1635968321,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
        },
        {
            gasLimit: 200000,
            gasPrice: 2500000000,
        }
    );
    console.log("swapTx", swapTx.hash);
    await swapTx.wait();
}

async function arbitrage(
    token0: Token,
    token1: Token,
    wallet: Wallet
): Promise<void> {
    // Get the coingecko price
    const coingeckoPrice = await getUSDPriceFromCoinGecko("ethereum");
    console.log("Coingecko price =", coingeckoPrice);

    // Get the uniswap pool
    const pool = await getPool(wallet.provider, token0, token1);

    const uniswapPrice = await getUSDPriceFromUniswapV3(pool);
    console.log("Uniswap price = ", uniswapPrice);

    // Arbitrage the pool
    if (coingeckoPrice > uniswapPrice) {
        // Then it means the pool is to cheap; Swap USDC for more WETH
        const amountIn = ethers.utils.parseUnits(
            (200 * uniswapPrice * 1e6).toFixed(0),
            token0.decimals
        );
        await swapExactInput(token0, amountIn, token1, wallet);
    }
    if (coingeckoPrice < uniswapPrice) {
        // Then it means the pool is to expensive; Swap WETH for more USDC
        const amountIn = ethers.utils.parseUnits("200", token1.decimals);
        await swapExactInput(token1, amountIn, token0, wallet);
    }
}

export default arbitrage;
