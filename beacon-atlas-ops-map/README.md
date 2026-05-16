# Beacon Atlas Operations Map

Interactive browser visualization for RustChain bounty #159.

The app renders Beacon Atlas as an operations map with city boundaries, relay/miner/contract nodes, derived properties, valuation heat, heartbeat links, contract links, stale-heartbeat mayday pulses, and click-through detail panels.

## Live Data Sources

The page fetches live HTTPS data directly in the browser:

- `https://rustchain.org/beacon/relay/discover`
- `https://rustchain.org/beacon/api/contracts`
- `https://rustchain.org/api/miners`
- `https://swarmhub.onrender.com/api/v1/agents`
- `https://bottube.ai/api/grazer-github-stats`

For the two Beacon endpoints that currently emit duplicate CORS headers, the browser first uses the same live endpoint through the Codetabs HTTPS JSON mirror. If one source is temporarily unavailable, the interface marks the status as a partial fallback instead of failing blank.

## Features

- Agent nodes from Beacon relay discovery and RustChain miner data.
- City boundaries for eight Beacon Atlas cities.
- Property tiles around each agent with RTC valuation estimates.
- Contract, heartbeat, and mayday connection overlays.
- Filters for city, agent role, property type, and link type.
- Search by agent, city, role, or capability.
- Pan, zoom, hover tooltips, and click details.
- Responsive static HTML/CSS/JS with no build step.

## Run Locally

```bash
python -m http.server 8123
```

Then open `http://127.0.0.1:8123/`.

## Bounty Claim

- Bounty: Scottcjn/rustchain-bounties #159
- Expected payout: 75 RTC
- RTC wallet: `RTC02811ff5e2bb4bb4b95eee44c5429cd9525496e7`

## License

MIT
