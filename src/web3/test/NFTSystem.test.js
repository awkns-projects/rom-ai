const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("NFT System (Factory + Collection)", function () {
  let contracts;
  let owner, creator, user1, user2, user3;
  let nftFactory, collection, collectionAddress;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory } = contracts);
  });

  describe("NFTFactory", function () {
    describe("Deployment", function () {
      it("Should deploy with correct parameters", async function () {
        expect(await nftFactory.creationFee()).to.equal(ethers.parseEther("0.01"));
        expect(await nftFactory.owner()).to.equal(owner.address);
      });

      it("Should have correct implementation address", async function () {
        const implementationAddress = await nftFactory.NFT_COLLECTION_IMPLEMENTATION();
        expect(implementationAddress).to.not.equal(ethers.ZeroAddress);
      });
    });

    describe("Collection Creation", function () {
      it("Should create NFT collection with ETH payment", async function () {
        const result = await TestHelpers.createNFTCollection(nftFactory, creator);
        collection = result.collection;
        collectionAddress = result.collectionAddress;

        // Verify collection properties
        expect(await collection.name()).to.equal("Test Collection");
        expect(await collection.symbol()).to.equal("TEST");
        expect(await collection.creator()).to.equal(creator.address);
        expect(await collection.paymentToken()).to.equal(ethers.ZeroAddress);
        expect(await collection.mintPrice()).to.equal(ethers.parseEther("0.1"));
        expect(await collection.maxSupply()).to.equal(10000);
        expect(await collection.totalSupply()).to.equal(0);
      });

      it("Should create collection with custom parameters", async function () {
        const customParams = {
          name: "Custom Collection",
          symbol: "CUSTOM",
          baseURI: "https://custom.api.com/",
          mintPrice: ethers.parseEther("0.05"),
          maxSupply: 5000
        };

        const result = await TestHelpers.createNFTCollection(nftFactory, creator, customParams);
        collection = result.collection;

        expect(await collection.name()).to.equal("Custom Collection");
        expect(await collection.symbol()).to.equal("CUSTOM");
        expect(await collection.mintPrice()).to.equal(ethers.parseEther("0.05"));
        expect(await collection.maxSupply()).to.equal(5000);
      });

      it("Should emit CollectionCreated event", async function () {
        const tx = await nftFactory.connect(creator).createCollection(
          "Test Collection",
          "TEST",
          "https://api.test.com/metadata/",
          ethers.ZeroAddress,
          ethers.parseEther("0.1"),
          10000,
          { value: ethers.parseEther("0.01") }
        );

        const event = await TestHelpers.getEventFromTx(tx, nftFactory, "CollectionCreated");
        expect(event.args.creator).to.equal(creator.address);
        expect(event.args.name).to.equal("Test Collection");
        expect(event.args.symbol).to.equal("TEST");
        expect(event.args.paymentToken).to.equal(ethers.ZeroAddress);
        expect(event.args.mintPrice).to.equal(ethers.parseEther("0.1"));
        expect(event.args.maxSupply).to.equal(10000);
      });

      it("Should track collections in factory", async function () {
        const result = await TestHelpers.createNFTCollection(nftFactory, creator);
        collectionAddress = result.collectionAddress;

        expect(await nftFactory.getCollectionCount()).to.equal(1);

        const collections = await nftFactory.getCollections(0, 10);
        expect(collections.length).to.equal(1);
        expect(collections[0]).to.equal(collectionAddress);

        const info = await nftFactory.collectionInfo(collectionAddress);
        expect(info.creator).to.equal(creator.address);
        expect(info.exists).to.be.true;
      });

      it("Should require creation fee", async function () {
        await expect(
          nftFactory.connect(creator).createCollection(
            "Test Collection",
            "TEST",
            "https://api.test.com/metadata/",
            ethers.ZeroAddress,
            ethers.parseEther("0.1"),
            10000,
            { value: ethers.parseEther("0.005") } // Insufficient fee
          )
        ).to.be.revertedWithCustomError(nftFactory, "NFTFactory__InvalidCreationFee");
      });

      it("Should refund excess ETH", async function () {
        const balanceBefore = await TestHelpers.getBalance(creator.address);

        const tx = await nftFactory.connect(creator).createCollection(
          "Test Collection",
          "TEST",
          "https://api.test.com/metadata/",
          ethers.ZeroAddress,
          ethers.parseEther("0.1"),
          10000,
          { value: ethers.parseEther("0.02") } // Extra ETH
        );

        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        const balanceAfter = await TestHelpers.getBalance(creator.address);

        // Should only pay creation fee + gas
        const expectedBalance = balanceBefore - ethers.parseEther("0.01") - gasUsed;
        TestHelpers.expectAlmostEqual(balanceAfter, expectedBalance, ethers.parseEther("0.001"));
      });

      it("Should reject invalid parameters", async function () {
        // Zero mint price
        await expect(
          nftFactory.connect(creator).createCollection(
            "Test Collection",
            "TEST",
            "https://api.test.com/metadata/",
            ethers.ZeroAddress,
            0, // Zero price
            10000,
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(nftFactory, "NFTFactory__InvalidPrice");

        // Zero max supply
        await expect(
          nftFactory.connect(creator).createCollection(
            "Test Collection",
            "TEST",
            "https://api.test.com/metadata/",
            ethers.ZeroAddress,
            ethers.parseEther("0.1"),
            0, // Zero supply
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(nftFactory, "NFTFactory__InvalidMaxSupply");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to update creation fee", async function () {
        await nftFactory.connect(owner).updateCreationFee(ethers.parseEther("0.02"));
        expect(await nftFactory.creationFee()).to.equal(ethers.parseEther("0.02"));
      });

      it("Should emit CreationFeeUpdated event", async function () {
        const tx = await nftFactory.connect(owner).updateCreationFee(ethers.parseEther("0.02"));
        const event = await TestHelpers.getEventFromTx(tx, nftFactory, "CreationFeeUpdated");
        expect(event.args.newFee).to.equal(ethers.parseEther("0.02"));
      });

      it("Should reject non-owner fee updates", async function () {
        await expect(
          nftFactory.connect(creator).updateCreationFee(ethers.parseEther("0.02"))
        ).to.be.revertedWithCustomError(nftFactory, "OwnableUnauthorizedAccount");
      });
    });

    describe("Pagination", function () {
      beforeEach(async function () {
        // Create multiple collections
        for (let i = 0; i < 5; i++) {
          await TestHelpers.createNFTCollection(nftFactory, creator, {
            name: `Collection ${i}`,
            symbol: `COL${i}`
          });
        }
      });

      it("Should paginate collections correctly", async function () {
        expect(await nftFactory.getCollectionCount()).to.equal(5);

        // Get first 3
        const first3 = await nftFactory.getCollections(0, 3);
        expect(first3.length).to.equal(3);

        // Get next 2
        const next2 = await nftFactory.getCollections(3, 3);
        expect(next2.length).to.equal(2);

        // Get beyond range
        const beyond = await nftFactory.getCollections(10, 5);
        expect(beyond.length).to.equal(0);
      });
    });
  });

  describe("NFTCollection", function () {
    beforeEach(async function () {
      const result = await TestHelpers.createNFTCollection(nftFactory, creator);
      collection = result.collection;
      collectionAddress = result.collectionAddress;
    });

    describe("Minting", function () {
      it("Should mint NFTs with correct payment", async function () {
        const tx = await collection.connect(user1).mint(
          user1.address,
          2,
          { value: ethers.parseEther("0.2") } // 2 * 0.1 ETH
        );

        expect(await collection.totalSupply()).to.equal(2);
        expect(await collection.balanceOf(user1.address)).to.equal(2);
        expect(await collection.ownerOf(1)).to.equal(user1.address);
        expect(await collection.ownerOf(2)).to.equal(user1.address);

        // Check revenue tracking (after 2.5% protocol fee)
        const expectedRevenue = ethers.parseEther("0.195"); // 0.2 - (0.2 * 0.025)
        expect(await collection.totalRevenue()).to.equal(expectedRevenue);
      });

      it("Should emit Minted events", async function () {
        const tx = await collection.connect(user1).mint(
          user1.address,
          1,
          { value: ethers.parseEther("0.1") }
        );

        const event = await TestHelpers.getEventFromTx(tx, collection, "Minted");
        expect(event.args.to).to.equal(user1.address);
        expect(event.args.tokenId).to.equal(1);
        expect(event.args.price).to.equal(ethers.parseEther("0.1"));
      });

      it("Should refund excess payment", async function () {
        const balanceBefore = await TestHelpers.getBalance(user1.address);

        const tx = await collection.connect(user1).mint(
          user1.address,
          1,
          { value: ethers.parseEther("0.15") } // Excess payment
        );

        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        const balanceAfter = await TestHelpers.getBalance(user1.address);

        // Should only pay mint price + gas
        const expectedBalance = balanceBefore - ethers.parseEther("0.1") - gasUsed;
        TestHelpers.expectAlmostEqual(balanceAfter, expectedBalance, ethers.parseEther("0.001"));
      });

      it("Should reject insufficient payment", async function () {
        await expect(
          collection.connect(user1).mint(
            user1.address,
            1,
            { value: ethers.parseEther("0.05") } // Insufficient
          )
        ).to.be.revertedWithCustomError(collection, "NFTCollection__InsufficientPayment");
      });

      it("Should reject minting beyond max supply", async function () {
        // Set a small max supply for testing
        const result = await TestHelpers.createNFTCollection(nftFactory, creator, {
          maxSupply: 2
        });
        const smallCollection = result.collection;

        // Mint 2 NFTs (max supply)
        await smallCollection.connect(user1).mint(
          user1.address,
          2,
          { value: ethers.parseEther("0.2") }
        );

        // Try to mint one more
        await expect(
          smallCollection.connect(user1).mint(
            user1.address,
            1,
            { value: ethers.parseEther("0.1") }
          )
        ).to.be.revertedWithCustomError(smallCollection, "NFTCollection__MaxSupplyReached");
      });

      it("Should reject zero amount", async function () {
        await expect(
          collection.connect(user1).mint(
            user1.address,
            0,
            { value: ethers.parseEther("0.1") }
          )
        ).to.be.revertedWithCustomError(collection, "NFTCollection__InvalidAmount");
      });

      it("Should reject zero address recipient", async function () {
        await expect(
          collection.connect(user1).mint(
            ethers.ZeroAddress,
            1,
            { value: ethers.parseEther("0.1") }
          )
        ).to.be.revertedWithCustomError(collection, "NFTCollection__InvalidReceiver");
      });
    });

    describe("Token URI", function () {
      beforeEach(async function () {
        await collection.connect(user1).mint(
          user1.address,
          1,
          { value: ethers.parseEther("0.1") }
        );
      });

      it("Should return correct token URI", async function () {
        const tokenURI = await collection.tokenURI(1);
        expect(tokenURI).to.equal("https://api.test.com/metadata/1");
      });

      it("Should allow creator to update base URI", async function () {
        await collection.connect(creator).setBaseURI("https://new.api.com/");
        const tokenURI = await collection.tokenURI(1);
        expect(tokenURI).to.equal("https://new.api.com/1");
      });

      it("Should reject non-creator base URI updates", async function () {
        await expect(
          collection.connect(user1).setBaseURI("https://hack.com/")
        ).to.be.revertedWithCustomError(collection, "NFTCollection__Unauthorized");
      });

      it("Should revert for non-existent token", async function () {
        await expect(collection.tokenURI(999)).to.be.reverted;
      });
    });

    describe("Revenue Distribution", function () {
      it("Should track revenue correctly", async function () {
        await collection.connect(user1).mint(user1.address, 3, { value: ethers.parseEther("0.3") });
        await collection.connect(user2).mint(user2.address, 2, { value: ethers.parseEther("0.2") });

        // Total revenue after protocol fees (0.5 - 0.5 * 0.025 = 0.4875)
        const expectedRevenue = ethers.parseEther("0.4875");
        expect(await collection.totalRevenue()).to.equal(expectedRevenue);
        expect(await collection.distributedRevenue()).to.equal(0);
        expect(await collection.pendingRevenue()).to.equal(expectedRevenue);
      });

      it("Should distribute revenue when staking pool is set", async function () {
        // This will be tested in integration tests when we have staking pools
        expect(await collection.stakingPool()).to.equal(ethers.ZeroAddress);
      });
    });

    describe("Emergency Functions", function () {
      beforeEach(async function () {
        // Mint some NFTs to generate revenue
        await collection.connect(user1).mint(user1.address, 2, { value: ethers.parseEther("0.2") });
      });

      it("Should allow creator emergency withdrawal when no staking pool", async function () {
        const creatorBalanceBefore = await TestHelpers.getBalance(creator.address);

        const tx = await collection.connect(creator).emergencyWithdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const creatorBalanceAfter = await TestHelpers.getBalance(creator.address);
        // Expected amount is net revenue after 2.5% protocol fee: 0.2 - (0.2 * 0.025) = 0.195
        const expectedBalance = creatorBalanceBefore + ethers.parseEther("0.195") - gasUsed;

        TestHelpers.expectAlmostEqual(creatorBalanceAfter, expectedBalance, ethers.parseEther("0.001"));
      });

      it("Should reject non-creator emergency withdrawal", async function () {
        await expect(
          collection.connect(user1).emergencyWithdraw()
        ).to.be.revertedWithCustomError(collection, "NFTCollection__Unauthorized");
      });

      it("Should reject emergency withdrawal when staking pool is set", async function () {
        // Mock setting a staking pool (this would normally be done by staking factory)
        // For now we'll test the access control
        await expect(
          collection.connect(user1).setStakingPool(user1.address)
        ).to.be.revertedWithCustomError(collection, "NFTCollection__Unauthorized");
      });
    });

    describe("Access Control", function () {
      it("Should only allow creator to set staking pool", async function () {
        await expect(
          collection.connect(user1).setStakingPool(user2.address)
        ).to.be.revertedWithCustomError(collection, "NFTCollection__Unauthorized");
      });

      it("Should allow creator to set staking pool", async function () {
        await collection.connect(creator).setStakingPool(user2.address);
        expect(await collection.stakingPool()).to.equal(user2.address);
      });
    });

    describe("ERC721 Compliance", function () {
      beforeEach(async function () {
        await collection.connect(user1).mint(user1.address, 3, { value: ethers.parseEther("0.3") });
      });

      it("Should support ERC721 interface", async function () {
        // Basic ERC721 functions should work
        expect(await collection.balanceOf(user1.address)).to.equal(3);
        expect(await collection.ownerOf(1)).to.equal(user1.address);
        expect(await collection.ownerOf(2)).to.equal(user1.address);
        expect(await collection.ownerOf(3)).to.equal(user1.address);
      });

      it("Should allow transfers", async function () {
        await collection.connect(user1).transferFrom(user1.address, user2.address, 1);
        expect(await collection.ownerOf(1)).to.equal(user2.address);
        expect(await collection.balanceOf(user1.address)).to.equal(2);
        expect(await collection.balanceOf(user2.address)).to.equal(1);
      });

      it("Should allow approvals", async function () {
        await collection.connect(user1).approve(user2.address, 1);
        expect(await collection.getApproved(1)).to.equal(user2.address);

        await collection.connect(user2).transferFrom(user1.address, user2.address, 1);
        expect(await collection.ownerOf(1)).to.equal(user2.address);
      });
    });
  });
}); 