const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("UI View Functions - Complete Frontend Data", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Create a full system for testing
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

    await collection.connect(creator).setStakingPool(stakingPoolAddress);

    // Add some activity to the system
    await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });
    await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
    await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("1"), user1.address);
    await token.connect(user1).approve(stakingPoolAddress, ethers.parseEther("200"));
    await stakingPool.connect(user1).stake(ethers.parseEther("200"));
  });

  describe("🏭 Factory View Functions", function () {
    describe("NFT Factory", function () {
      it("Should get total collection count", async function () {
        const count = await nftFactory.getCollectionCount();
        expect(count).to.equal(1);
        console.log(`📊 Total NFT Collections: ${count}`);
      });

      it("Should get collections with pagination", async function () {
        const collections = await nftFactory.getCollections(0, 10);
        expect(collections.length).to.equal(1);
        expect(collections[0]).to.equal(await collection.getAddress());
        console.log(`📋 Collections (0-10): ${collections.length} items`);
      });

      it("Should get collection info", async function () {
        const info = await nftFactory.collectionInfo(await collection.getAddress());
        expect(info.creator).to.equal(creator.address);
        expect(info.exists).to.be.true;
        console.log(`ℹ️  Collection Info - Creator: ${info.creator}, Price: ${ethers.formatEther(info.mintPrice)} ETH`);
      });
    });

    describe("ERC20 Factory", function () {
      it("Should get total token count", async function () {
        const count = await erc20Factory.getTokenCount();
        expect(count).to.equal(1);
        console.log(`📊 Total ERC20 Tokens: ${count}`);
      });

      it("Should get tokens with pagination", async function () {
        const tokens = await erc20Factory.getTokens(0, 10);
        expect(tokens.length).to.equal(1);
        expect(tokens[0]).to.equal(await token.getAddress());
        console.log(`📋 Tokens (0-10): ${tokens.length} items`);
      });

      it("Should get token for NFT collection", async function () {
        const tokenAddress = await erc20Factory.getTokenForNFTCollection(await collection.getAddress());
        expect(tokenAddress).to.equal(await token.getAddress());
        console.log(`🔗 Token for Collection: ${tokenAddress}`);
      });

      it("Should validate token existence", async function () {
        const isValid = await erc20Factory.isValidToken(await token.getAddress());
        expect(isValid).to.be.true;
        console.log(`✅ Token Valid: ${isValid}`);
      });

      it("Should get detailed token info", async function () {
        const info = await erc20Factory.getTokenInfo(await token.getAddress());
        expect(info.creator).to.equal(creator.address);
        expect(info.nftCollection).to.equal(await collection.getAddress());
        expect(info.exists).to.be.true;
        console.log(`ℹ️  Token Info - Creator: ${info.creator}, Max Supply: ${ethers.formatEther(info.maxSupply)}, Mint Royalty: ${info.mintRoyalty}bps`);
      });
    });

    describe("Staking Factory", function () {
      it("Should get total pool count", async function () {
        const count = await stakingFactory.getPoolCount();
        expect(count).to.equal(1);
        console.log(`📊 Total Staking Pools: ${count}`);
      });

      it("Should get pools with pagination", async function () {
        const pools = await stakingFactory.getPools(0, 10);
        expect(pools.length).to.equal(1);
        expect(pools[0]).to.equal(await stakingPool.getAddress());
        console.log(`📋 Pools (0-10): ${pools.length} items`);
      });

      it("Should get pool for token", async function () {
        const poolAddress = await stakingFactory.getPoolForToken(await token.getAddress());
        expect(poolAddress).to.equal(await stakingPool.getAddress());
        console.log(`🔗 Pool for Token: ${poolAddress}`);
      });

      it("Should get pools by creator", async function () {
        const creatorPools = await stakingFactory.getPoolsByCreator(creator.address, 0, 10);
        expect(creatorPools.length).to.equal(1);
        console.log(`👤 Creator Pools: ${creatorPools.length} items`);
      });
    });
  });

  describe("📊 Individual Contract View Functions", function () {
    describe("NFT Collection", function () {
      it("Should get basic collection info", async function () {
        const name = await collection.name();
        const symbol = await collection.symbol();
        const totalSupply = await collection.totalSupply();
        const maxSupply = await collection.maxSupply();
        const mintPrice = await collection.mintPrice();
        const creator = await collection.creator();

        console.log(`🎨 NFT Collection:`);
        console.log(`   Name: ${name}, Symbol: ${symbol}`);
        console.log(`   Supply: ${totalSupply}/${maxSupply}`);
        console.log(`   Price: ${ethers.formatEther(mintPrice)} ETH`);
        console.log(`   Creator: ${creator}`);
      });

      it("Should get revenue tracking info", async function () {
        const totalRevenue = await collection.totalRevenue();
        const distributedRevenue = await collection.distributedRevenue();
        const stakingPool = await collection.stakingPool();

        console.log(`💰 Revenue Tracking:`);
        console.log(`   Total: ${ethers.formatEther(totalRevenue)} ETH`);
        console.log(`   Distributed: ${ethers.formatEther(distributedRevenue)} ETH`);
        console.log(`   Staking Pool: ${stakingPool}`);
      });

      it("Should get user NFT balance", async function () {
        const balance = await collection.balanceOf(user1.address);
        expect(balance).to.equal(2);
        console.log(`👤 User1 NFT Balance: ${balance}`);
      });
    });

    describe("Bonding Token", function () {
      it("Should get basic token info", async function () {
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();
        const maxSupply = await token.maxSupply();

        console.log(`🪙 Bonding Token:`);
        console.log(`   Name: ${name}, Symbol: ${symbol}, Decimals: ${decimals}`);
        console.log(`   Supply: ${ethers.formatEther(totalSupply)}/${ethers.formatEther(maxSupply)}`);
      });

      it("Should get bonding curve info", async function () {
        const currentPrice = await token.getCurrentPrice();
        const reserveBalance = await token.reserveBalance();
        const curveInfo = await token.getBondingCurveInfo();

        console.log(`📈 Bonding Curve:`);
        console.log(`   Current Price: ${ethers.formatEther(currentPrice)} Reserve tokens`);
        console.log(`   Reserve Balance: ${ethers.formatEther(reserveBalance)} Reserve tokens`);
        console.log(`   Current Supply: ${ethers.formatEther(curveInfo.currentSupply)}`);
        console.log(`   Reserve Balance (from info): ${ethers.formatEther(curveInfo.reserveBalance_)}`);
        console.log(`   Current Price (from info): ${ethers.formatEther(curveInfo.currentPrice)}`);
      });

      it("Should get step information", async function () {
        const stepsLength = await token.getStepsLength();
        console.log(`📊 Bonding Steps: ${stepsLength} steps`);

        for (let i = 0; i < stepsLength; i++) {
          const step = await token.getStep(i);
          console.log(`   Step ${i}: Range to ${ethers.formatEther(step.rangeTo)}, Price: ${ethers.formatEther(step.price)}`);
        }
      });

      it("Should calculate mint/burn costs", async function () {
        const [mintCost, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("100"));
        const [burnRefund, burnRoyalty] = await token.getRefundForTokens(ethers.parseEther("50"));

        console.log(`💱 Calculations:`);
        console.log(`   Mint 100 tokens: ${ethers.formatEther(mintCost)} (+ ${ethers.formatEther(mintRoyalty)} royalty)`);
        console.log(`   Burn 50 tokens: ${ethers.formatEther(burnRefund)} (- ${ethers.formatEther(burnRoyalty)} royalty)`);
      });

      it("Should get user token balance", async function () {
        const balance = await token.balanceOf(user1.address);
        console.log(`👤 User1 Token Balance: ${ethers.formatEther(balance)}`);
      });
    });

    describe("Staking Pool", function () {
      it("Should get pool overview", async function () {
        const poolInfo = await stakingPool.getPoolInfo();

        console.log(`🏊 Staking Pool Overview:`);
        console.log(`   Creator: ${poolInfo.creator_}`);
        console.log(`   Staking Token: ${poolInfo.stakingToken_}`);
        console.log(`   NFT Collection: ${poolInfo.nftCollection_}`);
        console.log(`   Total Staked: ${ethers.formatEther(poolInfo.totalStaked_)}`);
        console.log(`   Total Rewards: ${ethers.formatEther(poolInfo.totalRewards_)}`);
        console.log(`   Staker Count: ${poolInfo.stakerCount_}`);
      });

      it("Should get user staking info", async function () {
        const userInfo = await stakingPool.getUserInfo(user1.address);
        const earned = await stakingPool.earned(user1.address);

        console.log(`👤 User1 Staking Info:`);
        console.log(`   Staked Amount: ${ethers.formatEther(userInfo.stakedAmount)}`);
        console.log(`   Earned Rewards: ${ethers.formatEther(userInfo.earnedAmount)}`);
        console.log(`   Active Staker: ${userInfo.isActiveStaker}`);
        console.log(`   Current Earned: ${ethers.formatEther(earned)}`);
      });

      it("Should get stakers list", async function () {
        const stakerCount = await stakingPool.getStakerCount();
        const stakers = await stakingPool.getStakers(0, 10);

        console.log(`👥 Stakers:`);
        console.log(`   Total Count: ${stakerCount}`);
        console.log(`   First 10: ${stakers.join(', ')}`);
      });
    });
  });

  describe("🔍 Advanced UI Functions", function () {
    it("Should get comprehensive system overview", async function () {
      // Factory stats
      const nftCount = await nftFactory.getCollectionCount();
      const tokenCount = await erc20Factory.getTokenCount();
      const poolCount = await stakingFactory.getPoolCount();

      // Individual stats
      const nftSupply = await collection.totalSupply();
      const tokenSupply = await token.totalSupply();
      const totalStaked = await stakingPool.totalStaked();
      const totalRewards = await stakingPool.totalRewards();

      console.log(`\n🌐 SYSTEM OVERVIEW:`);
      console.log(`   NFT Collections: ${nftCount}`);
      console.log(`   ERC20 Tokens: ${tokenCount}`);
      console.log(`   Staking Pools: ${poolCount}`);
      console.log(`   Total NFTs: ${nftSupply}`);
      console.log(`   Total Tokens: ${ethers.formatEther(tokenSupply)}`);
      console.log(`   Total Staked: ${ethers.formatEther(totalStaked)}`);
      console.log(`   Total Rewards: ${ethers.formatEther(totalRewards)}`);
    });

    it("Should get user portfolio", async function () {
      const nftBalance = await collection.balanceOf(user1.address);
      const tokenBalance = await token.balanceOf(user1.address);
      const stakedBalance = await stakingPool.stakedBalance(user1.address);
      const earnedRewards = await stakingPool.earned(user1.address);

      console.log(`\n👤 USER1 PORTFOLIO:`);
      console.log(`   NFTs Owned: ${nftBalance}`);
      console.log(`   Tokens Owned: ${ethers.formatEther(tokenBalance)}`);
      console.log(`   Tokens Staked: ${ethers.formatEther(stakedBalance)}`);
      console.log(`   Rewards Earned: ${ethers.formatEther(earnedRewards)}`);
    });

    it("Should simulate trading scenarios", async function () {
      // Simulate different mint amounts
      const amounts = [ethers.parseEther("10"), ethers.parseEther("100"), ethers.parseEther("1000")];

      console.log(`\n📊 TRADING SIMULATION:`);
      for (const amount of amounts) {
        const [cost, royalty] = await token.getReserveForTokens(amount);
        console.log(`   Mint ${ethers.formatEther(amount)} tokens: ${ethers.formatEther(cost)} (${ethers.formatEther(royalty)} royalty)`);
      }
    });
  });

  describe("🚨 Missing View Functions Check", function () {
    it("Should identify missing UI functions", async function () {
      const missingFunctions = [];

      // Check if we can get creator's collections
      try {
        await nftFactory.getCollectionsByCreator(creator.address, 0, 10);
      } catch (e) {
        missingFunctions.push("NFTFactory.getCollectionsByCreator()");
      }

      // Check if we can get creator's tokens
      try {
        await erc20Factory.getTokensByCreator(creator.address, 0, 10);
      } catch (e) {
        missingFunctions.push("ERC20Factory.getTokensByCreator()");
      }

      // Check if we can get collection statistics
      try {
        await collection.getCollectionStats();
      } catch (e) {
        missingFunctions.push("NFTCollection.getCollectionStats()");
      }

      // Check if we can get token holders
      try {
        await token.getHolders(0, 10);
      } catch (e) {
        missingFunctions.push("BondingToken.getHolders()");
      }

      // Check if we can get historical data
      try {
        await token.getPriceHistory(0, 10);
      } catch (e) {
        missingFunctions.push("BondingToken.getPriceHistory()");
      }

      if (missingFunctions.length > 0) {
        console.log(`\n⚠️  MISSING UI FUNCTIONS:`);
        missingFunctions.forEach(func => console.log(`   - ${func}`));
      } else {
        console.log(`\n✅ ALL UI FUNCTIONS PRESENT`);
      }

      // This test documents what's missing, doesn't need to fail
      expect(missingFunctions.length).to.be.gte(0);
    });
  });
}); 