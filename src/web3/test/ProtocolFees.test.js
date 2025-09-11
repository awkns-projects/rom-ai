const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("Protocol Fees", function () {
  let contracts;
  let owner, creator, user1, user2, protocolFeeRecipient;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3: protocolFeeRecipient, nftFactory, erc20Factory, stakingFactory } = contracts);
  });

  describe("NFT Minting Protocol Fees", function () {
    beforeEach(async function () {
      const result = await TestHelpers.createNFTCollection(nftFactory, creator);
      collection = result.collection;
    });

    it("Should charge protocol fee on NFT mints", async function () {
      const protocolFeeRecipientBalanceBefore = await TestHelpers.getBalance(owner.address);

      // Mint 1 NFT for 0.1 ETH
      await collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });

      const protocolFeeRecipientBalanceAfter = await TestHelpers.getBalance(owner.address);

      // Protocol fee should be 2.5% of 0.1 ETH = 0.0025 ETH
      const expectedProtocolFee = ethers.parseEther("0.0025");
      const actualProtocolFee = protocolFeeRecipientBalanceAfter - protocolFeeRecipientBalanceBefore;

      TestHelpers.expectAlmostEqual(actualProtocolFee, expectedProtocolFee, ethers.parseEther("0.0001"));

      // Net revenue should be 0.1 - 0.0025 = 0.0975 ETH
      const expectedNetRevenue = ethers.parseEther("0.0975");
      expect(await collection.totalRevenue()).to.equal(expectedNetRevenue);
    });

    it("Should emit ProtocolFeePaid event", async function () {
      const tx = await collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });

      const event = await TestHelpers.getEventFromTx(tx, collection, "ProtocolFeePaid");
      expect(event.args.amount).to.equal(ethers.parseEther("0.0025")); // 2.5% of 0.1 ETH
    });

    it("Should handle zero protocol fee", async function () {
      // Update protocol fee to 0
      await nftFactory.connect(owner).updateProtocolFeeBps(0);

      // Create new collection with 0 protocol fee
      const result = await TestHelpers.createNFTCollection(nftFactory, creator);
      const newCollection = result.collection;

      const protocolFeeRecipientBalanceBefore = await TestHelpers.getBalance(owner.address);

      await newCollection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });

      const protocolFeeRecipientBalanceAfter = await TestHelpers.getBalance(owner.address);

      // No protocol fee should be charged
      expect(protocolFeeRecipientBalanceAfter).to.equal(protocolFeeRecipientBalanceBefore);

      // Full revenue should go to collection
      expect(await newCollection.totalRevenue()).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("Bonding Token Protocol Fees", function () {
    beforeEach(async function () {
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

    it("Should charge protocol fee on token buys", async function () {
      const protocolFeeRecipientBalanceBefore = await TestHelpers.getBalance(owner.address);

      // Buy tokens with 1 ETH
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });

      const protocolFeeRecipientBalanceAfter = await TestHelpers.getBalance(owner.address);

      // Protocol fee should be charged (exact amount depends on bonding curve calculation)
      expect(protocolFeeRecipientBalanceAfter).to.be.gt(protocolFeeRecipientBalanceBefore);
    });

    it("Should charge protocol fee on token sells", async function () {
      // First buy some tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      const protocolFeeRecipientBalanceBefore = await TestHelpers.getBalance(owner.address);

      // Sell half the tokens
      await token.connect(user1).sell(tokenBalance / 2n, 0, user1.address);

      const protocolFeeRecipientBalanceAfter = await TestHelpers.getBalance(owner.address);

      // Protocol fee should be charged on sell
      expect(protocolFeeRecipientBalanceAfter).to.be.gt(protocolFeeRecipientBalanceBefore);
    });

    it("Should emit ProtocolFeePaid events on trades", async function () {
      // Test buy
      const buyTx = await token.connect(user1).buyWithReserve(
        ethers.parseEther("0.1"),
        0,
        user1.address,
        { value: ethers.parseEther("0.2") } // Extra to cover protocol fee
      );

      const buyEvent = await TestHelpers.getEventFromTx(buyTx, token, "ProtocolFeePaid");
      expect(buyEvent.args.amount).to.be.gt(0);

      // Test sell
      const tokenBalance = await token.balanceOf(user1.address);
      const sellTx = await token.connect(user1).sell(tokenBalance / 2n, 0, user1.address);

      const sellEvent = await TestHelpers.getEventFromTx(sellTx, token, "ProtocolFeePaid");
      expect(sellEvent.args.amount).to.be.gt(0);
    });
  });

  describe("Staking Reward Protocol Fees", function () {
    beforeEach(async function () {
      // Setup complete system
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

      // User buys and stakes tokens
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
      const tokenBalance = await token.balanceOf(user1.address);

      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);
    });

    it("Should charge protocol fee on reward claims", async function () {
      // Generate rewards by minting NFTs
      await collection.connect(user2).mint(user2.address, 10, { value: ethers.parseEther("1") });

      const protocolFeeRecipientBalanceBefore = await TestHelpers.getBalance(owner.address);

      // Claim rewards
      await stakingPool.connect(user1).claimRewards();

      const protocolFeeRecipientBalanceAfter = await TestHelpers.getBalance(owner.address);

      // Protocol fee should be charged (1.5% of rewards)
      expect(protocolFeeRecipientBalanceAfter).to.be.gt(protocolFeeRecipientBalanceBefore);
    });

    it("Should emit ProtocolFeePaid event on reward claims", async function () {
      // Generate rewards
      await collection.connect(user2).mint(user2.address, 5, { value: ethers.parseEther("0.5") });

      // Claim rewards
      const tx = await stakingPool.connect(user1).claimRewards();

      const event = await TestHelpers.getEventFromTx(tx, stakingPool, "ProtocolFeePaid");
      expect(event.args.amount).to.be.gt(0);
    });

    it("Should calculate net rewards correctly after protocol fee", async function () {
      // Generate rewards
      await collection.connect(user2).mint(user2.address, 10, { value: ethers.parseEther("1") });

      const earnedBefore = await stakingPool.earned(user1.address);
      const expectedProtocolFee = (earnedBefore * 150n) / 10000n; // 1.5%
      const expectedNetReward = earnedBefore - expectedProtocolFee;

      const userBalanceBefore = await TestHelpers.getBalance(user1.address);

      const tx = await stakingPool.connect(user1).claimRewards();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const userBalanceAfter = await TestHelpers.getBalance(user1.address);
      const actualNetReward = userBalanceAfter - userBalanceBefore + gasUsed;

      TestHelpers.expectAlmostEqual(actualNetReward, expectedNetReward, ethers.parseEther("0.001"));
    });
  });

  describe("Protocol Fee Administration", function () {
    it("Should allow owner to update protocol fee recipients", async function () {
      await nftFactory.connect(owner).updateProtocolFeeRecipient(user1.address);
      expect(await nftFactory.protocolFeeRecipient()).to.equal(user1.address);

      await erc20Factory.connect(owner).updateProtocolFeeRecipient(user1.address);
      expect(await erc20Factory.protocolFeeRecipient()).to.equal(user1.address);

      await stakingFactory.connect(owner).updateProtocolFeeRecipient(user1.address);
      expect(await stakingFactory.protocolFeeRecipient()).to.equal(user1.address);
    });

    it("Should allow owner to update protocol fee rates", async function () {
      await nftFactory.connect(owner).updateProtocolFeeBps(500); // 5%
      expect(await nftFactory.protocolFeeBps()).to.equal(500);

      await erc20Factory.connect(owner).updateProtocolFeeBps(300); // 3%
      expect(await erc20Factory.protocolFeeBps()).to.equal(300);

      await stakingFactory.connect(owner).updateProtocolFeeBps(200); // 2%
      expect(await stakingFactory.protocolFeeBps()).to.equal(200);
    });

    it("Should reject protocol fee rates that are too high", async function () {
      await expect(
        nftFactory.connect(owner).updateProtocolFeeBps(1001) // > 10%
      ).to.be.revertedWith("Fee too high");

      await expect(
        erc20Factory.connect(owner).updateProtocolFeeBps(1001) // > 10%
      ).to.be.revertedWith("Fee too high");

      await expect(
        stakingFactory.connect(owner).updateProtocolFeeBps(1001) // > 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should reject non-owner attempts to update fees", async function () {
      await expect(
        nftFactory.connect(user1).updateProtocolFeeBps(100)
      ).to.be.revertedWithCustomError(nftFactory, "OwnableUnauthorizedAccount");

      await expect(
        erc20Factory.connect(user1).updateProtocolFeeRecipient(user1.address)
      ).to.be.revertedWithCustomError(erc20Factory, "OwnableUnauthorizedAccount");

      await expect(
        stakingFactory.connect(user1).updateProtocolFeeBps(100)
      ).to.be.revertedWithCustomError(stakingFactory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration with Existing Functionality", function () {
    it("Should maintain correct economics with protocol fees", async function () {
      // Setup complete system
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

      // Track protocol fee recipient balance
      const initialProtocolBalance = await TestHelpers.getBalance(owner.address);

      // User buys tokens (pays protocol fee)
      await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("2") });

      // User stakes tokens
      const tokenBalance = await token.balanceOf(user1.address);
      await token.connect(user1).approve(await stakingPool.getAddress(), tokenBalance);
      await stakingPool.connect(user1).stake(tokenBalance);

      // NFTs are minted (pays protocol fee, generates staking rewards)
      await collection.connect(user2).mint(user2.address, 20, { value: ethers.parseEther("2") });

      // User claims rewards (pays protocol fee)
      await stakingPool.connect(user1).claimRewards();

      // User sells some tokens (pays protocol fee)
      await stakingPool.connect(user1).unstake(tokenBalance / 2n);
      await token.connect(user1).sell(tokenBalance / 2n, 0, user1.address);

      const finalProtocolBalance = await TestHelpers.getBalance(owner.address);

      // Protocol should have earned fees from all operations
      expect(finalProtocolBalance).to.be.gt(initialProtocolBalance);

      // System should still function correctly
      expect(await token.totalSupply()).to.be.gt(0);
      expect(await collection.totalSupply()).to.equal(20);
      expect(await stakingPool.totalStaked()).to.be.gt(0);
    });
  });
}); 