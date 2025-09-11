# Smart Contract Testing Suite

This directory contains comprehensive tests for the NFT Collection & Bonding Token Ecosystem. The tests are designed to validate every aspect of the system, from individual contract functions to complete end-to-end workflows.

## Test Structure

### 📁 Test Files

| File | Description | Coverage |
|------|-------------|----------|
| `BondingCurveMath.test.js` | Tests mathematical functions for linear bonding curves | Library functions, edge cases, precision |
| `NFTSystem.test.js` | Tests NFT Factory and Collection contracts | Creation, minting, revenue tracking |
| `BondingSystem.test.js` | Tests ERC20 Factory and Bonding Token contracts | Token creation, buy/sell operations, curve pricing |
| `StakingSystem.test.js` | Tests Staking Factory and Pool contracts | Staking, unstaking, reward distribution |
| `Integration.test.js` | End-to-end system workflow tests | Complete user journeys, economic scenarios |

### 📁 Helper Files

| File | Description |
|------|-------------|
| `helpers/TestHelpers.js` | Utility functions for test setup and common operations |
| `TestRunner.js` | Automated test runner with comprehensive reporting |

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Or using the test runner directly
node test/TestRunner.js

# Run individual test suites
npx hardhat test test/BondingCurveMath.test.js
npx hardhat test test/NFTSystem.test.js
npx hardhat test test/BondingSystem.test.js
npx hardhat test test/StakingSystem.test.js
npx hardhat test test/Integration.test.js
```

### Advanced Options

```bash
# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run tests on specific network
npx hardhat test --network localhost

# Run tests with coverage
npx hardhat coverage

# Run specific test pattern
npx hardhat test --grep "should buy tokens"
```

## Test Categories

### 🧮 Mathematical Tests (`BondingCurveMath.test.js`)

Tests the core mathematical functions that power the bonding curve:

- **Parameter Validation**: Ensures invalid parameters are rejected
- **Price Calculations**: Verifies linear bonding curve formula
- **Buy Cost Calculations**: Tests cost calculations for token purchases
- **Sell Refund Calculations**: Tests refund calculations for token sales
- **Token-Reserve Conversions**: Tests bidirectional conversion functions
- **Buy/Sell Symmetry**: Ensures mathematical consistency

```javascript
describe("Current Price Calculation", function() {
    it("Should calculate correct price at zero supply", async function() {
        const price = await mathTester.getCurrentPrice(0, basePrice, slope);
        expect(price).to.equal(basePrice);
    });
});
```

### 🖼️ NFT System Tests (`NFTSystem.test.js`)

Tests NFT collection creation and management:

- **Factory Deployment**: Contract initialization and configuration
- **Collection Creation**: NFT collection deployment with custom parameters
- **Minting Operations**: NFT minting with payment validation
- **Revenue Tracking**: Revenue accumulation and distribution preparation
- **Access Controls**: Creator-only functions and permissions
- **ERC721 Compliance**: Standard NFT functionality

```javascript
describe("Minting", function() {
    it("Should mint NFTs with correct payment", async function() {
        await collection.connect(user1).mint(user1.address, 2, { 
            value: ethers.parseEther("0.2") 
        });
        expect(await collection.totalSupply()).to.equal(2);
    });
});
```

### 💰 Bonding System Tests (`BondingSystem.test.js`)

Tests ERC20 token creation and bonding curve operations:

- **Token Creation**: Bonding token deployment and initialization
- **Price Discovery**: Dynamic pricing based on supply
- **Buy Operations**: Token purchases with ETH
- **Sell Operations**: Token sales back to curve
- **Slippage Protection**: Min/max amount validations
- **Reserve Management**: ETH balance tracking
- **ERC20 Compliance**: Standard token functionality

```javascript
describe("Buying Tokens", function() {
    it("Should update price after buying", async function() {
        const initialPrice = await token.getCurrentPrice();
        await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
        const newPrice = await token.getCurrentPrice();
        expect(newPrice).to.be.gt(initialPrice);
    });
});
```

### 🥩 Staking System Tests (`StakingSystem.test.js`)

Tests staking pool creation and reward distribution:

- **Pool Creation**: Staking pool deployment and linking
- **Staking Operations**: Token staking and unstaking
- **Reward Distribution**: Proportional reward calculations
- **User Management**: Staker list management
- **Revenue Integration**: NFT mint revenue as rewards
- **Access Controls**: Pool-specific permissions

```javascript
describe("Reward Distribution", function() {
    it("Should distribute rewards proportionally", async function() {
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });
        const earned1 = await stakingPool.earned(user1.address);
        const earned2 = await stakingPool.earned(user2.address);
        expect(earned2).to.be.approximately(earned1 * 2n, ethers.parseEther("0.001"));
    });
});
```

### 🔄 Integration Tests (`Integration.test.js`)

Tests complete system workflows and economic scenarios:

- **Creator Workflow**: Complete setup from NFT to staking
- **User Investment Cycle**: Buy tokens → Stake → Earn rewards
- **Token Trading**: Trading while staking is active
- **Multiple Collections**: Independent collection systems
- **Economic Scenarios**: Profitable and risk scenarios
- **High Volume Testing**: Stress testing with many transactions

```javascript
describe("Complete User Investment & Reward Cycle", function() {
    it("Should complete full investment cycle with rewards", async function() {
        // Users buy bonding tokens at different prices
        // Users stake their tokens
        // NFT minting generates rewards
        // Users claim proportional rewards
        // Verify economic incentives work correctly
    });
});
```

## Test Utilities

### TestHelpers Class

The `TestHelpers` class provides common functionality:

```javascript
// Deploy all contracts
const contracts = await TestHelpers.deployContracts();

// Create NFT collection
const { collection } = await TestHelpers.createNFTCollection(nftFactory, creator);

// Create bonding token
const { token } = await TestHelpers.createBondingToken(erc20Factory, creator, collectionAddress);

// Create staking pool
const { pool } = await TestHelpers.createStakingPool(stakingFactory, creator, tokenAddress);

// Utility functions
TestHelpers.expectAlmostEqual(actual, expected, tolerance);
await TestHelpers.advanceTime(3600); // Advance 1 hour
const balance = await TestHelpers.getBalance(address);
```

### Test Setup Pattern

Each test file follows a consistent setup pattern:

```javascript
describe("Contract Name", function() {
    let contracts, owner, creator, user1, user2, user3;
    let contract1, contract2;

    beforeEach(async function() {
        contracts = await TestHelpers.deployContracts();
        ({ owner, creator, user1, user2, user3 } = contracts);
        
        // Setup specific to this test suite
    });

    describe("Feature Group", function() {
        beforeEach(async function() {
            // Setup specific to this feature group
        });

        it("Should do something specific", async function() {
            // Test implementation
        });
    });
});
```

## Test Coverage

### Functionality Coverage

- ✅ **Contract Deployment**: All contracts deploy correctly
- ✅ **Factory Operations**: Create collections, tokens, and pools
- ✅ **Core Operations**: Mint, buy, sell, stake, unstake
- ✅ **Revenue Flow**: NFT mints → Staking rewards
- ✅ **Access Controls**: Creator permissions and restrictions
- ✅ **Edge Cases**: Zero amounts, maximum values, error conditions
- ✅ **Integration**: Multi-contract workflows

### Economic Coverage

- ✅ **Bonding Curve Math**: Price calculations and symmetry
- ✅ **Reward Distribution**: Proportional staking rewards
- ✅ **Token Economics**: Supply and demand dynamics
- ✅ **Fee Handling**: Creation fees and transaction costs
- ✅ **Slippage Protection**: MEV and sandwich attack prevention

### Security Coverage

- ✅ **Reentrancy Protection**: All state-changing functions
- ✅ **Access Controls**: Role-based permissions
- ✅ **Input Validation**: Parameter checking and bounds
- ✅ **Overflow Protection**: Safe math operations
- ✅ **State Consistency**: Invariant maintenance

## Test Scenarios

### Happy Path Scenarios

1. **Creator Success Story**:
   - Creator deploys NFT collection
   - Creates bonding token with reasonable parameters
   - Sets up staking pool
   - Users buy tokens and stake
   - NFT collection becomes popular
   - Stakers earn rewards proportionally

2. **Early Investor Profits**:
   - User buys tokens when price is low
   - Stakes tokens for rewards
   - More users buy, driving price up
   - NFT mints generate staking rewards
   - User profits from both price appreciation and staking

### Edge Case Scenarios

1. **Zero Supply Operations**:
   - Buying first token at base price
   - Price calculations with zero supply
   - Staking pool with no stakers

2. **Maximum Supply Scenarios**:
   - Attempting to mint beyond max supply
   - Bonding curve at maximum capacity
   - Large token operations

3. **Economic Edge Cases**:
   - Very small purchases/stakes
   - High volume stress testing
   - Declining interest scenarios

### Error Scenarios

1. **Invalid Parameters**:
   - Zero prices, supplies, or amounts
   - Unauthorized access attempts
   - Insufficient balances or allowances

2. **State Conflicts**:
   - Double initialization attempts
   - Operations on non-existent entities
   - Exceeding limits and bounds

## Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Smart Contract Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npx hardhat coverage
```

### Test Commands

```bash
# Full test suite
npm run test:full

# Quick smoke tests
npm run test:quick

# Gas optimization tests
npm run test:gas

# Coverage report
npm run test:coverage
```

## Debugging Tests

### Common Issues

1. **Gas Estimation Failures**:
   ```bash
   # Increase gas limit
   npx hardhat test --gas-limit 12000000
   ```

2. **Timeout Issues**:
   ```javascript
   // Increase timeout in test
   this.timeout(60000); // 60 seconds
   ```

3. **Network Issues**:
   ```bash
   # Reset Hardhat network
   npx hardhat node --reset
   ```

### Test Debugging

```javascript
// Add detailed logging
console.log("Balance:", ethers.formatEther(balance));
console.log("Gas used:", receipt.gasUsed.toString());

// Check contract state
const state = await contract.getState();
console.log("Contract state:", state);

// Verify events
const events = await contract.queryFilter("EventName");
console.log("Events:", events);
```

## Performance Benchmarks

Expected test execution times:

- **BondingCurveMath**: ~5-10 seconds
- **NFTSystem**: ~15-30 seconds  
- **BondingSystem**: ~20-40 seconds
- **StakingSystem**: ~25-45 seconds
- **Integration**: ~30-60 seconds

**Total Suite**: ~2-3 minutes

## Contributing to Tests

### Adding New Tests

1. Follow the established patterns
2. Use descriptive test names
3. Include both positive and negative cases
4. Add appropriate setup and teardown
5. Document complex test scenarios

### Test Quality Guidelines

- **Isolation**: Each test should be independent
- **Clarity**: Test names should describe expected behavior
- **Coverage**: Test both success and failure paths
- **Performance**: Keep tests efficient but thorough
- **Maintenance**: Use helpers to reduce code duplication

The test suite provides comprehensive validation of the entire NFT Collection & Bonding Token Ecosystem, ensuring reliability, security, and correct economic behavior. 