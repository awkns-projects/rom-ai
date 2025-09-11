const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("New UI Functions Test", function () {
  let contracts, owner, creator, user1, user2, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token, stakingPool;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    // Create test data
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;

    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await collection.getAddress(),
      mockERC20
    );
    token = tokenResult.token;

    // Add some activity
    await collection.connect(user1).mint(user1.address, 1, { value: ethers.parseEther("0.1") });
    await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
    await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);
  });

  describe("🆕 Newly Implemented UI Functions", function () {
    it("Should get collections by creator", async function () {
      const creatorCollections = await nftFactory.getCollectionsByCreator(creator.address, 0, 10);
      expect(creatorCollections.length).to.equal(1);
      expect(creatorCollections[0]).to.equal(await collection.getAddress());
      console.log(`✅ Collections by creator: ${creatorCollections.length}`);
    });

    it("Should get tokens by creator", async function () {
      const creatorTokens = await erc20Factory.getTokensByCreator(creator.address, 0, 10);
      expect(creatorTokens.length).to.equal(1);
      expect(creatorTokens[0]).to.equal(await token.getAddress());
      console.log(`✅ Tokens by creator: ${creatorTokens.length}`);
    });

    it("Should get collection statistics", async function () {
      const stats = await collection.getCollectionStats();
      console.log(`✅ Collection Stats:`);
      console.log(`   Total Minted: ${stats.totalMinted}`);
      console.log(`   Max Supply: ${stats.maxSupply_}`);
      console.log(`   Mint Price: ${ethers.formatEther(stats.mintPrice_)} ETH`);
      console.log(`   Total Revenue: ${ethers.formatEther(stats.totalRevenue_)} ETH`);
      console.log(`   Pending Revenue: ${ethers.formatEther(stats.pendingRevenueAmount)} ETH`);
      console.log(`   Has Staking Pool: ${stats.hasStakingPool}`);

      expect(stats.totalMinted).to.equal(1);
      expect(stats.totalRevenue_).to.be.gt(0);
    });

    it("Should get token holders", async function () {
      const holderCount = await token.getHolderCount();
      const holders = await token.getHolders(0, 10);

      console.log(`✅ Token Holders:`);
      console.log(`   Total Count: ${holderCount}`);
      console.log(`   Holders: ${holders.join(', ')}`);

      expect(holderCount).to.equal(1);
      expect(holders.length).to.equal(1);
      expect(holders[0]).to.equal(user1.address);
    });

    it("Should get price history", async function () {
      // Make another transaction to create more price history
      await mockERC20.connect(user2).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user2).mint(ethers.parseEther("200"), ethers.parseEther("2"), user2.address);

      const historyLength = await token.getPriceHistoryLength();
      const [timestamps, prices, supplies] = await token.getPriceHistory(0, 10);

      console.log(`✅ Price History:`);
      console.log(`   Total Points: ${historyLength}`);
      console.log(`   Recent Entries: ${timestamps.length}`);

      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(Number(timestamps[i]) * 1000);
        console.log(`   ${i}: ${date.toISOString()} - Price: ${ethers.formatEther(prices[i])}, Supply: ${ethers.formatEther(supplies[i])}`);
      }

      expect(historyLength).to.be.gt(0);
      expect(timestamps.length).to.be.gt(0);
    });

    it("Should handle holder tracking correctly", async function () {
      // Initial state
      expect(await token.getHolderCount()).to.equal(1);
      expect(await token.isHolder(user1.address)).to.be.true;
      expect(await token.isHolder(user2.address)).to.be.false;

      // User2 becomes a holder
      await mockERC20.connect(user2).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user2).mint(ethers.parseEther("50"), ethers.parseEther("1"), user2.address);

      expect(await token.getHolderCount()).to.equal(2);
      expect(await token.isHolder(user2.address)).to.be.true;

      // User1 burns all tokens (should be removed from holders)
      const user1Balance = await token.balanceOf(user1.address);
      await token.connect(user1).burn(user1Balance, ethers.parseEther("0.01"), user1.address);

      expect(await token.getHolderCount()).to.equal(1);
      expect(await token.isHolder(user1.address)).to.be.false;
      expect(await token.isHolder(user2.address)).to.be.true;

      console.log(`✅ Holder tracking works correctly`);
    });
  });

  describe("🔍 UI Function Edge Cases", function () {
    it("Should handle pagination correctly", async function () {
      // Test empty results
      const emptyCollections = await nftFactory.getCollectionsByCreator(user1.address, 0, 10);
      expect(emptyCollections.length).to.equal(0);

      // Test offset beyond range
      const beyondRange = await erc20Factory.getTokensByCreator(creator.address, 10, 10);
      expect(beyondRange.length).to.equal(0);

      console.log(`✅ Pagination edge cases handled`);
    });

    it("Should handle price history limits", async function () {
      // Get current history length
      const initialLength = await token.getPriceHistoryLength();

      // Make many transactions to test history limit
      for (let i = 0; i < 5; i++) {
        await token.connect(user1).mint(ethers.parseEther("10"), ethers.parseEther("1"), user1.address);
      }

      const finalLength = await token.getPriceHistoryLength();
      expect(finalLength).to.be.gte(initialLength);

      console.log(`✅ Price history: ${initialLength} → ${finalLength} entries`);
    });
  });
}); 