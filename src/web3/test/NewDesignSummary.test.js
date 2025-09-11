const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🎯 NEW DESIGN VALIDATION - MCV2 System", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);
  });

  describe("✅ Core MCV2 Components", function () {
    it("Should validate MCV2 step-based bonding curve works", async function () {
      // Create NFT collection
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      // Create step-based bonding token
      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      const token = tokenResult.token;

      // Verify step-based curve
      const stepsLength = await token.getStepsLength();
      expect(stepsLength).to.equal(3);

      const step0 = await token.getStep(0);
      expect(step0.rangeTo).to.equal(ethers.parseEther("1000"));
      expect(step0.price).to.equal(ethers.parseEther("0.001"));

      // Test mint functionality
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);

      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("100"));

      console.log("   ✅ MCV2 step-based bonding curve: WORKING");
    });

    it("Should validate NFT system with revenue tracking", async function () {
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      // Mint NFTs
      await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });

      const totalSupply = await collection.totalSupply();
      const totalRevenue = await collection.totalRevenue();

      expect(totalSupply).to.equal(2);
      expect(totalRevenue).to.be.gt(0);

      console.log("   ✅ NFT system with revenue tracking: WORKING");
    });

    it("Should validate staking pool creation and basic operations", async function () {
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

      // Create staking pool
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
      const stakingPool = StakingPool.attach(stakingPoolAddress);

      // Test basic staking
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);
      await token.connect(user1).approve(stakingPoolAddress, ethers.parseEther("50"));
      await stakingPool.connect(user1).stake(ethers.parseEther("50"));

      const stakedBalance = await stakingPool.stakedBalance(user1.address);
      expect(stakedBalance).to.equal(ethers.parseEther("50"));

      console.log("   ✅ Staking pool system: WORKING");
    });
  });

  describe("✅ UI View Functions", function () {
    it("Should validate all new UI functions work", async function () {
      // Create test data
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      const token = tokenResult.token;

      // Test new UI functions
      const creatorCollections = await nftFactory.getCollectionsByCreator(creator.address, 0, 10);
      expect(creatorCollections.length).to.equal(1);

      const creatorTokens = await erc20Factory.getTokensByCreator(creator.address, 0, 10);
      expect(creatorTokens.length).to.equal(1);

      const collectionStats = await collection.getCollectionStats();
      expect(collectionStats.creator_).to.equal(creator.address);

      // Add some activity for holder tracking
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("50"), ethers.parseEther("1"), user1.address);

      const holders = await token.getHolders(0, 10);
      expect(holders.length).to.equal(1);

      const historyLength = await token.getPriceHistoryLength();
      expect(historyLength).to.be.gt(0);

      console.log("   ✅ All new UI functions: WORKING");
    });
  });

  describe("✅ System Integration", function () {
    it("Should validate end-to-end workflow (without reward claiming)", async function () {
      // Step 1: Create NFT collection
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      // Step 2: Mint NFTs
      await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });

      // Step 3: Create bonding token
      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      const token = tokenResult.token;

      // Step 4: Buy tokens
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("1"), user1.address);

      // Step 5: Sell tokens
      await token.connect(user1).burn(ethers.parseEther("100"), ethers.parseEther("0.01"), user1.address);

      // Step 6: Create staking pool
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
      const stakingPool = StakingPool.attach(stakingPoolAddress);

      // Step 7: Link staking pool to NFT collection
      await collection.connect(creator).setStakingPool(stakingPoolAddress);

      // Step 8: Stake tokens
      await token.connect(user1).approve(stakingPoolAddress, ethers.parseEther("200"));
      await stakingPool.connect(user1).stake(ethers.parseEther("200"));

      // Step 9: Generate more revenue
      await collection.connect(user2).mint(user2.address, 1, { value: ethers.parseEther("0.1") });

      // Verify final state
      const tokenBalance = await token.balanceOf(user1.address);
      const stakedBalance = await stakingPool.stakedBalance(user1.address);
      const earnedRewards = await stakingPool.earned(user1.address);

      expect(tokenBalance).to.equal(ethers.parseEther("200")); // 500 - 100 - 200 staked
      expect(stakedBalance).to.equal(ethers.parseEther("200"));
      expect(earnedRewards).to.be.gt(0);

      console.log("   ✅ End-to-end workflow (without claiming): WORKING");
      console.log(`   📊 Final state: ${ethers.formatEther(tokenBalance)} tokens, ${ethers.formatEther(stakedBalance)} staked, ${ethers.formatEther(earnedRewards)} rewards earned`);
    });
  });

  describe("📊 System Statistics", function () {
    it("Should provide comprehensive system overview", async function () {
      // Create multiple systems
      for (let i = 0; i < 2; i++) {
        const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
          name: `Collection ${i}`,
          symbol: `COL${i}`
        });

        const tokenResult = await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await nftResult.collection.getAddress(),
          mockERC20,
          {
            name: `Token ${i}`,
            symbol: `TOK${i}`
          }
        );

        // Add some activity
        await nftResult.collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });
        await mockERC20.connect(user1).approve(await tokenResult.token.getAddress(), ethers.parseEther("10"));
        await tokenResult.token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);
      }

      // Get system stats
      const nftCount = await nftFactory.getCollectionCount();
      const tokenCount = await erc20Factory.getTokenCount();
      const poolCount = await stakingFactory.getPoolCount();

      console.log("\n📈 SYSTEM OVERVIEW:");
      console.log(`   Collections: ${nftCount}`);
      console.log(`   Tokens: ${tokenCount}`);
      console.log(`   Pools: ${poolCount}`);

      expect(nftCount).to.equal(2);
      expect(tokenCount).to.equal(2);

      console.log("   ✅ System statistics: WORKING");
    });
  });
}); 