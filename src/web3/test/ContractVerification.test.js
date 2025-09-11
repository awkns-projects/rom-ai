const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔍 COMPREHENSIVE CONTRACT VERIFICATION", function () {
  let contracts, owner, creator, user1, user2, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Create test system
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;

    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await collection.getAddress(),
      mockERC20
    );
    token = tokenResult.token;
  });

  describe("🎯 Contract Function Verification", function () {
    it("Should verify contract functions exist and return expected types", async function () {
      console.log("\n=== VERIFYING CONTRACT FUNCTIONS ===");

      // Check that mint function exists and works
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      const mintTx = await token.connect(user1).mint(
        ethers.parseEther("100"), // tokensToMint
        ethers.parseEther("1"),    // maxReserveAmount
        user1.address              // receiver
      );
      const mintReceipt = await mintTx.wait();

      console.log("✅ mint() function: EXISTS and WORKS");
      console.log(`   Gas used: ${mintReceipt.gasUsed.toString()}`);

      // Verify balance was updated
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("100"));
      console.log(`   User balance after mint: ${ethers.formatEther(balance)}`);

      // Check burn function
      const burnTx = await token.connect(user1).burn(
        ethers.parseEther("50"),   // tokensToBurn
        ethers.parseEther("0.01"), // minRefund
        user1.address              // receiver
      );
      const burnReceipt = await burnTx.wait();

      console.log("✅ burn() function: EXISTS and WORKS");
      console.log(`   Gas used: ${burnReceipt.gasUsed.toString()}`);

      const balanceAfterBurn = await token.balanceOf(user1.address);
      expect(balanceAfterBurn).to.equal(ethers.parseEther("50"));
      console.log(`   User balance after burn: ${ethers.formatEther(balanceAfterBurn)}`);
    });

    it("Should verify bonding curve calculation functions", async function () {
      console.log("\n=== VERIFYING BONDING CURVE CALCULATIONS ===");

      // Get current price at zero supply
      const initialPrice = await token.getCurrentPrice();
      console.log(`✅ getCurrentPrice() at zero supply: ${ethers.formatEther(initialPrice)}`);
      expect(initialPrice).to.equal(ethers.parseEther("0.001")); // First step price

      // Test getReserveForTokens
      const [reserveAmount, royalty] = await token.getReserveForTokens(ethers.parseEther("100"));
      console.log(`✅ getReserveForTokens(100): ${ethers.formatEther(reserveAmount)} reserve + ${ethers.formatEther(royalty)} royalty`);

      // Manual calculation: 100 tokens at 0.001 = 0.1, plus 2% royalty = 0.102 total
      const expectedReserve = ethers.parseEther("0.1");
      const expectedRoyalty = ethers.parseEther("0.002");
      expect(reserveAmount).to.equal(expectedReserve);
      expect(royalty).to.equal(expectedRoyalty);

      // Test getRefundForTokens
      const [refundAmount, burnRoyalty] = await token.getRefundForTokens(ethers.parseEther("50"));
      console.log(`✅ getRefundForTokens(50): ${ethers.formatEther(refundAmount)} refund - ${ethers.formatEther(burnRoyalty)} royalty`);

      // Manual calculation: 50 tokens at 0.001 = 0.05, minus 1.5% royalty = 0.04925
      const expectedRefund = ethers.parseEther("0.05");
      const expectedBurnRoyalty = ethers.parseEther("0.00075");
      expect(refundAmount).to.equal(expectedRefund);
      expect(burnRoyalty).to.equal(expectedBurnRoyalty);
    });

    it("Should verify step-based curve transitions", async function () {
      console.log("\n=== VERIFYING STEP TRANSITIONS ===");

      // Check steps configuration
      const stepsLength = await token.getStepsLength();
      expect(stepsLength).to.equal(3);

      for (let i = 0; i < stepsLength; i++) {
        const step = await token.getStep(i);
        console.log(`   Step ${i}: Range to ${ethers.formatEther(step.rangeTo)}, Price: ${ethers.formatEther(step.price)}`);
      }

      // Test price at different supply levels
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));

      // Mint 500 tokens (within first step)
      await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("10"), user1.address);
      const priceAfter500 = await token.getCurrentPrice();
      console.log(`✅ Price after 500 tokens: ${ethers.formatEther(priceAfter500)}`);
      expect(priceAfter500).to.equal(ethers.parseEther("0.001")); // Still in first step

      // Mint 600 more tokens (total 1100, should be in second step)
      await token.connect(user1).mint(ethers.parseEther("600"), ethers.parseEther("10"), user1.address);
      const priceAfter1100 = await token.getCurrentPrice();
      console.log(`✅ Price after 1100 tokens: ${ethers.formatEther(priceAfter1100)}`);
      expect(priceAfter1100).to.equal(ethers.parseEther("0.002")); // Second step price

      const totalSupply = await token.totalSupply();
      console.log(`   Total supply: ${ethers.formatEther(totalSupply)}`);
    });
  });

  describe("🧮 Mathematical Accuracy Verification", function () {
    it("Should verify mint/burn symmetry", async function () {
      console.log("\n=== VERIFYING MINT/BURN SYMMETRY ===");

      const initialReserveBalance = await token.reserveBalance();
      console.log(`Initial reserve balance: ${ethers.formatEther(initialReserveBalance)}`);

      // Mint 200 tokens
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      const [mintCost, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("200"));
      console.log(`Mint cost for 200 tokens: ${ethers.formatEther(mintCost)} + ${ethers.formatEther(mintRoyalty)} royalty`);

      await token.connect(user1).mint(ethers.parseEther("200"), ethers.parseEther("10"), user1.address);

      const reserveAfterMint = await token.reserveBalance();
      console.log(`Reserve after mint: ${ethers.formatEther(reserveAfterMint)}`);

      // Immediately burn the same tokens
      const [burnRefund, burnRoyalty] = await token.getRefundForTokens(ethers.parseEther("200"));
      console.log(`Burn refund for 200 tokens: ${ethers.formatEther(burnRefund)} - ${ethers.formatEther(burnRoyalty)} royalty`);

      await token.connect(user1).burn(ethers.parseEther("200"), ethers.parseEther("0.1"), user1.address);

      const reserveAfterBurn = await token.reserveBalance();
      console.log(`Reserve after burn: ${ethers.formatEther(reserveAfterBurn)}`);

      // The reserve should be back to initial (accounting for royalties)
      expect(reserveAfterBurn).to.equal(initialReserveBalance);
      console.log("✅ Mint/Burn symmetry: CORRECT");
    });

    it("Should verify cross-step calculations", async function () {
      console.log("\n=== VERIFYING CROSS-STEP CALCULATIONS ===");

      // Test minting across step boundaries
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));

      // Mint 1500 tokens (crosses from step 0 to step 1)
      const [crossStepCost, crossStepRoyalty] = await token.getReserveForTokens(ethers.parseEther("1500"));
      console.log(`Cost for 1500 tokens (cross-step): ${ethers.formatEther(crossStepCost)} + ${ethers.formatEther(crossStepRoyalty)} royalty`);

      // Manual calculation:
      // First 1000 tokens at 0.001 = 1.0
      // Next 500 tokens at 0.002 = 1.0
      // Total = 2.0 + 2% royalty = 2.04
      const expectedCost = ethers.parseEther("2.0");
      const expectedRoyalty = ethers.parseEther("0.04");

      expect(crossStepCost).to.equal(expectedCost);
      expect(crossStepRoyalty).to.equal(expectedRoyalty);
      console.log("✅ Cross-step calculation: CORRECT");
    });

    it("Should verify reserve balance tracking", async function () {
      console.log("\n=== VERIFYING RESERVE BALANCE TRACKING ===");

      const initialBalance = await token.reserveBalance();
      console.log(`Initial reserve balance: ${ethers.formatEther(initialBalance)}`);

      // Mint tokens and track reserve changes
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));

      const [mintCost, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("300"));
      await token.connect(user1).mint(ethers.parseEther("300"), ethers.parseEther("10"), user1.address);

      const balanceAfterMint = await token.reserveBalance();
      const expectedBalance = initialBalance + mintCost;

      console.log(`Reserve after mint: ${ethers.formatEther(balanceAfterMint)}`);
      console.log(`Expected balance: ${ethers.formatEther(expectedBalance)}`);

      expect(balanceAfterMint).to.equal(expectedBalance);
      console.log("✅ Reserve balance tracking: CORRECT");
    });
  });

  describe("🔗 Integration Verification", function () {
    it("Should verify complete system integration", async function () {
      console.log("\n=== VERIFYING COMPLETE SYSTEM INTEGRATION ===");

      // 1. NFT mint generates revenue
      await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });
      const nftRevenue = await collection.totalRevenue();
      console.log(`✅ NFT revenue generated: ${ethers.formatEther(nftRevenue)} ETH`);

      // 2. Create staking pool
      const stakingTx = await stakingFactory.connect(creator).createPool(
        await token.getAddress(),
        ethers.ZeroAddress,
        { value: ethers.parseEther("0.01") }
      );
      const stakingReceipt = await stakingTx.wait();
      const stakingEvent = stakingReceipt.logs.find(log => {
        try {
          return stakingFactory.interface.parseLog(log).name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });
      const stakingPoolAddress = stakingFactory.interface.parseLog(stakingEvent).args.pool;
      const StakingPool = await ethers.getContractFactory("StakingPool");
      stakingPool = StakingPool.attach(stakingPoolAddress);

      // 3. Link staking pool to NFT collection
      await collection.connect(creator).setStakingPool(stakingPoolAddress);
      console.log("✅ Staking pool linked to NFT collection");

      // 4. Users mint tokens and stake
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("10"), user1.address);

      await token.connect(user1).approve(stakingPoolAddress, ethers.parseEther("200"));
      await stakingPool.connect(user1).stake(ethers.parseEther("200"));

      const stakedBalance = await stakingPool.stakedBalance(user1.address);
      console.log(`✅ User staked: ${ethers.formatEther(stakedBalance)} tokens`);

      // 5. Generate more NFT revenue
      await collection.connect(user2).mint(user2.address, 1, { value: ethers.parseEther("0.1") });

      // 6. Check rewards
      const earnedRewards = await stakingPool.earned(user1.address);
      console.log(`✅ User earned rewards: ${ethers.formatEther(earnedRewards)} ETH`);
      expect(earnedRewards).to.be.gt(0);

      console.log("✅ Complete system integration: WORKING");
    });

    it("Should verify event emissions", async function () {
      console.log("\n=== VERIFYING EVENT EMISSIONS ===");

      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));

      // Test Mint event
      const mintTx = await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);
      const mintReceipt = await mintTx.wait();

      const mintEvent = mintReceipt.logs.find(log => {
        try {
          const parsed = token.interface.parseLog(log);
          return parsed.name === 'Mint';
        } catch (e) {
          return false;
        }
      });

      expect(mintEvent).to.not.be.undefined;
      console.log("✅ Mint event: EMITTED");

      // Test Burn event
      const burnTx = await token.connect(user1).burn(ethers.parseEther("50"), ethers.parseEther("0.01"), user1.address);
      const burnReceipt = await burnTx.wait();

      const burnEvent = burnReceipt.logs.find(log => {
        try {
          const parsed = token.interface.parseLog(log);
          return parsed.name === 'Burn';
        } catch (e) {
          return false;
        }
      });

      expect(burnEvent).to.not.be.undefined;
      console.log("✅ Burn event: EMITTED");
    });
  });

  describe("🚨 Edge Case Verification", function () {
    it("Should handle edge cases correctly", async function () {
      console.log("\n=== VERIFYING EDGE CASES ===");

      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));

      // Test minimum mint
      await token.connect(user1).mint(ethers.parseEther("1"), ethers.parseEther("1"), user1.address);
      console.log("✅ Minimum mint: WORKS");

      // Test price at exact step boundary
      await token.connect(user1).mint(ethers.parseEther("999"), ethers.parseEther("10"), user1.address); // Total = 1000
      const priceAtBoundary = await token.getCurrentPrice();
      console.log(`✅ Price at step boundary (1000 tokens): ${ethers.formatEther(priceAtBoundary)}`);
      expect(priceAtBoundary).to.equal(ethers.parseEther("0.002")); // Should be in second step

      // Test slippage protection
      await expect(
        token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("0.001"), user1.address)
      ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      console.log("✅ Slippage protection: WORKS");

      // Test max supply protection
      const maxSupply = await token.maxSupply();
      await expect(
        token.connect(user1).mint(maxSupply, ethers.parseEther("1000"), user1.address)
      ).to.be.revertedWithCustomError(token, "BondingToken__MaxSupplyReached");
      console.log("✅ Max supply protection: WORKS");
    });
  });
}); 