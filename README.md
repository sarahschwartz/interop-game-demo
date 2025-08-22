# Interop Game Demo

This repo contains a smart contract game to test sending and verifying interop messages in smart contracts.
There are two main contracts: `Game` and `GameLeaderboard`.

The game contract has one public function: `incrementScore`.
This function increments the player's high score.
If that high score is higher than the global `highestScore`,
the global `highestScore` is updated, and an interop message is broadcast of the player's address and the new `highestScore`.

The game leaderboard contract's main function is `proveScore`.
A player from any chain can submit a message broadcast from one of the approved game contracts set in the constructor function.
The contract tracks the highest score for each chain,
the global highest score for all chains,
and the chain ID where the global highest score comes from.

## Running Locally

This guide assumes you already have `zkstackup` and the required system dependencies installed as detailed in the [ZKsync Chains quickstart](https://docs.zksync.io/zk-stack/running/quickstart).

## Setting Up the Ecosystem and Chains

### Install the latest version of `zkstack` CLI

```bash
zkstackup
```

### Update `zksync-foundry`

Update foundry-zksync to use the version from commit `27360d4c8`:

```bash
foundryup-zksync -C 27360d4c8
```

### Create a new ecosystem

Before starting the containers, make sure Docker is already running.

```bash
zkstack ecosystem create
```

For the prompts:

- You can name your ecosystem anything.
- In these instructions we will assume the chain name is `zk_chain_1`, but you can name your chain anything - just make sure to update the commands later on.
- For the chain ID, instead of the default use a different random 4-5 digit number. This is so when we add the chain to metamsk later on to test the frontend, the chain ID doesn't collide with an existing chain.
- Select yes to enable the EVM Emulator.
- You can select the default prompt options for the remaining prompts.

### Initialize the Ecosystem and Your First Chain

Move into your ecosystem folder and initialize the ecosystem and your first chain:

```bash
cd <YOUR_ECOSYSTEM>
zkstack ecosystem init --dev
```

### Create & Init a Second Chain

You can change the name and chain ID if you want.

```bash
zkstack chain create \
    --chain-name zk_chain_2 \
    --chain-id 5328 \
    --prover-mode no-proofs \
    --wallet-creation localhost \
    --l1-batch-commit-data-generator-mode rollup \
    --base-token-address 0x0000000000000000000000000000000000000001 \
    --base-token-price-nominator 1 \
    --base-token-price-denominator 1 \
    --set-as-default false \
    --evm-emulator true \
    --ignore-prerequisites --update-submodules false 
```

```bash
zkstack chain init \
    --deploy-paymaster \
    --l1-rpc-url=http://localhost:8545 \
    --chain zk_chain_2 \
    --update-submodules false
```

Select the default options for the prompts.

### Create & Init a Third Chain

```bash
zkstack chain create \
    --chain-name zk_chain_3 \
    --chain-id 9313 \
    --prover-mode no-proofs \
    --wallet-creation localhost \
    --l1-batch-commit-data-generator-mode rollup \
    --base-token-address 0x0000000000000000000000000000000000000001 \
    --base-token-price-nominator 1 \
    --base-token-price-denominator 1 \
    --set-as-default false \
    --evm-emulator true \
    --ignore-prerequisites --update-submodules false 
```

```bash
zkstack chain init \
    --deploy-paymaster \
    --l1-rpc-url=http://localhost:8545 \
    --chain zk_chain_3 \
    --update-submodules false
```

### Create & Init Gateway Chain

Now that we have three chains to test our game,
we just need to add one more chain to act as the ZKsync Gateway.

```bash
zkstack chain create \
    --chain-name gateway \
    --chain-id 506 \
    --prover-mode no-proofs \
    --wallet-creation localhost \
    --l1-batch-commit-data-generator-mode rollup \
    --base-token-address 0x0000000000000000000000000000000000000001 \
    --base-token-price-nominator 1 \
    --base-token-price-denominator 1 \
    --set-as-default false \
    --evm-emulator false \
    --ignore-prerequisites --update-submodules false 
```

```bash
zkstack chain init \
    --deploy-paymaster \
    --l1-rpc-url=http://localhost:8545 \
    --chain gateway \
    --update-submodules false
```

### Convert gateway chain to gateway mode

```bash
zkstack chain gateway convert-to-gateway --chain gateway --ignore-prerequisites
```

### Start the gateway server

```bash
zkstack server --ignore-prerequisites --chain gateway
```

### Migrate the Chains to Gateway

Open a new terminal in the ecosystem folder so the gateway server keeps running, and run the commands below to migrate the other chains to use gateway:

```bash
zkstack chain gateway migrate-to-gateway --chain zk_chain_1 --gateway-chain-name gateway --ignore-prerequisites
```

```bash
zkstack chain gateway migrate-to-gateway --chain zk_chain_2 --gateway-chain-name gateway --ignore-prerequisites
```

```bash
zkstack chain gateway migrate-to-gateway --chain zk_chain_3 --gateway-chain-name gateway --ignore-prerequisites
```

### Start the Other Chain Servers

Start the first server:

```bash
zkstack server --ignore-prerequisites --chain zk_chain_1
```

Open a new terminal in the ecosystem folder and start the second chain's server:

```bash
zkstack server --ignore-prerequisites --chain zk_chain_2
```

Do the same for the third chain:

```bash
zkstack server --ignore-prerequisites --chain zk_chain_3
```

### Bridge funds to each chain

Use a pre-configured rich wallet to bridge some ETH to each chain except for gateway.
Double check the RPC endpoints for the chains inside `<YOUR_ECOSYSTEM_FOLDER>/zksync-era/chains/<CHAIN_NAME>/configs/general.yaml` and `<YOUR_ECOSYSTEM_FOLDER>/zksync-era/chains/era/configs/general.yaml` under `api.web3_json_rpc.http_url`.
The commands below assumes the chains are running at ports `3050`, `3150`, and `3250`. The amount bridged here is arbitrary.
Open a new terminal to run the commands.

```bash
npx zksync-cli bridge deposit --rpc=http://localhost:3050 --l1-rpc=http://localhost:8545 --amount 10 --to 0x36615Cf349d7F6344891B1e7CA7C72883F5dc049 --pk 0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110
```

```bash
npx zksync-cli bridge deposit --rpc=http://localhost:3150 --l1-rpc=http://localhost:8545 --amount 10 --to 0x36615Cf349d7F6344891B1e7CA7C72883F5dc049 --pk 0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110
```

```bash
npx zksync-cli bridge deposit --rpc=http://localhost:3250 --l1-rpc=http://localhost:8545 --amount 10 --to 0x36615Cf349d7F6344891B1e7CA7C72883F5dc049 --pk 0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110
```

## Deploying the Contracts

### Update the Chain Details in the Hardhat Config

Check the chain RPC URLs and chain IDs in `contracts/hardhat.config.ts` to make sure they match what's in your chain config files.
Use the first chain to be the leaderboard chain, and use the other 2 to be the game chains.

### Move into the `contracts` folder

```bash
cd contracts
```

### Install the Dependencies

```bash
bun install
```

### Compile and Deploy the Game contract

Compile:

```bash
bun compile
```

Deploy the Game contract to each game chain:

```bash
bun deploy:game --network gameChain1
bun deploy:game --network gameChain2
```

### Deploy the Game Leaderboard

Update the approved game contract addresses in the `utils/deployedContracts.ts` file.

Then deploy the Game leaderboard contract:

```bash
bun deploy:leaderboard
```

### Running the test

In `scripts/interop-test.ts` update the deployed leaderboard address.

Then test that everything works by running the script:

```bash
bun interop
```

You should see the winning chain switch from the ID of the first game chain to the ID of the second game chain.

## Running the frontend

Move out of the `contracts` folder and into the `frontend` folder.
Then install the dependencies:

```bash
cd ../frontend
bun install
```

### Edit the Chain and Contract Info

In `frontend/utils/constants.ts` edit the values as needed.
In `frontend/utils/wagmi.ts` edit the chain configurations with the correct RPC endpoints and chain IDs.

### Run the frontend

Run the frontend:

```bash
bun dev
```

### Testing the frontend

Open the frontend at [`http://localhost:5173/`](http://localhost:5173/).

In your browser wallet import the account that we used for testing.
The private key for this can be found in any of the `contracts/scripts` files.

On the frontend, you should be able to add each network to your wallet by clicking on them.

Now you can test the game with the frontend.
On a game chain, increment your score, then copy your transaction ID.
On the leaderboard chain, input the transaction ID and your score, then submit them to prove the score on the leaderboard chain.
