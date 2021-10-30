# Risedle Testnet Arbitrage bot

This bot allows user experience on kovan testnet to run smoothly.

This bot is deployed on the
[Cloudflare Workers](https://developers.cloudflare.com/workers/).

## Get started

Clone the repository:

    git clone git@github.com:risedle/arbitrage-bot.git
    cd arbitrage-bot/

Install the dependencies:

    npm install

Setup wrangler:

    npx wrangler login

## Deployment

Build the worker:

    npm run worker:build

Deploy the worker:

    npm run worker:deploy
