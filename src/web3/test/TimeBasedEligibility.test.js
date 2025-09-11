const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("Time-Based Reward Eligibility", function () {
  let contracts;
  let owner, creator, user1, user2, user3;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory } = contracts);

    // Setup complete system
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;

    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await collection.getAddress(),
      mockERC20
    );
    token = tokenResult.token;

    const stakingResult = await TestHelpers.createStakingPool(
      stakingFactory,
      creator,
      await token.getAddress()
    );
    stakingPool = stakingResult.pool;
  });

  describe("Staking Start Time Tracking", function () {
    it("Should set staking start time on first stake", async function () {
      // User buys tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      // Get timestamp before staking
      const blockBefore = await ethers.provider.getBlock("latest");
      const timestampBefore = blockBefore.timestamp;

      // Stake tokens
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Check staking start time
      const stakingStartTime = await stakingPool.stakingStartTime(user1.address);
      expect(stakingStartTime).to.be.gte(timestampBefore);
      expect(stakingStartTime).to.be.lte(timestampBefore + 10); // Within 10 seconds
    });

    it("Should not update staking start time on additional stakes", async function () {
      // User buys tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("2") });
      const tokenBalance = await token.balanceOf(user1.address);
      const halfBalance = tokenBalance / 2n;

      // First stake
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(halfBalance);

      const initialStartTime = await stakingPool.stakingStartTime(user1.address);

      // Wait a bit and stake more
      await TestHelpers.advanceTime(100); // 100 seconds
      await stakingPool.connect(user1).stake(halfBalance);

      const finalStartTime = await stakingPool.stakingStartTime(user1.address);
      expect(finalStartTime).to.equal(initialStartTime);
    });

    it("Should reset staking start time when fully unstaked", async function () {
      // Setup stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      const initialStartTime = await stakingPool.stakingStartTime(user1.address);
      expect(initialStartTime).to.be.gt(0);

      // Fully unstake
      await stakingPool.connect(user1).unstake(tokenBalance);

      const finalStartTime = await stakingPool.stakingStartTime(user1.address);
      expect(finalStartTime).to.equal(0);
    });

    it("Should not reset staking start time on partial unstake", async function () {
      // Setup stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      const initialStartTime = await stakingPool.stakingStartTime(user1.address);

      // Partial unstake
      await stakingPool.connect(user1).unstake(tokenBalance / 2n);

      const finalStartTime = await stakingPool.stakingStartTime(user1.address);
      expect(finalStartTime).to.equal(initialStartTime);
    });
  });

  describe("Reward Eligibility Checking", function () {
    beforeEach(async function () {
      // User buys and stakes tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user2).mint(user2.address, 10, { value: ethers.parseEther("1") });
    });

    it("Should return false for eligibility before minimum duration", async function () {
      const [eligible, timeRemaining] = await stakingPool.isEligibleForRewards(user1.address);

      expect(eligible).to.be.false;
      expect(timeRemaining).to.be.gt(0);
      expect(timeRemaining).to.be.lte(3600); // Should be <= 1 hour
    });

    it("Should return true for eligibility after minimum duration", async function () {
      // Advance time by 1 hour + 1 second
      await TestHelpers.advanceTime(3601);

      const [eligible, timeRemaining] = await stakingPool.isEligibleForRewards(user1.address);

      expect(eligible).to.be.true;
      expect(timeRemaining).to.equal(0);
    });

    it("Should return correct time remaining", async function () {
      // Advance time by 30 minutes
      await TestHelpers.advanceTime(1800);

      const [eligible, timeRemaining] = await stakingPool.isEligibleForRewards(user1.address);

      expect(eligible).to.be.false;
      expect(timeRemaining).to.be.approximately(1800, 10); // ~30 minutes remaining
    });

    it("Should handle users who never staked", async function () {
      const [eligible, timeRemaining] = await stakingPool.isEligibleForRewards(user3.address);

      expect(eligible).to.be.false;
      expect(timeRemaining).to.equal(0);
    });

    it("Should use getTimeUntilEligible helper function", async function () {
      const timeRemaining = await stakingPool.getTimeUntilEligible(user1.address);
      const [, timeRemainingFromMain] = await stakingPool.isEligibleForRewards(user1.address);

      expect(timeRemaining).to.equal(timeRemainingFromMain);
    });
  });

  describe("Reward Claiming with Time Restriction", function () {
    beforeEach(async function () {
      // User buys and stakes tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user2).mint(user2.address, 10, { value: ethers.parseEther("1") });
    });

    it("Should reject reward claims before minimum duration", async function () {
      await expect(
        stakingPool.connect(user1).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");
    });

    it("Should allow reward claims after minimum duration", async function () {
      // Advance time by 1 hour + 1 second
      await TestHelpers.advanceTime(3601);

      const earnedBefore = await stakingPool.earned(user1.address);
      expect(earnedBefore).to.be.gt(0);

      // Should not revert
      await stakingPool.connect(user1).claimRewards();

      const earnedAfter = await stakingPool.earned(user1.address);
      expect(earnedAfter).to.equal(0);
    });

    it("Should reject claims for users who never staked", async function () {
      await expect(
        stakingPool.connect(user3).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");
    });

    it("Should allow claims exactly at minimum duration", async function () {
      // Advance time by exactly 1 hour
      await TestHelpers.advanceTime(3600);

      // Should not revert
      await stakingPool.connect(user1).claimRewards();
    });
  });

  describe("Exit Function with Time Restriction", function () {
    beforeEach(async function () {
      // User buys and stakes tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user2).mint(user2.address, 5, { value: ethers.parseEther("0.5") });
    });

    it("Should reject exit before minimum duration", async function () {
      await expect(
        stakingPool.connect(user1).exit()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");
    });

    it("Should allow exit after minimum duration", async function () {
      // Advance time by 1 hour + 1 second
      await TestHelpers.advanceTime(3601);

      const stakedBefore = await stakingPool.stakedBalance(user1.address);
      const earnedBefore = await stakingPool.earned(user1.address);

      expect(stakedBefore).to.be.gt(0);
      expect(earnedBefore).to.be.gt(0);

      // Should not revert
      await stakingPool.connect(user1).exit();

      const stakedAfter = await stakingPool.stakedBalance(user1.address);
      const earnedAfter = await stakingPool.earned(user1.address);

      expect(stakedAfter).to.equal(0);
      expect(earnedAfter).to.equal(0);
    });
  });

  describe("Multiple Users with Different Staking Times", function () {
    it("Should handle multiple users with different eligibility times", async function () {
      // User1 stakes first
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      let tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Advance time by 30 minutes
      await TestHelpers.advanceTime(1800);

      // User2 stakes 30 minutes later
      await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });
      tokenBalance = await token.balanceOf(user2.address);
      await token.connect(user2).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user2).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user3).mint(user3.address, 10, { value: ethers.parseEther("1") });

      // Check eligibility after 45 minutes from user1's stake (15 minutes from user2's stake)
      await TestHelpers.advanceTime(900);

      const [eligible1] = await stakingPool.isEligibleForRewards(user1.address);
      const [eligible2] = await stakingPool.isEligibleForRewards(user2.address);

      expect(eligible1).to.be.true;  // 75 minutes total
      expect(eligible2).to.be.false; // 15 minutes total

      // User1 can claim, user2 cannot
      await stakingPool.connect(user1).claimRewards(); // Should succeed

      await expect(
        stakingPool.connect(user2).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");
    });
  });

  describe("Re-staking After Full Unstake", function () {
    it("Should reset timer when re-staking after full unstake", async function () {
      // Initial stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      let tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Wait 45 minutes (not enough for eligibility)
      await TestHelpers.advanceTime(2700);

      // Fully unstake
      await stakingPool.connect(user1).unstake(tokenBalance);

      // Immediately re-stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user2).mint(user2.address, 5, { value: ethers.parseEther("0.5") });

      // Should not be eligible yet (timer reset)
      const [eligible] = await stakingPool.isEligibleForRewards(user1.address);
      expect(eligible).to.be.false;

      await expect(
        stakingPool.connect(user1).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");

      // Wait another hour and should be eligible
      await TestHelpers.advanceTime(3600);

      const [eligibleAfter] = await stakingPool.isEligibleForRewards(user1.address);
      expect(eligibleAfter).to.be.true;

      await stakingPool.connect(user1).claimRewards(); // Should succeed
    });
  });

  describe("Gaming Attack Prevention", function () {
    it("Should prevent front-running NFT mints for quick rewards", async function () {
      // Simulate the attack scenario

      // 1. Attacker sees NFT mint in mempool and front-runs with token buy + stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("5") });
      const tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // 2. NFT mint happens (generates rewards)
      await collection.connect(user2).mint(user2.address, 20, { value: ethers.parseEther("2") });

      // 3. Attacker tries to immediately claim rewards and exit
      await expect(
        stakingPool.connect(user1).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");

      await expect(
        stakingPool.connect(user1).exit()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");

      // 4. Attacker is forced to wait minimum duration
      const earnedRewards = await stakingPool.earned(user1.address);
      expect(earnedRewards).to.be.gt(0); // Rewards are there but locked

      // 5. After waiting, attacker can claim but the gaming incentive is reduced
      await TestHelpers.advanceTime(3601);
      await stakingPool.connect(user1).claimRewards(); // Now allowed
    });

    it("Should not prevent legitimate long-term stakers", async function () {
      // Legitimate user stakes
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // User waits patiently
      await TestHelpers.advanceTime(7200); // 2 hours

      // NFT mints happen
      await collection.connect(user2).mint(user2.address, 10, { value: ethers.parseEther("1") });

      // User can claim immediately since they've been staking long enough
      await stakingPool.connect(user1).claimRewards(); // Should succeed
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero rewards gracefully", async function () {
      // User stakes but no rewards generated
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Wait minimum duration
      await TestHelpers.advanceTime(3601);

      // Should be eligible but no rewards to claim
      const [eligible] = await stakingPool.isEligibleForRewards(user1.address);
      expect(eligible).to.be.true;

      const earned = await stakingPool.earned(user1.address);
      expect(earned).to.equal(0);

      // Should not revert but also not do anything
      await stakingPool.connect(user1).claimRewards();
    });

    it("Should handle minimum duration of exactly 1 hour", async function () {
      const MINIMUM_STAKE_DURATION = await stakingPool.MINIMUM_STAKE_DURATION();
      expect(MINIMUM_STAKE_DURATION).to.equal(3600); // 1 hour in seconds
    });

    it("Should handle block timestamp edge cases", async function () {
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // Generate rewards
      await collection.connect(user2).mint(user2.address, 5, { value: ethers.parseEther("0.5") });

      // Test exactly at the boundary
      await TestHelpers.advanceTime(3599); // 1 second before minimum

      await expect(
        stakingPool.connect(user1).claimRewards()
      ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");

      // Advance by 1 more second
      await TestHelpers.advanceTime(1);

      // Now should work
      await stakingPool.connect(user1).claimRewards();
    });
  });
}); 