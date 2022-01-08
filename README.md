# Risedle Testnet Arbitrage bot

This bot allows user experience on kovan testnet to run smoothly.

## Get started

Clone the repository:

    git clone git@github.com:risedle/arbitrage-bot.git
    cd arbitrage-bot/

Install the dependencies:

    npm install

Copy `.env.example` to `.env` and modify the values.

## Run

Build the program:

    tsc

Run the program:

    node dist/cron.js

## Deployment

This bot is deployed to [fly.io](https://fly.io/docs/introduction/).

Create new app:

    flyctl launch

Please use name in the toml files.

Set the secret:

    flyctl secrets -c arbitrage-bot-2.toml set ALCHEMY_URL="rpc" WALLET_PRIVATE_KEY="pk" SENTRY_DSN="sentry"

Run the following command to deploy:

    flyctl deploy -c arbitrage-bot-2.toml

## Future improvements

-   Minimizing the number of transactions and maximizing the price movement. For
    example if the price is only less than 1% difference we should buy/sell
    small amount, otherwise we should buy/sell large amount to be able to catch
    up the price.
