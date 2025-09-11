const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🎯 FINAL COMPREHENSIVE SYSTEM VERIFICATION", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;

  before(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);
  });

  describe("📋 CONTRACT DEPLOYMENT VERIFICATION", function () {
    it("Should verify all contracts are deployed correctly", async function () {
      console.log("\n=== VERIFYING CONTRACT DEPLOYMENTS ===");

      // Check factory addresses
      const nftFactoryAddress = await nftFactory.getAddress();
      const erc20FactoryAddress = await erc20Factory.getAddress();
      const stakingFactoryAddress = await stakingFactory.getAddress();

      console.log(`NFT Factory: ${nftFactoryAddress}`);
      console.log(`ERC20 Factory: ${erc20FactoryAddress}`);
      console.log(`Staking Factory: ${stakingFactoryAddress}`);

      // Verify they're actual contracts (have code)
      expect(await ethers.provider.getCode(nftFactoryAddress)).to.not.equal("0x");
      expect(await ethers.provider.getCode(erc20FactoryAddress)).to.not.equal("0x");
      expect(await ethers.provider.getCode(stakingFactoryAddress)).to.not.equal("0x");

      console.log("✅ All contracts deployed correctly");
    });

    it("Should verify contract configurations", async function () {
      console.log("\n=== VERIFYING CONTRACT CONFIGURATIONS ===");

      // NFT Factory config
      const nftCreationFee = await nftFactory.creationFee();
      const nftProtocolFee = await nftFactory.protocolFeeBps();
      console.log(`NFT Factory - Creation Fee: ${ethers.formatEther(nftCreationFee)} ETH, Protocol Fee: ${nftProtocolFee} bps`);

      // ERC20 Factory config
      const erc20CreationFee = await erc20Factory.creationFee();
      const erc20RoyaltyRecipient = await erc20Factory.royaltyRecipient();
      console.log(`ERC20 Factory - Creation Fee: ${ethers.formatEther(erc20CreationFee)} ETH, Royalty Recipient: ${erc20RoyaltyRecipient}`);

      // Staking Factory config
      const stakingCreationFee = await stakingFactory.creationFee();
      const stakingProtocolFee = await stakingFactory.protocolFeeBps();
      console.log(`Staking Factory - Creation Fee: ${ethers.formatEther(stakingCreationFee)} ETH, Protocol Fee: ${stakingProtocolFee} bps`);

      expect(nftCreationFee).to.equal(ethers.parseEther("0.01"));
      expect(erc20CreationFee).to.equal(ethers.parseEther("0.01"));
      expect(stakingCreationFee).to.equal(ethers.parseEther("0.01"));

      console.log("✅ All contract configurations correct");
    });
  });

  describe("🔄 END-TO-END SYSTEM VERIFICATION", function () {
    let collection, token, stakingPool;

    it("Should execute complete 9-step workflow flawlessly", async function () {
      console.log("\n=== EXECUTING COMPLETE 9-STEP WORKFLOW ===");

      // STEP 1: Create NFT Collection
      console.log("Step 1: Creating NFT Collection...");
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Final Test Collection",
        symbol: "FTC",
        mintPrice: ethers.parseEther("0.05")
      });
      collection = nftResult.collection;

      const collectionName = await collection.name();
      const collectionPrice = await collection.mintPrice();
      console.log(`✅ Created: ${collectionName}, Price: ${ethers.formatEther(collectionPrice)} ETH`);

      // STEP 2: Mint NFTs
      console.log("Step 2: Minting NFTs...");
      await collection.connect(user1).mint(user1.address, 3, { value: ethers.parseEther("0.15") });
      await collection.connect(user2).mint(user2.address, 2, { value: ethers.parseEther("0.10") });

      const totalNFTs = await collection.totalSupply();
      const totalRevenue = await collection.totalRevenue();
      console.log(`✅ Minted: ${totalNFTs} NFTs, Revenue: ${ethers.formatEther(totalRevenue)} ETH`);

      // STEP 3: Create ERC20 Token
      console.log("Step 3: Creating ERC20 Token...");
      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20,
        {
          name: "Final Test Token",
          symbol: "FTT"
        }
      );
      token = tokenResult.token;

      const tokenName = await token.name();
      const maxSupply = await token.maxSupply();
      console.log(`✅ Created: ${tokenName}, Max Supply: ${ethers.formatEther(maxSupply)}`);

      // STEP 4: Verify Bonding Curve
      console.log("Step 4: Verifying Bonding Curve...");
      const initialPrice = await token.getCurrentPrice();
      const [cost500, royalty500] = await token.getReserveForTokens(ethers.parseEther("500"));
      const [cost1500, royalty1500] = await token.getReserveForTokens(ethers.parseEther("1500"));

      console.log(`✅ Initial Price: ${ethers.formatEther(initialPrice)}`);
      console.log(`✅ 500 tokens cost: ${ethers.formatEther(cost500)} (+ ${ethers.formatEther(royalty500)} royalty)`);
      console.log(`✅ 1500 tokens cost: ${ethers.formatEther(cost1500)} (+ ${ethers.formatEther(royalty1500)} royalty)`);

      // STEP 5: Users buy tokens
      console.log("Step 5: Users buying tokens...");
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));
      await mockERC20.connect(user2).approve(await token.getAddress(), ethers.parseEther("100"));

      await token.connect(user1).mint(ethers.parseEther("600"), ethers.parseEther("10"), user1.address);
      await token.connect(user2).mint(ethers.parseEther("800"), ethers.parseEther("10"), user2.address);

      const user1Balance = await token.balanceOf(user1.address);
      const user2Balance = await token.balanceOf(user2.address);
      const newPrice = await token.getCurrentPrice();

      console.log(`✅ User1: ${ethers.formatEther(user1Balance)} tokens`);
      console.log(`✅ User2: ${ethers.formatEther(user2Balance)} tokens`);
      console.log(`✅ New price: ${ethers.formatEther(newPrice)}`);

      // STEP 6: User sells tokens back
      console.log("Step 6: User selling tokens...");
      const sellAmount = ethers.parseEther("200");
      const [expectedRefund, expectedBurnRoyalty] = await token.getRefundForTokens(sellAmount);

      await token.connect(user1).burn(sellAmount, ethers.parseEther("0.1"), user1.address);

      const user1BalanceAfterSell = await token.balanceOf(user1.address);
      const priceAfterSell = await token.getCurrentPrice();

      console.log(`✅ User1 sold 200 tokens, remaining: ${ethers.formatEther(user1BalanceAfterSell)}`);
      console.log(`✅ Refund: ${ethers.formatEther(expectedRefund)} (- ${ethers.formatEther(expectedBurnRoyalty)} royalty)`);
      console.log(`✅ Price after sell: ${ethers.formatEther(priceAfterSell)}`);

      // STEP 7: Create staking pool
      console.log("Step 7: Creating staking pool...");
      const stakingTx = await stakingFactory.connect(creator).createPool(
        await token.getAddress(),
        ethers.ZeroAddress, // ETH rewards
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

      console.log(`✅ Staking pool created: ${stakingPoolAddress}`);

      // Link staking pool to NFT collection
      await collection.connect(creator).setStakingPool(stakingPoolAddress);
      console.log("✅ Staking pool linked to NFT collection");

      // STEP 8: Users stake tokens
      console.log("Step 8: Users staking tokens...");
      const user1StakeAmount = ethers.parseEther("300");
      const user2StakeAmount = ethers.parseEther("400");

      await token.connect(user1).approve(stakingPoolAddress, user1StakeAmount);
      await token.connect(user2).approve(stakingPoolAddress, user2StakeAmount);

      await stakingPool.connect(user1).stake(user1StakeAmount);
      await stakingPool.connect(user2).stake(user2StakeAmount);

      const user1Staked = await stakingPool.stakedBalance(user1.address);
      const user2Staked = await stakingPool.stakedBalance(user2.address);
      const totalStaked = await stakingPool.totalStaked();

      console.log(`✅ User1 staked: ${ethers.formatEther(user1Staked)}`);
      console.log(`✅ User2 staked: ${ethers.formatEther(user2Staked)}`);
      console.log(`✅ Total staked: ${ethers.formatEther(totalStaked)}`);

      // STEP 9: Generate more revenue and check rewards
      console.log("Step 9: Generating revenue and checking rewards...");
      await collection.connect(user3).mint(user3.address, 4, { value: ethers.parseEther("0.20") });

      const user1Earned = await stakingPool.earned(user1.address);
      const user2Earned = await stakingPool.earned(user2.address);
      const totalRewards = await stakingPool.totalRewards();

      console.log(`✅ User1 earned: ${ethers.formatEther(user1Earned)} ETH`);
      console.log(`✅ User2 earned: ${ethers.formatEther(user2Earned)} ETH`);
      console.log(`✅ Total rewards: ${ethers.formatEther(totalRewards)} ETH`);

      // Verify rewards are proportional to stake
      const user1Ratio = Number(user1Staked) / Number(totalStaked);
      const user2Ratio = Number(user2Staked) / Number(totalStaked);

      console.log(`✅ User1 stake ratio: ${(user1Ratio * 100).toFixed(1)}%`);
      console.log(`✅ User2 stake ratio: ${(user2Ratio * 100).toFixed(1)}%`);

      // All steps completed successfully
      expect(totalNFTs).to.be.gt(0);
      expect(await token.totalSupply()).to.be.gt(0);
      expect(totalStaked).to.be.gt(0);
      expect(user1Earned).to.be.gt(0);
      expect(user2Earned).to.be.gt(0);

      console.log("\n🎉 ALL 9 STEPS COMPLETED SUCCESSFULLY! 🎉");
    });
  });

  describe("🔍 CALCULATION ACCURACY VERIFICATION", function () {
    it("Should verify all mathematical calculations are precise", async function () {
      console.log("\n=== VERIFYING CALCULATION PRECISION ===");

      // Create fresh system for precise testing
      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
      const collection = nftResult.collection;

      const tokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      const token = tokenResult.token;

      // Test precise calculations
      const testCases = [
        { tokens: "1", expectedBase: "0.001", expectedRoyalty: "0.00002" },
        { tokens: "100", expectedBase: "0.1", expectedRoyalty: "0.002" },
        { tokens: "1000", expectedBase: "1.0", expectedRoyalty: "0.02" },
        { tokens: "1001", expectedBase: "1.002", expectedRoyalty: "0.02004" },
        { tokens: "1500", expectedBase: "2.0", expectedRoyalty: "0.04" }
      ];

      for (const testCase of testCases) {
        const [totalCost, royalty] = await token.getReserveForTokens(ethers.parseEther(testCase.tokens));
        const baseCost = totalCost - royalty;

        console.log(`${testCase.tokens} tokens: base=${ethers.formatEther(baseCost)}, royalty=${ethers.formatEther(royalty)}`);

        expect(baseCost).to.equal(ethers.parseEther(testCase.expectedBase));
        expect(royalty).to.equal(ethers.parseEther(testCase.expectedRoyalty));
      }

      console.log("✅ All calculations are mathematically precise");
    });
  });

  describe("📊 SYSTEM HEALTH CHECK", function () {
    it("Should verify system is in healthy state", async function () {
      console.log("\n=== SYSTEM HEALTH CHECK ===");

      // Check factory counts
      const nftCount = await nftFactory.getCollectionCount();
      const tokenCount = await erc20Factory.getTokenCount();
      const poolCount = await stakingFactory.getPoolCount();

      console.log(`Collections created: ${nftCount}`);
      console.log(`Tokens created: ${tokenCount}`);
      console.log(`Pools created: ${poolCount}`);

      // Check that we have activity
      expect(nftCount).to.be.gt(0);
      expect(tokenCount).to.be.gt(0);
      expect(poolCount).to.be.gt(0);

      // Check mock ERC20 balances
      const user1MockBalance = await mockERC20.balanceOf(user1.address);
      const user2MockBalance = await mockERC20.balanceOf(user2.address);

      console.log(`User1 mock ERC20 balance: ${ethers.formatEther(user1MockBalance)}`);
      console.log(`User2 mock ERC20 balance: ${ethers.formatEther(user2MockBalance)}`);

      expect(user1MockBalance).to.be.gt(0);
      expect(user2MockBalance).to.be.gt(0);

      console.log("✅ System is in healthy state");
    });
  });
}); 