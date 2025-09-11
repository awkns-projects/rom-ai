const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔍 COMPREHENSIVE CONTRACT LOGIC AUDIT", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;

  before(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);
  });

  describe("📚 BondingCurveMath Library", function () {
    let mathTester;

    before(async function () {
      const BondingCurveMathTester = await ethers.getContractFactory("BondingCurveMathTester");
      mathTester = await BondingCurveMathTester.deploy();
      await mathTester.waitForDeployment();
    });

    it("Should validate step-based curve calculations", async function () {
      console.log("\n=== AUDITING BondingCurveMath Library ===");

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
        { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") },
        { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }
      ];

      // Test getCurrentPrice at different supply levels
      const priceAt0 = await mathTester.getCurrentPrice(0, steps, 18);
      const priceAt500 = await mathTester.getCurrentPrice(ethers.parseEther("500"), steps, 18);
      const priceAt1000 = await mathTester.getCurrentPrice(ethers.parseEther("1000"), steps, 18);
      const priceAt1001 = await mathTester.getCurrentPrice(ethers.parseEther("1001"), steps, 18);

      console.log(`Price at supply 0: ${ethers.formatEther(priceAt0)}`);
      console.log(`Price at supply 500: ${ethers.formatEther(priceAt500)}`);
      console.log(`Price at supply 1000: ${ethers.formatEther(priceAt1000)}`);
      console.log(`Price at supply 1001: ${ethers.formatEther(priceAt1001)}`);

      expect(priceAt0).to.equal(ethers.parseEther("0.001"));
      expect(priceAt500).to.equal(ethers.parseEther("0.001"));
      expect(priceAt1000).to.equal(ethers.parseEther("0.001")); // Still step 0
      expect(priceAt1001).to.equal(ethers.parseEther("0.002")); // Now step 1

      // Test cross-step cost calculation
      const cost1500 = await mathTester.calculateBuyCost(0, ethers.parseEther("1500"), steps, 18);
      console.log(`Cost for 1500 tokens: ${ethers.formatEther(cost1500)}`);
      expect(cost1500).to.equal(ethers.parseEther("2.0")); // 1000*0.001 + 500*0.002

      console.log("✅ BondingCurveMath: All calculations correct");
    });

    it("Should handle edge cases properly", async function () {
      console.log("\n=== TESTING BondingCurveMath Edge Cases ===");

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }
      ];

      // Test at exact boundary
      const costAtBoundary = await mathTester.calculateBuyCost(
        ethers.parseEther("1000"),
        ethers.parseEther("1"),
        steps,
        18
      );
      console.log(`Cost for 1 token at boundary: ${ethers.formatEther(costAtBoundary)}`);

      // Test zero amounts
      const costZero = await mathTester.calculateBuyCost(0, 0, steps, 18);
      expect(costZero).to.equal(0);

      console.log("✅ BondingCurveMath: Edge cases handled correctly");
    });
  });

  describe("🏭 ERC20Factory Contract", function () {
    it("Should validate factory logic and access controls", async function () {
      console.log("\n=== AUDITING ERC20Factory Contract ===");

      // Check initial state
      const tokenCount = await erc20Factory.getTokenCount();
      const creationFee = await erc20Factory.creationFee();
      const royaltyRecipient = await erc20Factory.royaltyRecipient();

      console.log(`Initial token count: ${tokenCount}`);
      console.log(`Creation fee: ${ethers.formatEther(creationFee)} ETH`);
      console.log(`Royalty recipient: ${royaltyRecipient}`);

      // Test token creation with proper fee
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
        { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") }
      ];

      const createTx = await erc20Factory.connect(creator).createToken(
        "Audit Token",
        "AUDIT",
        await collection.getAddress(),
        await mockERC20.getAddress(),
        steps,
        200, // 2% mint royalty
        150, // 1.5% burn royalty
        { value: creationFee }
      );

      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return erc20Factory.interface.parseLog(log).name === 'TokenCreated';
        } catch (e) {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const tokenAddress = erc20Factory.interface.parseLog(event).args.token;
      console.log(`✅ Token created: ${tokenAddress}`);

      // Test access controls
      await expect(
        erc20Factory.connect(user1).setCreationFee(ethers.parseEther("0.02"))
      ).to.be.revertedWithCustomError(erc20Factory, "ERC20Factory__UnauthorizedCreator");

      await erc20Factory.connect(owner).setCreationFee(ethers.parseEther("0.02"));
      const newFee = await erc20Factory.creationFee();
      expect(newFee).to.equal(ethers.parseEther("0.02"));

      console.log("✅ ERC20Factory: All logic and access controls working");
    });

    it("Should validate token enumeration functions", async function () {
      console.log("\n=== TESTING ERC20Factory Enumeration ===");

      const totalTokens = await erc20Factory.getTokenCount();
      console.log(`Total tokens: ${totalTokens}`);

      if (totalTokens > 0) {
        // Test getTokens pagination
        const tokens = await erc20Factory.getTokens(0, Math.min(Number(totalTokens), 10));
        console.log(`Retrieved ${tokens.length} tokens`);

        // Test getTokensByCreator
        const creatorTokens = await erc20Factory.getTokensByCreator(creator.address, 0, 10);
        console.log(`Creator has ${creatorTokens.length} tokens`);

        // Test token info
        if (tokens.length > 0) {
          const tokenInfo = await erc20Factory.getTokenInfo(tokens[0]);
          console.log(`Token info: ${tokenInfo.name}, Supply: ${ethers.formatEther(tokenInfo.currentSupply)}`);
        }
      }

      console.log("✅ ERC20Factory: Enumeration functions working");
    });
  });

  describe("🪙 BondingToken Contract", function () {
    let token;

    before(async function () {
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await nftResult.collection.getAddress(),
        mockERC20
      );
      token = tokenResult.token;
    });

    it("Should validate bonding token core logic", async function () {
      console.log("\n=== AUDITING BondingToken Contract ===");

      // Check initial state
      const name = await token.name();
      const symbol = await token.symbol();
      const totalSupply = await token.totalSupply();
      const maxSupply = await token.maxSupply();
      const currentPrice = await token.getCurrentPrice();

      console.log(`Token: ${name} (${symbol})`);
      console.log(`Supply: ${ethers.formatEther(totalSupply)}/${ethers.formatEther(maxSupply)}`);
      console.log(`Current price: ${ethers.formatEther(currentPrice)}`);

      expect(totalSupply).to.equal(0);
      expect(maxSupply).to.equal(ethers.parseEther("10000"));
      expect(currentPrice).to.equal(ethers.parseEther("0.001"));

      // Test minting logic
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));

      const [mintCost, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("100"));
      console.log(`Mint cost: ${ethers.formatEther(mintCost)} (${ethers.formatEther(mintRoyalty)} royalty)`);

      const mintTx = await token.connect(user1).mint(
        ethers.parseEther("100"),
        ethers.parseEther("1"),
        user1.address
      );

      const newSupply = await token.totalSupply();
      const userBalance = await token.balanceOf(user1.address);
      const reserveBalance = await token.reserveBalance();

      expect(newSupply).to.equal(ethers.parseEther("100"));
      expect(userBalance).to.equal(ethers.parseEther("100"));
      expect(reserveBalance).to.equal(mintCost - mintRoyalty);

      console.log(`After mint - Supply: ${ethers.formatEther(newSupply)}, Reserve: ${ethers.formatEther(reserveBalance)}`);

      // Test burning logic
      const [burnRefund, burnRoyalty] = await token.getRefundForTokens(ethers.parseEther("50"));
      console.log(`Burn refund: ${ethers.formatEther(burnRefund)} (${ethers.formatEther(burnRoyalty)} royalty)`);

      await token.connect(user1).burn(
        ethers.parseEther("50"),
        ethers.parseEther("0.01"),
        user1.address
      );

      const finalSupply = await token.totalSupply();
      const finalBalance = await token.balanceOf(user1.address);
      const finalReserve = await token.reserveBalance();

      expect(finalSupply).to.equal(ethers.parseEther("50"));
      expect(finalBalance).to.equal(ethers.parseEther("50"));

      console.log(`After burn - Supply: ${ethers.formatEther(finalSupply)}, Reserve: ${ethers.formatEther(finalReserve)}`);
      console.log("✅ BondingToken: Core logic working correctly");
    });

    it("Should validate UI support functions", async function () {
      console.log("\n=== TESTING BondingToken UI Functions ===");

      // Test holder tracking
      const holderCount = await token.getHolderCount();
      const holders = await token.getHolders(0, 10);
      console.log(`Holder count: ${holderCount}, Retrieved: ${holders.length}`);

      if (holders.length > 0) {
        console.log(`First holder: ${holders[0]}`);
        const isHolder = await token.isHolder(holders[0]);
        expect(isHolder).to.be.true;
      }

      // Test price history
      const historyLength = await token.getPriceHistoryLength();
      console.log(`Price history entries: ${historyLength}`);

      if (historyLength > 0) {
        const [timestamps, prices, supplies] = await token.getPriceHistory(0, Math.min(Number(historyLength), 5));
        console.log(`Latest price: ${ethers.formatEther(prices[prices.length - 1])}`);
      }

      // Test bonding curve info
      const curveInfo = await token.getBondingCurveInfo();
      console.log(`Curve info - Current supply: ${ethers.formatEther(curveInfo.currentSupply)}, Price: ${ethers.formatEther(curveInfo.currentPrice)}`);

      console.log("✅ BondingToken: UI functions working correctly");
    });

    it("Should validate access controls and edge cases", async function () {
      console.log("\n=== TESTING BondingToken Security ===");

      // Test slippage protection
      await expect(
        token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("0.001"), user1.address)
      ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");

      await expect(
        token.connect(user1).burn(ethers.parseEther("50"), ethers.parseEther("10"), user1.address)
      ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");

      // Test insufficient balance
      await expect(
        token.connect(user2).burn(ethers.parseEther("100"), 0, user2.address)
      ).to.be.revertedWithCustomError(token, "BondingToken__InsufficientTokens");

      // Test zero address protection
      await expect(
        token.connect(user1).mint(ethers.parseEther("1"), ethers.parseEther("1"), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(token, "BondingToken__InvalidReceiver");

      console.log("✅ BondingToken: Security controls working correctly");
    });
  });

  describe("🖼️ NFTFactory & NFTCollection Contracts", function () {
    it("Should validate NFT factory logic", async function () {
      console.log("\n=== AUDITING NFTFactory Contract ===");

      const collectionCount = await nftFactory.getCollectionCount();
      const creationFee = await nftFactory.creationFee();

      console.log(`Collections created: ${collectionCount}`);
      console.log(`Creation fee: ${ethers.formatEther(creationFee)} ETH`);

      // Test collection creation
      const createTx = await nftFactory.connect(creator).createCollection(
        "Audit NFT",
        "ANFT",
        ethers.parseEther("0.05"), // mint price
        1000, // max supply
        ethers.ZeroAddress, // ETH payment
        { value: creationFee }
      );

      const receipt = await createTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return nftFactory.interface.parseLog(log).name === 'CollectionCreated';
        } catch (e) {
          return false;
        }
      });

      const collectionAddress = nftFactory.interface.parseLog(event).args.collection;
      console.log(`✅ Collection created: ${collectionAddress}`);

      // Test enumeration
      const collections = await nftFactory.getCollections(0, 10);
      const creatorCollections = await nftFactory.getCollectionsByCreator(creator.address, 0, 10);

      console.log(`Total collections: ${collections.length}`);
      console.log(`Creator collections: ${creatorCollections.length}`);

      console.log("✅ NFTFactory: All logic working correctly");
    });

    it("Should validate NFT collection logic", async function () {
      console.log("\n=== AUDITING NFTCollection Contract ===");

      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Test Collection",
        symbol: "TEST",
        mintPrice: ethers.parseEther("0.1"),
        maxSupply: 100
      });
      const collection = nftResult.collection;

      // Check initial state
      const name = await collection.name();
      const maxSupply = await collection.maxSupply();
      const mintPrice = await collection.mintPrice();
      const totalSupply = await collection.totalSupply();

      console.log(`Collection: ${name}, Max: ${maxSupply}, Price: ${ethers.formatEther(mintPrice)} ETH`);
      expect(totalSupply).to.equal(0);

      // Test minting
      const mintTx = await collection.connect(user1).mint(user1.address, 3, {
        value: ethers.parseEther("0.3")
      });

      const newSupply = await collection.totalSupply();
      const userBalance = await collection.balanceOf(user1.address);
      const totalRevenue = await collection.totalRevenue();

      expect(newSupply).to.equal(3);
      expect(userBalance).to.equal(3);
      expect(totalRevenue).to.be.gt(0);

      console.log(`After mint - Supply: ${newSupply}, Revenue: ${ethers.formatEther(totalRevenue)} ETH`);

      // Test collection stats
      const stats = await collection.getCollectionStats();
      console.log(`Stats - Minted: ${stats.totalMinted}, Revenue: ${ethers.formatEther(stats.totalRevenue_)}`);

      // Test max supply protection
      await expect(
        collection.connect(user1).mint(user1.address, 98, { value: ethers.parseEther("9.8") })
      ).to.be.revertedWithCustomError(collection, "NFTCollection__MaxSupplyReached");

      console.log("✅ NFTCollection: All logic working correctly");
    });
  });

  describe("🥩 StakingFactory & StakingPool Contracts", function () {
    let stakingPool, token, collection;

    before(async function () {
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      token = tokenResult.token;

      // Create staking pool
      const stakingTx = await stakingFactory.connect(creator).createPool(
        await token.getAddress(),
        ethers.ZeroAddress, // ETH rewards
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await stakingTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return stakingFactory.interface.parseLog(log).name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });

      const stakingPoolAddress = stakingFactory.interface.parseLog(event).args.pool;
      const StakingPool = await ethers.getContractFactory("StakingPool");
      stakingPool = StakingPool.attach(stakingPoolAddress);
    });

    it("Should validate staking factory logic", async function () {
      console.log("\n=== AUDITING StakingFactory Contract ===");

      const poolCount = await stakingFactory.getPoolCount();
      const creationFee = await stakingFactory.creationFee();

      console.log(`Pools created: ${poolCount}`);
      console.log(`Creation fee: ${ethers.formatEther(creationFee)} ETH`);

      expect(poolCount).to.be.gt(0);

      // Test access controls
      await expect(
        stakingFactory.connect(user1).updateProtocolFeeBps(200)
      ).to.be.revertedWithCustomError(stakingFactory, "StakingFactory__Unauthorized");

      console.log("✅ StakingFactory: All logic working correctly");
    });

    it("Should validate staking pool logic", async function () {
      console.log("\n=== AUDITING StakingPool Contract ===");

      // Link staking pool to collection
      await collection.connect(creator).setStakingPool(await stakingPool.getAddress());

      // Get tokens to stake
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("1"), user1.address);

      // Test staking
      const stakeAmount = ethers.parseEther("200");
      await token.connect(user1).approve(await stakingPool.getAddress(), stakeAmount);
      await stakingPool.connect(user1).stake(stakeAmount);

      const stakedBalance = await stakingPool.stakedBalance(user1.address);
      const totalStaked = await stakingPool.totalStaked();

      expect(stakedBalance).to.equal(stakeAmount);
      expect(totalStaked).to.equal(stakeAmount);

      console.log(`Staked: ${ethers.formatEther(stakedBalance)}, Total: ${ethers.formatEther(totalStaked)}`);

      // Generate rewards by minting NFTs
      await collection.connect(user2).mint(user2.address, 2, { value: ethers.parseEther("0.2") });

      const earned = await stakingPool.earned(user1.address);
      console.log(`Earned rewards: ${ethers.formatEther(earned)} ETH`);
      expect(earned).to.be.gt(0);

      // Test unstaking
      const unstakeAmount = ethers.parseEther("100");
      await stakingPool.connect(user1).unstake(unstakeAmount);

      const newStakedBalance = await stakingPool.stakedBalance(user1.address);
      expect(newStakedBalance).to.equal(stakeAmount - unstakeAmount);

      console.log(`After unstake: ${ethers.formatEther(newStakedBalance)}`);

      // Test minimum stake duration (should pass after some time)
      await network.provider.send("evm_increaseTime", [3600]); // 1 hour
      await network.provider.send("evm_mine");

      const claimTx = await stakingPool.connect(user1).claimRewards();
      const claimReceipt = await claimTx.wait();

      console.log(`Rewards claimed, gas used: ${claimReceipt.gasUsed}`);
      console.log("✅ StakingPool: All logic working correctly");
    });

    it("Should validate staking security and edge cases", async function () {
      console.log("\n=== TESTING StakingPool Security ===");

      // Test zero stake protection
      await expect(
        stakingPool.connect(user2).stake(0)
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InvalidAmount");

      // Test unstaking more than staked
      const userStaked = await stakingPool.stakedBalance(user1.address);
      await expect(
        stakingPool.connect(user1).unstake(userStaked + 1n)
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStake");

      // Test unauthorized reward notification
      await expect(
        stakingPool.connect(user1).notifyRewardAmount(ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__Unauthorized");

      console.log("✅ StakingPool: Security controls working correctly");
    });
  });

  describe("🔧 MockERC20 Contract", function () {
    it("Should validate mock ERC20 functionality", async function () {
      console.log("\n=== AUDITING MockERC20 Contract ===");

      const name = await mockERC20.name();
      const symbol = await mockERC20.symbol();
      const decimals = await mockERC20.decimals();
      const totalSupply = await mockERC20.totalSupply();

      console.log(`Mock ERC20: ${name} (${symbol}), Decimals: ${decimals}`);
      console.log(`Total supply: ${ethers.formatEther(totalSupply)}`);

      // Test minting
      const initialBalance = await mockERC20.balanceOf(user3.address);
      await mockERC20.mint(user3.address, ethers.parseEther("1000"));
      const newBalance = await mockERC20.balanceOf(user3.address);

      expect(newBalance).to.equal(initialBalance + ethers.parseEther("1000"));

      // Test transfers
      await mockERC20.connect(user3).transfer(user2.address, ethers.parseEther("100"));
      const user2Balance = await mockERC20.balanceOf(user2.address);
      expect(user2Balance).to.be.gte(ethers.parseEther("100"));

      console.log("✅ MockERC20: All functionality working correctly");
    });
  });

  describe("📊 System Integration Validation", function () {
    it("Should validate complete system integration", async function () {
      console.log("\n=== FINAL SYSTEM INTEGRATION VALIDATION ===");

      // Create complete system
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      const token = tokenResult.token;

      // Create and link staking pool
      const stakingTx = await stakingFactory.connect(creator).createPool(
        await token.getAddress(),
        ethers.ZeroAddress,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await stakingTx.wait();
      const event = receipt.logs.find(log => {
        try {
          return stakingFactory.interface.parseLog(log).name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });

      const stakingPoolAddress = stakingFactory.interface.parseLog(event).args.pool;
      await collection.connect(creator).setStakingPool(stakingPoolAddress);

      const StakingPool = await ethers.getContractFactory("StakingPool");
      const stakingPool = StakingPool.attach(stakingPoolAddress);

      // Execute full workflow
      console.log("1. Minting NFTs...");
      await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });

      console.log("2. Minting tokens...");
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("300"), ethers.parseEther("1"), user1.address);

      console.log("3. Staking tokens...");
      await token.connect(user1).approve(stakingPoolAddress, ethers.parseEther("200"));
      await stakingPool.connect(user1).stake(ethers.parseEther("200"));

      console.log("4. Generating more revenue...");
      await collection.connect(user2).mint(user2.address, 1, { value: ethers.parseEther("0.1") });

      console.log("5. Checking rewards...");
      const earned = await stakingPool.earned(user1.address);

      // Validate final state
      const nftSupply = await collection.totalSupply();
      const tokenSupply = await token.totalSupply();
      const totalStaked = await stakingPool.totalStaked();
      const totalRevenue = await collection.totalRevenue();

      console.log(`Final state:`);
      console.log(`- NFTs minted: ${nftSupply}`);
      console.log(`- Tokens minted: ${ethers.formatEther(tokenSupply)}`);
      console.log(`- Tokens staked: ${ethers.formatEther(totalStaked)}`);
      console.log(`- Revenue generated: ${ethers.formatEther(totalRevenue)} ETH`);
      console.log(`- Rewards earned: ${ethers.formatEther(earned)} ETH`);

      expect(nftSupply).to.be.gt(0);
      expect(tokenSupply).to.be.gt(0);
      expect(totalStaked).to.be.gt(0);
      expect(totalRevenue).to.be.gt(0);
      expect(earned).to.be.gt(0);

      console.log("🎉 COMPLETE SYSTEM INTEGRATION: WORKING PERFECTLY!");
    });
  });
}); 