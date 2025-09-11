const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("Integration Tests - Complete System Workflow", function () {
  let contracts;
  let owner, creator, user1, user2, user3, collector1, collector2;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Get additional signers for testing
    const signers = await ethers.getSigners();
    collector1 = signers[5];
    collector2 = signers[6];
  });

  describe("Complete Creator Workflow", function () {
    it("Should complete full creator setup: NFT → Token → Staking", async function () {
      // Step 1: Creator creates NFT collection
      console.log("Creating NFT Collection...");
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Awesome Art",
        symbol: "ART",
        baseURI: "https://api.awesome-art.com/metadata/",
        mintPrice: ethers.parseEther("0.05"),
        maxSupply: 1000
      });
      collection = nftResult.collection;

      expect(await collection.name()).to.equal("Awesome Art");
      expect(await collection.creator()).to.equal(creator.address);

      // Step 2: Creator creates bonding token for the collection
      console.log("Creating Bonding Token...");
      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20,
        {
          name: "Awesome Art Token",
          symbol: "ARTK",
          basePrice: ethers.parseEther("0.001"), // 0.001 ETH
          slope: ethers.parseEther("0.0000005"), // Small slope
          maxSupply: ethers.parseEther("1000000") // 1M tokens
        }
      );
      token = tokenResult.token;

      expect(await token.name()).to.equal("Awesome Art Token");
      expect(await token.nftCollection()).to.equal(await collection.getAddress());

      // Step 3: Creator creates staking pool
      console.log("Creating Staking Pool...");
      const stakingResult = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = stakingResult.pool;

      expect(await stakingPool.stakingToken()).to.equal(await token.getAddress());
      expect(await stakingPool.nftCollection()).to.equal(await collection.getAddress());

      // Verify that NFT collection now points to staking pool
      expect(await collection.stakingPool()).to.equal(await stakingPool.getAddress());

      console.log("✅ Creator setup complete!");
    });
  });

  describe("Complete User Investment & Reward Cycle", function () {
    beforeEach(async function () {
      // Setup the complete system
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        mintPrice: ethers.parseEther("0.1"),
        maxSupply: 1000
      });
      collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress()
      );
      token = tokenResult.token;

      const stakingResult = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = stakingResult.pool;
    });

    it("Should complete full investment cycle with rewards", async function () {
      console.log("=== PHASE 1: Users buy bonding tokens ===");

      // Users buy bonding tokens at different prices
      const buyAmount = ethers.parseEther("2"); // 2 ETH each

      console.log("User1 buying tokens...");
      await token.connect(user1).buy(0, user1.address, { value: buyAmount });
      const balance1 = await token.balanceOf(user1.address);
      const price1 = await token.getCurrentPrice();

      console.log("User2 buying tokens...");
      await token.connect(user2).buy(0, user2.address, { value: buyAmount });
      const balance2 = await token.balanceOf(user2.address);
      const price2 = await token.getCurrentPrice();

      console.log("User3 buying tokens...");
      await token.connect(user3).buy(0, user3.address, { value: buyAmount });
      const balance3 = await token.balanceOf(user3.address);
      const price3 = await token.getCurrentPrice();

      // Verify price increases and later buyers get fewer tokens
      expect(price2).to.be.gt(price1);
      expect(price3).to.be.gt(price2);
      expect(balance1).to.be.gte(balance2);
      expect(balance2).to.be.gte(balance3);

      console.log(`Price progression: ${TestHelpers.formatEther(price1)} → ${TestHelpers.formatEther(price2)} → ${TestHelpers.formatEther(price3)} ETH`);
      console.log(`Token balances: ${TestHelpers.formatEther(balance1)}, ${TestHelpers.formatEther(balance2)}, ${TestHelpers.formatEther(balance3)}`);

      console.log("=== PHASE 2: Users stake their tokens ===");

      // Users stake different amounts
      const stakeAmount1 = balance1 / 2n; // 50% of tokens
      const stakeAmount2 = (balance2 * 3n) / 4n; // 75% of tokens
      const stakeAmount3 = balance3; // 100% of tokens

      await token.connect(user1).approve(await stakingPool.getAddress(), stakeAmount1);
      await token.connect(user2).approve(await stakingPool.getAddress(), stakeAmount2);
      await token.connect(user3).approve(await stakingPool.getAddress(), stakeAmount3);

      await stakingPool.connect(user1).stake(stakeAmount1);
      await stakingPool.connect(user2).stake(stakeAmount2);
      await stakingPool.connect(user3).stake(stakeAmount3);

      const totalStaked = await stakingPool.totalStaked();
      console.log(`Total staked: ${TestHelpers.formatEther(totalStaked)} tokens`);
      console.log(`Staked amounts: ${TestHelpers.formatEther(stakeAmount1)}, ${TestHelpers.formatEther(stakeAmount2)}, ${TestHelpers.formatEther(stakeAmount3)}`);

      console.log("=== PHASE 3: NFT minting generates rewards ===");

      // Track initial balances
      const initialBalance1 = await TestHelpers.getBalance(user1.address);
      const initialBalance2 = await TestHelpers.getBalance(user2.address);
      const initialBalance3 = await TestHelpers.getBalance(user3.address);

      // Collectors mint NFTs, generating revenue for stakers
      console.log("Collector1 mints 5 NFTs...");
      await collection.connect(collector1).mint(collector1.address, 5, { value: ethers.parseEther("0.5") });

      console.log("Collector2 mints 3 NFTs...");
      await collection.connect(collector2).mint(collector2.address, 3, { value: ethers.parseEther("0.3") });

      // Total revenue after protocol fees (0.8 - 0.8 * 0.025 = 0.78)
      const totalRevenue = ethers.parseEther("0.78");
      expect(await collection.totalRevenue()).to.equal(totalRevenue);
      expect(await stakingPool.totalRewards()).to.equal(totalRevenue);

      console.log(`Total revenue generated: ${TestHelpers.formatEther(totalRevenue)} ETH`);

      console.log("=== PHASE 4: Users claim proportional rewards ===");

      // Check earned amounts before claiming
      const earned1 = await stakingPool.earned(user1.address);
      const earned2 = await stakingPool.earned(user2.address);
      const earned3 = await stakingPool.earned(user3.address);

      console.log(`Earned rewards: ${TestHelpers.formatEther(earned1)}, ${TestHelpers.formatEther(earned2)}, ${TestHelpers.formatEther(earned3)} ETH`);

      // Verify proportional distribution
      const expectedRatio12 = stakeAmount1 * ethers.parseEther("1") / stakeAmount2;
      const actualRatio12 = earned1 * ethers.parseEther("1") / earned2;
      TestHelpers.expectAlmostEqual(expectedRatio12, actualRatio12, ethers.parseEther("0.01"));

      // Users claim rewards
      await stakingPool.connect(user1).claimRewards();
      await stakingPool.connect(user2).claimRewards();
      await stakingPool.connect(user3).claimRewards();

      // Verify rewards were received (minus gas costs)
      const finalBalance1 = await TestHelpers.getBalance(user1.address);
      const finalBalance2 = await TestHelpers.getBalance(user2.address);
      const finalBalance3 = await TestHelpers.getBalance(user3.address);

      expect(finalBalance1).to.be.gt(initialBalance1);
      expect(finalBalance2).to.be.gt(initialBalance2);
      expect(finalBalance3).to.be.gt(initialBalance3);

      console.log("✅ Rewards successfully claimed!");

      console.log("=== PHASE 5: Some users exit, others continue ===");

      // User1 exits completely (unstakes and claims any remaining rewards)
      await stakingPool.connect(user1).exit();
      expect(await stakingPool.stakedBalance(user1.address)).to.equal(0);

      // User2 partially unstakes
      const unstakeAmount = stakeAmount2 / 2n;
      await stakingPool.connect(user2).unstake(unstakeAmount);
      expect(await stakingPool.stakedBalance(user2.address)).to.equal(stakeAmount2 - unstakeAmount);

      // User3 continues staking
      expect(await stakingPool.stakedBalance(user3.address)).to.equal(stakeAmount3);

      console.log("=== PHASE 6: More NFT mints, new reward distribution ===");

      // More minting happens
      await collection.connect(collector1).mint(collector1.address, 2, { value: ethers.parseEther("0.2") });

      // Only user2 and user3 should get rewards from this mint
      const newEarned2 = await stakingPool.earned(user2.address);
      const newEarned3 = await stakingPool.earned(user3.address);

      expect(newEarned2).to.be.gt(0);
      expect(newEarned3).to.be.gt(0);
      expect(await stakingPool.earned(user1.address)).to.equal(0); // User1 exited

      console.log("✅ New rewards distributed correctly!");
    });
  });

  describe("Token Trading During Staking", function () {
    beforeEach(async function () {
      // Setup system
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress()
      );
      token = tokenResult.token;

      const stakingResult = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = stakingResult.pool;
    });

    it("Should handle token trading while staking is active", async function () {
      console.log("=== Users buy and stake tokens ===");

      // Users buy tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });

      const balance1 = await token.balanceOf(user1.address);
      const balance2 = await token.balanceOf(user2.address);

      // Stake half of their tokens
      const stakeAmount1 = balance1 / 2n;
      const stakeAmount2 = balance2 / 2n;

      await token.connect(user1).approve(await stakingPool.getAddress(), stakeAmount1);
      await token.connect(user2).approve(await stakingPool.getAddress(), stakeAmount2);

      await stakingPool.connect(user1).stake(stakeAmount1);
      await stakingPool.connect(user2).stake(stakeAmount2);

      console.log("=== New user enters and buys tokens at higher price ===");

      const priceBefore = await token.getCurrentPrice();
      await token.connect(user3).buy(0, user3.address, { value: ethers.parseEther("2") });
      const priceAfter = await token.getCurrentPrice();

      expect(priceAfter).to.be.gt(priceBefore);
      console.log(`Price increased from ${TestHelpers.formatEther(priceBefore)} to ${TestHelpers.formatEther(priceAfter)} ETH`);

      console.log("=== User1 sells some unstaked tokens ===");

      const sellAmount = balance1 / 4n; // Sell 25% of original tokens
      const balanceBeforeSell = await TestHelpers.getBalance(user1.address);

      await token.connect(user1).sell(sellAmount, 0, user1.address);

      const balanceAfterSell = await TestHelpers.getBalance(user1.address);
      expect(balanceAfterSell).to.be.gt(balanceBeforeSell); // Received ETH from sale

      // Staked amount should remain unchanged
      expect(await stakingPool.stakedBalance(user1.address)).to.equal(stakeAmount1);

      console.log("=== Generate rewards and verify distribution ===");

      // Generate rewards
      await collection.connect(collector1).mint(collector1.address, 10, { value: ethers.parseEther("1") });

      // All stakers should receive rewards based on their staked amounts
      const earned1 = await stakingPool.earned(user1.address);
      const earned2 = await stakingPool.earned(user2.address);

      expect(earned1).to.be.gt(0);
      expect(earned2).to.be.gt(0);

      // Rewards should be proportional to staked amounts
      TestHelpers.expectAlmostEqual(earned1, earned2, ethers.parseEther("0.01")); // Similar stakes

      console.log("✅ Token trading and staking work together correctly!");
    });
  });

  describe("Multiple Collections and Tokens", function () {
    it("Should handle multiple independent collection-token-staking systems", async function () {
      console.log("=== Creating multiple independent systems ===");

      // Create first system
      const nft1Result = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Collection 1",
        symbol: "COL1",
        mintPrice: ethers.parseEther("0.1")
      });
      const collection1 = nft1Result.collection;

      const token1Result = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection1.getAddress(),
        { name: "Token 1", symbol: "TK1" }
      );
      const token1 = token1Result.token;

      const staking1Result = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token1.getAddress()
      );
      const stakingPool1 = staking1Result.pool;

      // Create second system
      const nft2Result = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Collection 2",
        symbol: "COL2",
        mintPrice: ethers.parseEther("0.05")
      });
      const collection2 = nft2Result.collection;

      const token2Result = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection2.getAddress(),
        { name: "Token 2", symbol: "TK2" }
      );
      const token2 = token2Result.token;

      const staking2Result = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token2.getAddress()
      );
      const stakingPool2 = staking2Result.pool;

      console.log("=== Users invest in both systems ===");

      // Users buy tokens from both systems
      await token1.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      await token2.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });

      await token1.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });
      await token2.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });

      // Stake in both systems
      const balance1_1 = await token1.balanceOf(user1.address);
      const balance1_2 = await token2.balanceOf(user1.address);
      const balance2_1 = await token1.balanceOf(user2.address);
      const balance2_2 = await token2.balanceOf(user2.address);

      await token1.connect(user1).approve(await stakingPool1.getAddress(), balance1_1);
      await token2.connect(user1).approve(await stakingPool2.getAddress(), balance1_2);
      await token1.connect(user2).approve(await stakingPool1.getAddress(), balance2_1);
      await token2.connect(user2).approve(await stakingPool2.getAddress(), balance2_2);

      await stakingPool1.connect(user1).stake(balance1_1);
      await stakingPool2.connect(user1).stake(balance1_2);
      await stakingPool1.connect(user2).stake(balance2_1);
      await stakingPool2.connect(user2).stake(balance2_2);

      console.log("=== Generate rewards in both systems ===");

      // Mint NFTs in both collections
      await collection1.connect(collector1).mint(collector1.address, 5, { value: ethers.parseEther("0.5") });
      await collection2.connect(collector1).mint(collector1.address, 10, { value: ethers.parseEther("0.5") });

      // Check rewards are isolated to their respective systems
      const earned1_1 = await stakingPool1.earned(user1.address);
      const earned1_2 = await stakingPool2.earned(user1.address);

      expect(earned1_1).to.be.gt(0);
      expect(earned1_2).to.be.gt(0);

      // Rewards should be from their respective collections
      expect(await stakingPool1.totalRewards()).to.equal(ethers.parseEther("0.5"));
      expect(await stakingPool2.totalRewards()).to.equal(ethers.parseEther("0.5"));

      console.log("✅ Multiple independent systems work correctly!");
    });
  });

  describe("Stress Test - High Volume Activity", function () {
    beforeEach(async function () {
      // Setup system
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        mintPrice: ethers.parseEther("0.01"), // Low price for high volume
        maxSupply: 10000
      });
      collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        {
          basePrice: ethers.parseEther("0.0001"),
          slope: ethers.parseEther("0.00000001")
        }
      );
      token = tokenResult.token;

      const stakingResult = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = stakingResult.pool;
    });

    it("Should handle high volume of transactions", async function () {
      console.log("=== High volume token purchases ===");

      const users = [user1, user2, user3];
      const buyAmount = ethers.parseEther("0.1");

      // Multiple rounds of buying
      for (let round = 0; round < 5; round++) {
        console.log(`Round ${round + 1} of purchases...`);

        for (let user of users) {
          await token.connect(user).buy(0, user.address, { value: buyAmount });
        }
      }

      // Check token distribution
      for (let user of users) {
        const balance = await token.balanceOf(user.address);
        expect(balance).to.be.gt(0);
        console.log(`${user.address}: ${TestHelpers.formatEther(balance)} tokens`);
      }

      console.log("=== High volume staking ===");

      // Users stake their tokens
      for (let user of users) {
        const balance = await token.balanceOf(user.address);
        await token.connect(user).approve(await stakingPool.getAddress(), balance);
        await stakingPool.connect(user).stake(balance);
      }

      console.log("=== High volume NFT minting ===");

      const collectors = [collector1, collector2];

      // Multiple rounds of minting
      for (let round = 0; round < 10; round++) {
        for (let collector of collectors) {
          await collection.connect(collector).mint(
            collector.address,
            5,
            { value: ethers.parseEther("0.05") }
          );
        }
      }

      // Check total revenue and rewards
      const totalRevenue = await collection.totalRevenue();
      const totalRewards = await stakingPool.totalRewards();

      expect(totalRevenue).to.equal(ethers.parseEther("1")); // 10 rounds * 2 collectors * 0.05 ETH
      expect(totalRewards).to.equal(totalRevenue);

      console.log(`Total revenue generated: ${TestHelpers.formatEther(totalRevenue)} ETH`);

      console.log("=== Verify reward distribution ===");

      // Check that all stakers have earned rewards
      let totalEarned = 0n;
      for (let user of users) {
        const earned = await stakingPool.earned(user.address);
        expect(earned).to.be.gt(0);
        totalEarned += earned;
        console.log(`${user.address} earned: ${TestHelpers.formatEther(earned)} ETH`);
      }

      // Total earned should approximately equal total rewards
      TestHelpers.expectAlmostEqual(totalEarned, totalRewards, ethers.parseEther("0.01"));

      console.log("✅ High volume stress test completed successfully!");
    });
  });

  describe("Economic Scenarios", function () {
    beforeEach(async function () {
      // Setup system
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        mintPrice: ethers.parseEther("0.1")
      });
      collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress()
      );
      token = tokenResult.token;

      const stakingResult = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = stakingResult.pool;
    });

    it("Should demonstrate profitable investment scenario", async function () {
      console.log("=== SCENARIO: Early investor profits from NFT success ===");

      // Early investor buys tokens when price is low
      console.log("Early investor (user1) buys tokens at low price...");
      const initialInvestment = ethers.parseEther("1");
      await token.connect(user1).buy(0, user1.address, { value: initialInvestment });

      const tokensReceived = await token.balanceOf(user1.address);
      const initialPrice = await token.getCurrentPrice();

      console.log(`Investment: ${TestHelpers.formatEther(initialInvestment)} ETH`);
      console.log(`Tokens received: ${TestHelpers.formatEther(tokensReceived)}`);
      console.log(`Initial price: ${TestHelpers.formatEther(initialPrice)} ETH`);

      // User stakes all tokens
      await token.connect(user1).approve(await stakingPool.getAddress(), tokensReceived);
      await stakingPool.connect(user1).stake(tokensReceived);

      // Other users buy tokens, driving up price
      console.log("Other users buy tokens, driving up price...");
      for (let i = 0; i < 10; i++) {
        await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("0.5") });
      }

      const newPrice = await token.getCurrentPrice();
      console.log(`New price after buying pressure: ${TestHelpers.formatEther(newPrice)} ETH`);

      // NFT collection becomes popular, generating revenue
      console.log("NFT collection becomes popular...");
      for (let i = 0; i < 20; i++) {
        await collection.connect(collector1).mint(collector1.address, 1, { value: ethers.parseEther("0.1") });
      }

      const totalRewards = await stakingPool.totalRewards();
      const earned = await stakingPool.earned(user1.address);

      console.log(`Total rewards generated: ${TestHelpers.formatEther(totalRewards)} ETH`);
      console.log(`User1 earned from staking: ${TestHelpers.formatEther(earned)} ETH`);

      // User can also sell tokens at higher price
      const sellValue = await token.getSellRefund(tokensReceived);
      console.log(`Current value of tokens: ${TestHelpers.formatEther(sellValue)} ETH`);

      // Total profit = staking rewards + capital appreciation
      const totalProfit = earned + sellValue - initialInvestment;
      console.log(`Total potential profit: ${TestHelpers.formatEther(totalProfit)} ETH`);

      expect(totalProfit).to.be.gt(0);
      console.log("✅ Early investor scenario: PROFITABLE!");
    });

    it("Should demonstrate risk scenario - declining NFT interest", async function () {
      console.log("=== SCENARIO: Declining NFT interest affects token value ===");

      // Users invest heavily in tokens
      const investment = ethers.parseEther("2");
      await token.connect(user1).buy(0, user1.address, { value: investment });
      await token.connect(user2).buy(0, user2.address, { value: investment });

      const balance1 = await token.balanceOf(user1.address);
      const balance2 = await token.balanceOf(user2.address);
      const highPrice = await token.getCurrentPrice();

      console.log(`Price at peak: ${TestHelpers.formatEther(highPrice)} ETH`);

      // Users stake their tokens
      await token.connect(user1).approve(await stakingPool.getAddress(), balance1);
      await token.connect(user2).approve(await stakingPool.getAddress(), balance2);
      await stakingPool.connect(user1).stake(balance1);
      await stakingPool.connect(user2).stake(balance2);

      // Initial NFT mints generate some rewards
      await collection.connect(collector1).mint(collector1.address, 5, { value: ethers.parseEther("0.5") });
      const initialRewards = await stakingPool.totalRewards();
      console.log(`Initial rewards: ${TestHelpers.formatEther(initialRewards)} ETH`);

      // Then interest declines - no more NFT mints for a while
      console.log("Interest declines - no new NFT mints...");

      // Some users sell tokens, driving price down
      console.log("Some users sell tokens...");
      const user3Balance = await token.balanceOf(user2.address);
      const sellAmount = user3Balance / 4n; // User2 sells 25% of unstaked tokens (they have none staked from balance)

      // User2 needs to unstake some to sell
      await stakingPool.connect(user2).unstake(sellAmount);
      await token.connect(user2).sell(sellAmount, 0, user2.address);

      const lowPrice = await token.getCurrentPrice();
      console.log(`Price after selling: ${TestHelpers.formatEther(lowPrice)} ETH`);

      expect(lowPrice).to.be.lt(highPrice);

      // Remaining stakers still earn from existing rewards
      const earned1 = await stakingPool.earned(user1.address);
      const earned2 = await stakingPool.earned(user2.address);

      console.log(`Remaining rewards: User1 ${TestHelpers.formatEther(earned1)}, User2 ${TestHelpers.formatEther(earned2)} ETH`);

      expect(earned1).to.be.gt(0);
      expect(earned2).to.be.gt(0);

      console.log("✅ Risk scenario: Rewards provide some downside protection");
    });
  });
}); 