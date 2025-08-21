# Interop Game Demo

This repo contains a smart contract game to test sending and verifying interop messages in smart contracts.
There are two main contracts: `Game` and `GameAggregator`.

The game contract has one public function: `incrementScore`.
This function increments the player's high score.
If that high score is higher than the global `highestScore`,
the global `highestScore` is updated, and an interop message is broadcast of the player's address and the new `highestScore`.

The game aggregator contract's main function is `proveScore`.
A player from any chain can submit a message broadcast from one of the approved game contracts set in the constructor function.
The contract tracks the highest score for each chain,
the global highest score for all chains,
and the chain ID where the global highest score comes from.

## Running Locally

### Setup a ZKsync Ecosystem

Setup an ecosystem with gateway and two chains with EVM emulator mode enabled.
Migrate both chains to gateway, run the servers, and bridge test funds to both chains.
See the [`interop-test`](https://github.com/sarahschwartz/interop-test) repo for more details.

### Update the Chain URLs

Update the chain RPC URLs in `hardhat.config.ts`.

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

Deploy the Game contract:

```bash
bun deploy:game
```

### Deploy the Game Aggregator

Update the approved chain IDs and game contracts in the `scripts/deploy-aggregator.ts` file.

Then deploy the Game aggregator contract:

```bash
bun deploy:aggregator
```

### Running the test

In `scripts/interop-test.ts` update the deployed contract addresses.

Then test that everything works by running the script:

```bash
bun interop
```

### Running the frontend

Move out of the `contracts` folder and into the `frontend` folder.
Then install the dependencies:

```bash
cd ../frontend
bun install
```

Run the frontend:

```bash
bun dev
```

Open the frontend at [`http://localhost:5173/`](http://localhost:5173/).
