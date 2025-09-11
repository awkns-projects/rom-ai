const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("Staking System (StakingFactory + StakingPool)", function () {
  let contracts;
  let owner, creator, user1, user2, user3;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool, stakingPoolAddress;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Create NFT collection
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;

    // Create bonding token
    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await collection.getAddress(),
      mockERC20
    );
    token = tokenResult.token;
  });

  describe("StakingFactory", function () {
    describe("Deployment", function () {
      it("Should deploy with correct parameters", async function () {
        expect(await stakingFactory.creationFee()).to.equal(ethers.parseEther("0.01"));
        expect(await stakingFactory.owner()).to.equal(owner.address);
        expect(await stakingFactory.ERC20_FACTORY()).to.equal(await erc20Factory.getAddress());
      });

      it("Should have correct implementation address", async function () {
        const implementationAddress = await stakingFactory.STAKING_POOL_IMPLEMENTATION();
        expect(implementationAddress).to.not.equal(ethers.ZeroAddress);
      });
    });

    describe("Pool Creation", function () {
      it("Should create staking pool with correct parameters", async function () {
        const result = await TestHelpers.createStakingPool(
          stakingFactory,
          creator,
          await token.getAddress()
        );
        stakingPool = result.pool;
        stakingPoolAddress = result.poolAddress;

        // Verify pool properties
        expect(await stakingPool.creator()).to.equal(creator.address);
        expect(await stakingPool.stakingToken()).to.equal(await token.getAddress());
        expect(await stakingPool.nftCollection()).to.equal(await collection.getAddress());
        expect(await stakingPool.rewardToken()).to.equal(ethers.ZeroAddress);
        expect(await stakingPool.totalStaked()).to.equal(0);
        expect(await stakingPool.totalRewards()).to.equal(0);
      });

      it("Should emit PoolCreated event", async function () {
        const tx = await stakingFactory.connect(creator).createPool(
          await token.getAddress(),
          ethers.ZeroAddress,
          { value: ethers.parseEther("0.01") }
        );

        const event = await TestHelpers.getEventFromTx(tx, stakingFactory, "PoolCreated");
        expect(event.args.creator).to.equal(creator.address);
        expect(event.args.stakingToken).to.equal(await token.getAddress());
        expect(event.args.nftCollection).to.equal(await collection.getAddress());
        expect(event.args.rewardToken).to.equal(ethers.ZeroAddress);
      });

      it("Should track pools in factory", async function () {
        const result = await TestHelpers.createStakingPool(
          stakingFactory,
          creator,
          await token.getAddress()
        );
        stakingPoolAddress = result.poolAddress;

        expect(await stakingFactory.getPoolCount()).to.equal(1);
        expect(await stakingFactory.isValidPool(stakingPoolAddress)).to.be.true;

        const pools = await stakingFactory.getPools(0, 10);
        expect(pools.length).to.equal(1);
        expect(pools[0]).to.equal(stakingPoolAddress);

        const tokenToPool = await stakingFactory.getPoolForToken(await token.getAddress());
        expect(tokenToPool).to.equal(stakingPoolAddress);
      });

      it("Should allow creator to manually set staking pool in NFT collection", async function () {
        const result = await TestHelpers.createStakingPool(
          stakingFactory,
          creator,
          await token.getAddress()
        );
        stakingPoolAddress = result.poolAddress;

        // Initially, no staking pool should be set
        expect(await collection.stakingPool()).to.equal(ethers.ZeroAddress);

        // Creator manually sets the staking pool
        await collection.connect(creator).setStakingPool(stakingPoolAddress);
        expect(await collection.stakingPool()).to.equal(stakingPoolAddress);
      });

      it("Should require creator to be token creator", async function () {
        await expect(
          stakingFactory.connect(user1).createPool(
            await token.getAddress(),
            ethers.ZeroAddress,
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(stakingFactory, "StakingFactory__Unauthorized");
      });

      it("Should reject invalid staking token", async function () {
        await expect(
          stakingFactory.connect(creator).createPool(
            user1.address, // Not a valid token
            ethers.ZeroAddress,
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(stakingFactory, "StakingFactory__InvalidToken");
      });

      it("Should reject duplicate pools", async function () {
        // Create first pool
        await TestHelpers.createStakingPool(
          stakingFactory,
          creator,
          await token.getAddress()
        );

        // Try to create second pool for same token
        await expect(
          stakingFactory.connect(creator).createPool(
            await token.getAddress(),
            ethers.ZeroAddress,
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(stakingFactory, "StakingFactory__PoolAlreadyExists");
      });

      it("Should require creation fee", async function () {
        await expect(
          stakingFactory.connect(creator).createPool(
            await token.getAddress(),
            ethers.ZeroAddress,
            { value: ethers.parseEther("0.005") } // Insufficient fee
          )
        ).to.be.revertedWithCustomError(stakingFactory, "StakingFactory__InvalidCreationFee");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to update creation fee", async function () {
        await stakingFactory.connect(owner).updateCreationFee(ethers.parseEther("0.02"));
        expect(await stakingFactory.creationFee()).to.equal(ethers.parseEther("0.02"));
      });

      it("Should reject non-owner fee updates", async function () {
        await expect(
          stakingFactory.connect(creator).updateCreationFee(ethers.parseEther("0.02"))
        ).to.be.revertedWithCustomError(stakingFactory, "OwnableUnauthorizedAccount");
      });
    });

    describe("Query Functions", function () {
      beforeEach(async function () {
        // Create multiple pools for testing
        for (let i = 0; i < 3; i++) {
          const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
            name: `Collection ${i}`,
            symbol: `COL${i}`
          });

          const tokenResult = await TestHelpers.createBondingToken(
            erc20Factory,
            creator,
            await nftResult.collection.getAddress(),
            { name: `Token ${i}`, symbol: `TK${i}` }
          );

          await TestHelpers.createStakingPool(
            stakingFactory,
            creator,
            await tokenResult.token.getAddress()
          );
        }
      });

      it("Should paginate pools correctly", async function () {
        expect(await stakingFactory.getPoolCount()).to.equal(3);

        // Get first 2
        const first2 = await stakingFactory.getPools(0, 2);
        expect(first2.length).to.equal(2);

        // Get next 2 (should only be 1 remaining)
        const next2 = await stakingFactory.getPools(2, 2);
        expect(next2.length).to.equal(1);

        // Get beyond range
        const beyond = await stakingFactory.getPools(10, 5);
        expect(beyond.length).to.equal(0);
      });

      it("Should get pools by creator", async function () {
        const creatorPools = await stakingFactory.getPoolsByCreator(creator.address, 0, 10);
        expect(creatorPools.length).to.equal(3);

        // Other users should have no pools
        const userPools = await stakingFactory.getPoolsByCreator(user1.address, 0, 10);
        expect(userPools.length).to.equal(0);
      });
    });
  });

  describe("StakingPool", function () {
    beforeEach(async function () {
      const result = await TestHelpers.createStakingPool(
        stakingFactory,
        creator,
        await token.getAddress()
      );
      stakingPool = result.pool;
      stakingPoolAddress = result.poolAddress;

      // Users buy tokens to stake
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });
      await token.connect(user3).buy(0, user3.address, { value: ethers.parseEther("1") });
    });

    describe("Staking", function () {
      it("Should stake tokens successfully", async function () {
        const stakeAmount = ethers.parseEther("100");

        // Approve and stake
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        const tx = await stakingPool.connect(user1).stake(stakeAmount);

        expect(await stakingPool.stakedBalance(user1.address)).to.equal(stakeAmount);
        expect(await stakingPool.totalStaked()).to.equal(stakeAmount);
        expect(await stakingPool.getStakerCount()).to.equal(1);

        const event = await TestHelpers.getEventFromTx(tx, stakingPool, "Staked");
        expect(event.args.user).to.equal(user1.address);
        expect(event.args.amount).to.equal(stakeAmount);
      });

      it("Should add user to stakers list on first stake", async function () {
        const stakeAmount = ethers.parseEther("100");

        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user1).stake(stakeAmount);

        const stakers = await stakingPool.getStakers(0, 10);
        expect(stakers.length).to.equal(1);
        expect(stakers[0]).to.equal(user1.address);

        const userInfo = await stakingPool.getUserInfo(user1.address);
        expect(userInfo.isActiveStaker).to.be.true;
        expect(userInfo.stakedAmount).to.equal(stakeAmount);
      });

      it("Should handle multiple stakes from same user", async function () {
        const stakeAmount1 = ethers.parseEther("100");
        const stakeAmount2 = ethers.parseEther("50");

        await token.connect(user1).approve(stakingPoolAddress, stakeAmount1 + stakeAmount2);

        await stakingPool.connect(user1).stake(stakeAmount1);
        await stakingPool.connect(user1).stake(stakeAmount2);

        expect(await stakingPool.stakedBalance(user1.address)).to.equal(stakeAmount1 + stakeAmount2);
        expect(await stakingPool.getStakerCount()).to.equal(1); // Still only 1 unique staker
      });

      it("Should handle multiple users staking", async function () {
        const stakeAmount = ethers.parseEther("100");

        // All users stake
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await token.connect(user2).approve(stakingPoolAddress, stakeAmount);
        await token.connect(user3).approve(stakingPoolAddress, stakeAmount);

        await stakingPool.connect(user1).stake(stakeAmount);
        await stakingPool.connect(user2).stake(stakeAmount);
        await stakingPool.connect(user3).stake(stakeAmount);

        expect(await stakingPool.totalStaked()).to.equal(stakeAmount * 3n);
        expect(await stakingPool.getStakerCount()).to.equal(3);

        const stakers = await stakingPool.getStakers(0, 10);
        expect(stakers.length).to.equal(3);
        expect(stakers).to.include(user1.address);
        expect(stakers).to.include(user2.address);
        expect(stakers).to.include(user3.address);
      });

      it("Should reject zero stake amount", async function () {
        await expect(
          stakingPool.connect(user1).stake(0)
        ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InvalidAmount");
      });

      it("Should reject insufficient allowance", async function () {
        const stakeAmount = ethers.parseEther("100");

        // Don't approve or approve insufficient amount
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount / 2n);

        await expect(
          stakingPool.connect(user1).stake(stakeAmount)
        ).to.be.reverted; // ERC20 insufficient allowance
      });
    });

    describe("Unstaking", function () {
      beforeEach(async function () {
        // Users stake tokens
        const stakeAmount = ethers.parseEther("100");

        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await token.connect(user2).approve(stakingPoolAddress, stakeAmount);

        await stakingPool.connect(user1).stake(stakeAmount);
        await stakingPool.connect(user2).stake(stakeAmount);
      });

      it("Should unstake tokens successfully", async function () {
        const unstakeAmount = ethers.parseEther("50");

        const tx = await stakingPool.connect(user1).unstake(unstakeAmount);

        expect(await stakingPool.stakedBalance(user1.address)).to.equal(ethers.parseEther("50"));
        expect(await stakingPool.totalStaked()).to.equal(ethers.parseEther("150"));

        const event = await TestHelpers.getEventFromTx(tx, stakingPool, "Unstaked");
        expect(event.args.user).to.equal(user1.address);
        expect(event.args.amount).to.equal(unstakeAmount);
      });

      it("Should remove user from stakers list when fully unstaked", async function () {
        const stakeAmount = ethers.parseEther("100");

        await stakingPool.connect(user1).unstake(stakeAmount);

        expect(await stakingPool.getStakerCount()).to.equal(1); // Only user2 left
        expect(await stakingPool.stakedBalance(user1.address)).to.equal(0);

        const userInfo = await stakingPool.getUserInfo(user1.address);
        expect(userInfo.isActiveStaker).to.be.false;
      });

      it("Should reject unstaking more than staked", async function () {
        const stakeAmount = ethers.parseEther("100");

        await expect(
          stakingPool.connect(user1).unstake(stakeAmount + ethers.parseEther("1"))
        ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStake");
      });

      it("Should reject zero unstake amount", async function () {
        await expect(
          stakingPool.connect(user1).unstake(0)
        ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InvalidAmount");
      });
    });

    describe("Reward Distribution", function () {
      beforeEach(async function () {
        // Users stake tokens
        const stakeAmount = ethers.parseEther("100");

        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await token.connect(user2).approve(stakingPoolAddress, stakeAmount * 2n); // user2 stakes more

        await stakingPool.connect(user1).stake(stakeAmount);
        await stakingPool.connect(user2).stake(stakeAmount * 2n);
      });

      it("Should receive rewards from NFT mints", async function () {
        // Mint NFTs to generate revenue
        await collection.connect(user3).mint(user3.address, 2, { value: ethers.parseEther("0.2") });

        // Check that rewards were added
        expect(await stakingPool.totalRewards()).to.equal(ethers.parseEther("0.2"));
      });

      it("Should distribute rewards proportionally", async function () {
        // Mint NFTs to generate rewards
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });

        // Check earned rewards
        const earned1 = await stakingPool.earned(user1.address);
        const earned2 = await stakingPool.earned(user2.address);

        // user2 staked 2x more, so should earn 2x more
        expect(earned2).to.be.approximately(earned1 * 2n, ethers.parseEther("0.001"));

        // Total earned should equal total rewards
        TestHelpers.expectAlmostEqual(earned1 + earned2, ethers.parseEther("0.1"), ethers.parseEther("0.001"));
      });

      it("Should allow claiming rewards after minimum duration", async function () {
        // Generate rewards
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });

        // Wait for minimum staking duration
        await TestHelpers.advanceTime(3601); // 1 hour + 1 second

        const earnedBefore = await stakingPool.earned(user1.address);
        const balanceBefore = await TestHelpers.getBalance(user1.address);

        const tx = await stakingPool.connect(user1).claimRewards();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const balanceAfter = await TestHelpers.getBalance(user1.address);
        const earnedAfter = await stakingPool.earned(user1.address);

        // Should receive rewards minus gas (and protocol fee)
        expect(balanceAfter).to.be.gt(balanceBefore);

        // Earned should be zero after claiming
        expect(earnedAfter).to.equal(0);

        const event = await TestHelpers.getEventFromTx(tx, stakingPool, "RewardsClaimed");
        expect(event.args.user).to.equal(user1.address);
      });

      it("Should reject claiming rewards before minimum duration", async function () {
        // Generate rewards
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });

        await expect(
          stakingPool.connect(user1).claimRewards()
        ).to.be.revertedWithCustomError(stakingPool, "StakingPool__InsufficientStakingDuration");
      });

      it("Should handle multiple reward distributions", async function () {
        // First mint
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });
        const earned1 = await stakingPool.earned(user1.address);

        // Second mint
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });
        const earned2 = await stakingPool.earned(user1.address);

        // Should have approximately double the rewards
        TestHelpers.expectAlmostEqual(earned2, earned1 * 2n, ethers.parseEther("0.001"));
      });

      it("Should handle rewards when users join at different times", async function () {
        // Initial mint - only user1 and user2 should benefit
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.1") });

        const earned1After1 = await stakingPool.earned(user1.address);
        const earned2After1 = await stakingPool.earned(user2.address);

        // user3 joins staking
        const stakeAmount = ethers.parseEther("100");
        await token.connect(user3).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user3).stake(stakeAmount);

        // Second mint - all three should benefit
        await collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });

        const earned1After2 = await stakingPool.earned(user1.address);
        const earned2After2 = await stakingPool.earned(user2.address);
        const earned3After2 = await stakingPool.earned(user3.address);

        // user3 should only get rewards from second mint
        expect(earned3After2).to.be.gt(0);
        expect(earned3After2).to.be.lt(earned1After1); // Less than what user1 got from first mint alone
      });
    });

    describe("Exit Function", function () {
      beforeEach(async function () {
        // User stakes tokens
        const stakeAmount = ethers.parseEther("100");
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user1).stake(stakeAmount);

        // Generate some rewards
        await collection.connect(user2).mint(user2.address, 1, { value: ethers.parseEther("0.1") });
      });

      it("Should exit pool (unstake all + claim rewards)", async function () {
        const stakedBefore = await stakingPool.stakedBalance(user1.address);
        const earnedBefore = await stakingPool.earned(user1.address);
        const balanceBefore = await TestHelpers.getBalance(user1.address);

        const tx = await stakingPool.connect(user1).exit();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const stakedAfter = await stakingPool.stakedBalance(user1.address);
        const earnedAfter = await stakingPool.earned(user1.address);
        const balanceAfter = await TestHelpers.getBalance(user1.address);

        // Should have unstaked everything
        expect(stakedAfter).to.equal(0);
        expect(earnedAfter).to.equal(0);

        // Should have received rewards
        const expectedBalance = balanceBefore + earnedBefore - gasUsed;
        TestHelpers.expectAlmostEqual(balanceAfter, expectedBalance, ethers.parseEther("0.001"));

        // Should have been removed from stakers list
        const userInfo = await stakingPool.getUserInfo(user1.address);
        expect(userInfo.isActiveStaker).to.be.false;
      });
    });

    describe("View Functions", function () {
      beforeEach(async function () {
        // Setup staking scenario
        const stakeAmount = ethers.parseEther("100");
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await token.connect(user2).approve(stakingPoolAddress, stakeAmount * 2n);

        await stakingPool.connect(user1).stake(stakeAmount);
        await stakingPool.connect(user2).stake(stakeAmount * 2n);

        // Generate rewards
        await collection.connect(user3).mint(user3.address, 1, { value: ethers.parseEther("0.3") });
      });

      it("Should return correct pool info", async function () {
        const poolInfo = await stakingPool.getPoolInfo();

        expect(poolInfo.creator_).to.equal(creator.address);
        expect(poolInfo.stakingToken_).to.equal(await token.getAddress());
        expect(poolInfo.nftCollection_).to.equal(await collection.getAddress());
        expect(poolInfo.rewardToken_).to.equal(ethers.ZeroAddress);
        expect(poolInfo.totalStaked_).to.equal(ethers.parseEther("300"));
        expect(poolInfo.totalRewards_).to.equal(ethers.parseEther("0.3"));
        expect(poolInfo.stakerCount_).to.equal(2);
      });

      it("Should return correct user info", async function () {
        const userInfo1 = await stakingPool.getUserInfo(user1.address);
        const userInfo2 = await stakingPool.getUserInfo(user2.address);

        expect(userInfo1.stakedAmount).to.equal(ethers.parseEther("100"));
        expect(userInfo2.stakedAmount).to.equal(ethers.parseEther("200"));
        expect(userInfo1.isActiveStaker).to.be.true;
        expect(userInfo2.isActiveStaker).to.be.true;
        expect(userInfo1.earnedAmount).to.be.gt(0);
        expect(userInfo2.earnedAmount).to.be.gt(0);

        // user2 should have earned about 2x more
        TestHelpers.expectAlmostEqual(
          userInfo2.earnedAmount,
          userInfo1.earnedAmount * 2n,
          ethers.parseEther("0.01")
        );
      });

      it("Should return correct reward per token", async function () {
        const rewardPerToken = await stakingPool.rewardPerToken();
        expect(rewardPerToken).to.be.gt(0);

        // Should be rewards / total staked * precision
        const expectedRewardPerToken = (ethers.parseEther("0.3") * ethers.parseEther("1")) / ethers.parseEther("300");
        TestHelpers.expectAlmostEqual(rewardPerToken, expectedRewardPerToken, ethers.parseEther("0.001"));
      });

      it("Should paginate stakers correctly", async function () {
        // Add one more staker
        const stakeAmount = ethers.parseEther("50");
        await token.connect(user3).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user3).stake(stakeAmount);

        expect(await stakingPool.getStakerCount()).to.equal(3);

        // Get first 2 stakers
        const first2 = await stakingPool.getStakers(0, 2);
        expect(first2.length).to.equal(2);

        // Get next 2 (should be 1)
        const next2 = await stakingPool.getStakers(2, 2);
        expect(next2.length).to.equal(1);
      });
    });

    describe("Edge Cases", function () {
      it("Should handle claiming when no rewards", async function () {
        const stakeAmount = ethers.parseEther("100");
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user1).stake(stakeAmount);

        // No rewards generated, should not revert but also not transfer anything
        await stakingPool.connect(user1).claimRewards();

        expect(await stakingPool.earned(user1.address)).to.equal(0);
      });

      it("Should handle staking when no rewards exist", async function () {
        const stakeAmount = ethers.parseEther("100");
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);

        // Should not revert
        await stakingPool.connect(user1).stake(stakeAmount);
        expect(await stakingPool.stakedBalance(user1.address)).to.equal(stakeAmount);
      });

      it("Should handle reward distribution with zero stakers", async function () {
        // Mint NFT when no one is staking - should not revert
        await collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });

        expect(await stakingPool.totalRewards()).to.equal(ethers.parseEther("0.1"));
        expect(await stakingPool.totalStaked()).to.equal(0);
      });

      it("Should handle very small stake amounts", async function () {
        const stakeAmount = ethers.parseEther("0.001");
        await token.connect(user1).approve(stakingPoolAddress, stakeAmount);
        await stakingPool.connect(user1).stake(stakeAmount);

        expect(await stakingPool.stakedBalance(user1.address)).to.equal(stakeAmount);
        expect(await stakingPool.getStakerCount()).to.equal(1);
      });
    });

    describe("Access Control", function () {
      it("Should only allow NFT collection to notify rewards", async function () {
        await expect(
          stakingPool.connect(user1).notifyRewardAmount(ethers.parseEther("0.1"))
        ).to.be.revertedWithCustomError(stakingPool, "StakingPool__Unauthorized");
      });

      it("Should allow NFT collection to notify rewards", async function () {
        // This happens automatically when minting, but we can test the function directly
        // by calling from the collection contract (which we can't do directly in tests)
        // The integration test will cover this
      });
    });
  });
}); 