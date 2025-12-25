# Technology Roadmap

## Current State: Web2 Platform ✅ DEPLOYED (December 2024)

### Architecture Overview

**Frontend:**
- React 19.2 + TypeScript + Vite 6.2
- Tailwind CSS for styling
- React Router DOM v7 (client-side routing)
- Recharts for admin analytics

**Backend:**
- Supabase (managed PostgreSQL + Auth + Real-time subscriptions)
- No custom API server (direct client-to-Supabase)

**AI/ML:**
- Google Gemini 2.5-flash
  - Vehicle description generation
  - Financial performance analysis
  - Markdown output rendering

**External APIs:**
- NHTSA VPIC (VIN decoding)
- EmailJS (contact form notifications)
- Google Sheets (CSV vehicle data import)

**Hosting:**
- DokPloy deployment on VPS (178.156.146.106)
- Docker Swarm orchestration
- Nginx reverse proxy
- Let's Encrypt SSL
- Traefik routing

**Domain:** [In configuration - Namecheap]

---

### Current Features

**Public Pages:**
1. Home (`/`) - Hero, featured vehicles, mission statement
2. Inventory (`/inventory`) - Vehicle listings with filters
3. VIN Lookup (`/vin-lookup`) - NHTSA API integration
4. Contact (`/contact`) - Lead capture form
5. About, Mission, Team pages

**Admin Dashboard (`/admin`):**
1. **Inventory Management:**
   - Add/edit/delete vehicles
   - Upload images (stored in Supabase storage)
   - Set pricing, status (Available, Pending, Sold)
   - View diagnostics (JSONB data)

2. **Lead Management:**
   - View all customer inquiries
   - Track status (New, Contacted, Closed)
   - Contact info, interest level

3. **Financial Analytics:**
   - Total inventory value
   - Profit per vehicle (cost vs. sold price)
   - AI-generated financial reports (Gemini)

4. **Google Sheets Sync:**
   - Import vehicles from published CSV
   - Auto-update via VIN matching

---

### Database Schema (Supabase)

**Tables:**
```sql
profiles
  - id, email, is_admin, created_at, last_login
  - Linked to auth.users

vehicles
  - id, vin, make, model, year, price, mileage, status
  - cost, cost_towing, cost_mechanical, cost_cosmetic, cost_other
  - sold_price, sold_date
  - description, image_url, gallery (JSONB), diagnostics (JSONB)
  - registration_status, registration_due_date, date_added

leads
  - id, name, email, phone, interest, status, date
```

**Row-Level Security (RLS):**
- Public: Read vehicles where status = 'Available'
- Public: Insert leads
- Admins: Full CRUD on vehicles, leads

---

## Future State: Web2/Web3 Hybrid

### Phase 1: Infrastructure Setup (Months 1-3)

**Goal:** Prepare backend for blockchain operations without disrupting current Web2 functionality

**New Components:**

1. **Backend API Server (Node.js + Express)**
   - Rationale: Need server-side logic for blockchain operations
   - Features:
     - Smart contract interactions
     - Private key management
     - Transaction signing
     - IPFS uploads
   - Tech Stack: TypeScript, ethers.js v6, Express, Socket.io

2. **Redis Cache**
   - Purpose: Cache blockchain data (reduce RPC calls)
   - Use cases:
     - NFT metadata cache
     - Transaction status
     - Gas price estimates
   - Docker container: `redis:7-alpine`

3. **Blockchain Worker**
   - Background process for event monitoring
   - Listens to smart contract events:
     - `VehicleTokenized` → update database
     - `SharePurchased` → notify investor
     - `PaymentReceived` → release escrow
   - Uses Bull/BullMQ for job queue

4. **IPFS Integration (Pinata)**
   - Store NFT metadata (JSON files)
   - Store vehicle certificate images
   - High-resolution photos (immutable record)

**Infrastructure Costs:**
- VPS upgrade: $50/month (4vCPU, 8GB RAM)
- Alchemy (RPC provider): $0 (free tier), then $50-200/month
- Pinata (IPFS): $0 (free tier), then $20/month
- **Total: $70-270/month** (scales with usage)

---

### Phase 2: NFT Certificates (Months 4-6)

**Goal:** Launch blockchain-verified ownership certificates for sold vehicles

**Smart Contracts:**

1. **VehicleNFT.sol (ERC-1155)**
```solidity
// Why ERC-1155: Supports both unique NFTs AND fractional shares
contract VehicleNFT is ERC1155, Ownable, Pausable {
  // Mint unique vehicle token (tokenId = VIN hash)
  function mintVehicleCertificate(address buyer, string memory VIN)
    external onlyOwner returns (uint256)

  // Metadata URI pointing to IPFS
  function uri(uint256 tokenId)
    override returns (string memory)
}
```

2. **NFT Metadata (IPFS)**
```json
{
  "name": "2020 BMW X5 xDrive40i - Ownership Certificate",
  "description": "Blockchain-verified certificate...",
  "image": "ipfs://QmX.../vehicle-photo.jpg",
  "attributes": [
    {"trait_type": "VIN", "value": "WBAJW7C57LWZ12345"},
    {"trait_type": "Make", "value": "BMW"},
    {"trait_type": "Model", "value": "X5"},
    {"trait_type": "Year", "value": 2020},
    {"trait_type": "Mileage", "value": 42000},
    {"trait_type": "Sold Date", "value": "2025-03-15"},
    {"trait_type": "Seller", "value": "Triple J Auto Investment"}
  ]
}
```

**User Flow:**
1. Customer buys vehicle (traditional payment)
2. Admin clicks "Mint NFT Certificate" in dashboard
3. Backend uploads metadata to IPFS
4. Smart contract mints NFT to customer's wallet
5. Customer receives email with OpenSea link

**Marketing:**
- PR campaign: "First Houston dealership on blockchain"
- Social media: Show NFT certificate in MetaMask
- Customer testimonial: "My car is on the blockchain!"

---

### Phase 3: Fractional Ownership (Months 7-12)

**Goal:** Tokenize high-value vehicles into investable shares

**Smart Contracts:**

1. **FractionalOwnership.sol**
```solidity
contract FractionalOwnership is Ownable, Pausable {
  struct TokenizedVehicle {
    uint256 vehicleId;
    uint256 totalShares;
    uint256 sharesSold;
    uint256 pricePerShare;
    address[] investors;
  }

  function tokenizeVehicle(
    uint256 vehicleId,
    uint256 totalShares,
    uint256 pricePerShare
  ) external onlyOwner

  function purchaseShares(uint256 vehicleId, uint256 quantity)
    external payable

  function distributeProfit(uint256 vehicleId)
    external onlyOwner // When vehicle sells
}
```

2. **VehicleEscrow.sol**
```solidity
contract VehicleEscrow {
  // Hold crypto payments until delivery
  function createEscrow(
    uint256 vehicleId,
    address buyer,
    uint256 amount
  ) external payable

  function releaseEscrow(uint256 escrowId)
    external onlyOwner // After delivery confirmed

  function refund(uint256 escrowId)
    external // If deal falls through
}
```

**User Flow (Investor):**
1. Browse "Investment Opportunities" page
2. Select vehicle (e.g., "2021 Porsche 911 - 1000 shares @ $90 each")
3. Connect wallet (MetaMask via RainbowKit)
4. Purchase shares (pay in USDC)
5. Receive share tokens in wallet
6. Track ROI in investor dashboard

**User Flow (Admin):**
1. Select vehicle to tokenize
2. Set total shares (e.g., 1000) and price ($90)
3. Deploy shares on blockchain
4. Monitor share sales in real-time
5. When vehicle sells, distribute profit to token holders

**Database Changes:**
```sql
-- See business-plan for full schema
CREATE TABLE tokenized_vehicles (
  vehicle_id UUID REFERENCES vehicles(id),
  contract_address TEXT,
  token_id BIGINT,
  total_shares INTEGER,
  shares_sold INTEGER,
  ...
)

CREATE TABLE ownership_shares (
  tokenized_vehicle_id UUID,
  wallet_address TEXT,
  shares_owned INTEGER,
  purchase_price DECIMAL(18, 8),
  ...
)
```

---

### Phase 4: Advanced Features (Year 2+)

**1. Crypto Payments**
- Accept ETH, USDC, USDT for vehicle purchases
- Smart contract escrow (safer than traditional wire)
- Instant settlement (no bank delays)

**2. Share Trading Marketplace**
- Secondary market for fractional shares
- 2% platform fee on trades
- Automated market maker (AMM) for liquidity

**3. Investor Dashboard**
- Portfolio tracking (all vehicles, total ROI)
- Real-time share prices
- Profit distribution history
- Tax reporting (1099 forms)

**4. DAO Governance (Experimental)**
- Token holders vote on major decisions:
  - When to sell vehicle (maximize appreciation)
  - Which vehicles to tokenize next
  - Platform fee adjustments

---

## Blockchain Selection

### Chosen Network: Base (Ethereum Layer 2)

**Why Base?**
- Ultra-low gas fees: $0.01-0.10 per transaction
- 2-second finality (fast user experience)
- EVM-compatible (use Solidity, ethers.js)
- Backed by Coinbase (institutional trust)
- US-friendly regulatory environment

**Alternatives Considered:**
- Ethereum Mainnet: ❌ Too expensive ($5-50 gas fees)
- Polygon: ✅ Good option, slightly slower than Base
- Solana: ❌ Different programming model (Rust), less mature tooling
- Arbitrum: ✅ Good option, but Base has better growth

**Testnet:** Base Sepolia (Chain ID: 84532)
**Mainnet:** Base (Chain ID: 8453)

---

## Security Measures

### Smart Contract Security

**Pre-Deployment:**
1. OpenZeppelin base contracts (battle-tested)
2. 100% test coverage (Hardhat + Chai)
3. Slither static analysis (0 high/medium issues)
4. 2-4 weeks testnet deployment (catch edge cases)
5. Professional audit (Hacken or CertiK: $5k-15k)

**Post-Deployment:**
6. Verify contracts on Basescan (open source)
7. Multi-sig wallet for admin functions (Gnosis Safe)
8. Emergency pause function (circuit breaker)
9. Bug bounty program ($500-2k rewards)

### Private Key Management

**Phase 1-2 (MVP):**
- Encrypted env variables in DokPloy
- Decrypt at runtime, store in memory only
- Never log keys

**Phase 3-4 (Production):**
- AWS KMS or Google Cloud KMS ($1/month)
- Hardware wallet (Ledger) for manual ops
- Key rotation every 90 days

---

## Technology Costs (3-Year)

| Service | Year 1 | Year 2 | Year 3 |
|---------|--------|--------|--------|
| **Hosting (VPS)** | $600 | $1,800 | $3,000 |
| **Supabase** | $0 | $300 | $300 |
| **Blockchain (Alchemy)** | $0 | $600 | $1,200 |
| **IPFS (Pinata)** | $0 | $240 | $600 |
| **Monitoring (Sentry)** | $0 | $180 | $180 |
| **Smart Contract Audit** | $0 | $10,000 | $0 (amortized) |
| **Domain/SSL** | $12 | $12 | $12 |
| **Total** | $612 | $13,132 | $5,292 |

**ROI Justification:**
- Year 2 audit cost ($10k) is offset by NFT revenue ($4,800) + PR value
- Year 3 blockchain costs ($5,292) enable $15k fractional ownership fees
- Tech spending is 0.2% of Year 3 revenue ($3.26M)

---

## Conclusion

Our technology roadmap balances:
1. **Proven Web2 foundation** (React, Supabase) - launched and operational
2. **Incremental Web3 adoption** - no "big bang" risk
3. **Cost efficiency** - start with free tiers, scale as revenue grows
4. **Future-proofing** - Base blockchain choice supports years of growth

**Key Milestones:**
- ✅ **Q4 2024:** Web2 platform deployed
- **Q1 2025:** Backend API + blockchain infrastructure
- **Q2 2025:** First NFT certificates minted
- **Q3-Q4 2025:** Fractional ownership pilot (10 vehicles)
- **2026:** Scale to 50 tokenized vehicles, secondary marketplace

---

**Last Updated:** December 24, 2024
