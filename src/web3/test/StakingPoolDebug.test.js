const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔧 StakingPool Debug - Transfer Failure Investigation", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Create NFT collection
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
      name: "Debug Collection",
      symbol: "DEBUG",
      mintPrice: ethers.parseEther("0.1")
    });
    collection = nftResult.collection;

    // Create ERC20 token
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

    // Link staking pool to NFT collection
    await collection.connect(creator).setStakingPool(stakingPoolAddress);
  });

  it("Should debug the reward claiming transfer failure", async function () {
    console.log("\n=== DEBUGGING STAKING POOL TRANSFER FAILURE ===");

    // Initial setup
    await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
    await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("1"), user1.address);

    await token.connect(user1).approve(await stakingPool.getAddress(), ethers.parseEther("200"));
    await stakingPool.connect(user1).stake(ethers.parseEther("200"));

    console.log("✅ User1 staked 200 tokens");

    // Generate revenue
    await collection.connect(user2).mint(user2.address, 2, { value: ethers.parseEther("0.2") });
    console.log("✅ Generated revenue through NFT minting");

    // Check staking pool balance
    const stakingPoolAddress = await stakingPool.getAddress();
    const poolBalance = await ethers.provider.getBalance(stakingPoolAddress);
    console.log(`📊 Staking Pool ETH Balance: ${ethers.formatEther(poolBalance)} ETH`);

    // Check rewards earned
    const earnedRewards = await stakingPool.earned(user1.address);
    console.log(`📊 User1 Earned Rewards: ${ethers.formatEther(earnedRewards)} ETH`);

    // Check total rewards in pool
    const totalRewards = await stakingPool.totalRewards();
    console.log(`📊 Total Rewards in Pool: ${ethers.formatEther(totalRewards)} ETH`);

    // Check distributed rewards
    const distributedRewards = await stakingPool.distributedRewards();
    console.log(`📊 Already Distributed Rewards: ${ethers.formatEther(distributedRewards)} ETH`);

    // Check pending rewards
    const availableRewards = totalRewards - distributedRewards;
    console.log(`📊 Available Rewards: ${ethers.formatEther(availableRewards)} ETH`);

    // Check protocol fee calculation
    const protocolFeeBps = await stakingPool.protocolFeeBps();
    const protocolFee = (earnedRewards * BigInt(protocolFeeBps)) / 10000n;
    const netReward = earnedRewards - protocolFee;

    console.log(`📊 Protocol Fee BPS: ${protocolFeeBps}`);
    console.log(`📊 Protocol Fee: ${ethers.formatEther(protocolFee)} ETH`);
    console.log(`📊 Net Reward: ${ethers.formatEther(netReward)} ETH`);

    // Check if pool has enough balance
    const totalNeeded = protocolFee + netReward;
    console.log(`📊 Total ETH Needed: ${ethers.formatEther(totalNeeded)} ETH`);
    console.log(`📊 Pool has enough balance: ${poolBalance >= totalNeeded}`);

    // Try to understand the failure
    if (poolBalance < totalNeeded) {
      console.log("❌ ISSUE: Pool doesn't have enough ETH to pay rewards!");
      console.log(`   Shortfall: ${ethers.formatEther(totalNeeded - poolBalance)} ETH`);
    } else if (earnedRewards === 0n) {
      console.log("❌ ISSUE: No rewards earned by user!");
    } else {
      console.log("✅ Pool should have enough ETH, investigating other causes...");

      // Wait for minimum staking duration
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine", []);

      try {
        // Try claiming rewards
        const claimTx = await stakingPool.connect(user1).claimRewards();
        await claimTx.wait();
        console.log("✅ Rewards claimed successfully!");

        const newPoolBalance = await ethers.provider.getBalance(stakingPoolAddress);
        console.log(`📊 Pool Balance After Claim: ${ethers.formatEther(newPoolBalance)} ETH`);
      } catch (error) {
        console.log(`❌ Claim failed: ${error.message}`);

        // Check if it's a timing issue
        const stakingStartTime = await stakingPool.stakingStartTime(user1.address);
        const currentTime = await ethers.provider.getBlock('latest').then(block => block.timestamp);
        const minDuration = await stakingPool.MINIMUM_STAKE_DURATION();

        console.log(`📊 Staking Start Time: ${stakingStartTime}`);
        console.log(`📊 Current Time: ${currentTime}`);
        console.log(`📊 Minimum Duration: ${minDuration}`);
        console.log(`📊 Time Elapsed: ${currentTime - Number(stakingStartTime)}`);
        console.log(`📊 Duration Met: ${currentTime >= Number(stakingStartTime) + Number(minDuration)}`);
      }
    }

    // Check NFT collection revenue flow
    const collectionBalance = await ethers.provider.getBalance(await collection.getAddress());
    const totalRevenue = await collection.totalRevenue();
    const distributedRevenue = await collection.distributedRevenue();

    console.log(`📊 NFT Collection Balance: ${ethers.formatEther(collectionBalance)} ETH`);
    console.log(`📊 NFT Total Revenue: ${ethers.formatEther(totalRevenue)} ETH`);
    console.log(`📊 NFT Distributed Revenue: ${ethers.formatEther(distributedRevenue)} ETH`);

    console.log("\n=== DEBUG COMPLETE ===");
  });

  it("Should test manual reward distribution", async function () {
    console.log("\n=== TESTING MANUAL REWARD DISTRIBUTION ===");

    // Setup staking
    await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
    await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("1"), user1.address);
    await token.connect(user1).approve(await stakingPool.getAddress(), ethers.parseEther("200"));
    await stakingPool.connect(user1).stake(ethers.parseEther("200"));

    // Send ETH directly to staking pool to test reward distribution
    await owner.sendTransaction({
      to: await stakingPool.getAddress(),
      value: ethers.parseEther("1.0") // Send 1 ETH directly
    });

    const poolBalance = await ethers.provider.getBalance(await stakingPool.getAddress());
    console.log(`📊 Pool Balance After Direct Transfer: ${ethers.formatEther(poolBalance)} ETH`);

    // Manually notify reward amount (simulating what NFT collection should do)
    try {
      await stakingPool.connect(await collection.getAddress()).notifyRewardAmount(ethers.parseEther("0.5"));
      console.log("✅ Manual reward notification successful");
    } catch (error) {
      console.log(`❌ Manual reward notification failed: ${error.message}`);

      // Try from collection contract instead
      try {
        // The collection should call this, not us directly
        console.log("⚠️ Reward notification must come from linked NFT collection");
      } catch (e) {
        console.log(`❌ Collection notification failed: ${e.message}`);
      }
    }

    const earnedAfterNotify = await stakingPool.earned(user1.address);
    console.log(`📊 Earned After Notification: ${ethers.formatEther(earnedAfterNotify)} ETH`);
  });
}); 