const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("MCV2 Bonding System (ERC20Factory + BondingToken)", function () {
  let contracts, owner, creator, user1, user2, user3, mockERC20;
  let nftFactory, erc20Factory, collection, token, tokenAddress;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, user3, nftFactory, erc20Factory, mockERC20 } = contracts);

    // Create NFT collection first
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;
  });

  describe("ERC20Factory", function () {
    describe("Deployment", function () {
      it("Should deploy with correct parameters", async function () {
        expect(await erc20Factory.creationFee()).to.equal(ethers.parseEther("0.01"));
        expect(await erc20Factory.owner()).to.equal(owner.address);
      });

      it("Should have correct implementation address", async function () {
        const implementationAddress = await erc20Factory.BONDING_TOKEN_IMPLEMENTATION();
        expect(implementationAddress).to.not.equal(ethers.ZeroAddress);
      });
    });

    describe("Token Creation", function () {
      it("Should create bonding token with step-based curve", async function () {
        const steps = [
          { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
          { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") }
        ];

        const result = await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await collection.getAddress(),
          mockERC20,
          { steps, mintRoyalty: 200, burnRoyalty: 150 }
        );
        token = result.token;

        // Verify step-based properties
        expect(await token.getStepsLength()).to.equal(2);
        expect(await token.maxSupply()).to.equal(ethers.parseEther("5000"));

        const firstStep = await token.getStep(0);
        expect(firstStep.rangeTo).to.equal(ethers.parseEther("1000"));
        expect(firstStep.price).to.equal(ethers.parseEther("0.001"));
      });

      it("Should track tokens in factory", async function () {
        const result = await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await collection.getAddress(),
          mockERC20
        );
        tokenAddress = result.tokenAddress;

        expect(await erc20Factory.getTokenCount()).to.equal(1);
        expect(await erc20Factory.isValidToken(tokenAddress)).to.be.true;
      });

      it("Should emit TokenCreated event", async function () {
        const steps = [
          { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }
        ];

        const tx = await erc20Factory.connect(creator).createToken(
          "Test Token",
          "TT",
          await collection.getAddress(),
          await mockERC20.getAddress(),
          steps,
          200, // mintRoyalty
          150, // burnRoyalty
          { value: ethers.parseEther("0.01") }
        );

        const event = await TestHelpers.getEventFromTx(tx, erc20Factory, "TokenCreated");
        expect(event.args.creator).to.equal(creator.address);
        expect(event.args.nftCollection).to.equal(await collection.getAddress());
        expect(event.args.name).to.equal("Test Token");
      });

      it("Should require creation fee", async function () {
        const steps = [{ rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }];

        await expect(
          erc20Factory.connect(creator).createToken(
            "Test Token",
            "TT",
            await collection.getAddress(),
            await mockERC20.getAddress(),
            steps,
            200, 150,
            { value: ethers.parseEther("0.005") } // Insufficient fee
          )
        ).to.be.revertedWithCustomError(erc20Factory, "ERC20Factory__InvalidCreationFee");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to update creation fee", async function () {
        await erc20Factory.connect(owner).setCreationFee(ethers.parseEther("0.02"));
        expect(await erc20Factory.creationFee()).to.equal(ethers.parseEther("0.02"));
      });

      it("Should reject non-owner fee updates", async function () {
        await expect(
          erc20Factory.connect(creator).setCreationFee(ethers.parseEther("0.02"))
        ).to.be.revertedWithCustomError(erc20Factory, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("BondingToken", function () {
    beforeEach(async function () {
      const result = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await collection.getAddress(),
        mockERC20
      );
      token = result.token;

      // Approve mockERC20 for all users
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("1000"));
      await mockERC20.connect(user2).approve(await token.getAddress(), ethers.parseEther("1000"));
      await mockERC20.connect(user3).approve(await token.getAddress(), ethers.parseEther("1000"));
    });

    describe("Step-Based Price Calculation", function () {
      it("Should return correct initial price", async function () {
        const price = await token.getCurrentPrice();
        expect(price).to.equal(ethers.parseEther("0.001")); // First step price
      });

      it("Should calculate reserve cost for tokens", async function () {
        const cost = await token.getReserveForTokens(ethers.parseEther("100"));
        expect(cost).to.equal(ethers.parseEther("0.1")); // 100 * 0.001
      });

      it("Should calculate tokens for reserve amount", async function () {
        const tokens = await token.getTokensForReserve(ethers.parseEther("0.5"));
        expect(tokens).to.equal(ethers.parseEther("500")); // 0.5 / 0.001
      });

      it("Should calculate refund for tokens", async function () {
        // First mint some tokens
        await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);

        const refund = await token.getRefundForTokens(ethers.parseEther("50"));
        expect(refund).to.equal(ethers.parseEther("0.05")); // 50 * 0.001
      });
    });

    describe("Minting Tokens", function () {
      it("Should mint tokens with ERC20 reserve", async function () {
        const tokenAmount = ethers.parseEther("100");
        const maxReserve = ethers.parseEther("1");

        const tx = await token.connect(user1).mint(tokenAmount, maxReserve, user1.address);

        expect(await token.balanceOf(user1.address)).to.equal(tokenAmount);
        expect(await token.totalSupply()).to.equal(tokenAmount);

        const event = await TestHelpers.getEventFromTx(tx, token, "Mint");
        expect(event.args.to).to.equal(user1.address);
        expect(event.args.tokenAmount).to.equal(tokenAmount);
      });

      it("Should update price after minting", async function () {
        const initialPrice = await token.getCurrentPrice();

        await token.connect(user1).mint(ethers.parseEther("1000"), ethers.parseEther("10"), user1.address);

        const newPrice = await token.getCurrentPrice();
        expect(newPrice).to.be.gt(initialPrice); // Should be in second step now
      });

      it("Should update reserve balance after minting", async function () {
        const initialBalance = await token.reserveBalance();

        await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);

        const newBalance = await token.reserveBalance();
        expect(newBalance).to.be.gt(initialBalance);
      });

      it("Should enforce slippage protection", async function () {
        const tokenAmount = ethers.parseEther("100");
        const maxReserve = ethers.parseEther("0.05"); // Too low

        await expect(
          token.connect(user1).mint(tokenAmount, maxReserve, user1.address)
        ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      });

      it("Should pay royalties on mint", async function () {
        const tokenAmount = ethers.parseEther("100");
        const maxReserve = ethers.parseEther("1");

        const royaltyRecipientBefore = await mockERC20.balanceOf(owner.address);

        await token.connect(user1).mint(tokenAmount, maxReserve, user1.address);

        const royaltyRecipientAfter = await mockERC20.balanceOf(owner.address);
        expect(royaltyRecipientAfter).to.be.gt(royaltyRecipientBefore); // Should receive royalty
      });

      it("Should reject minting beyond max supply", async function () {
        const maxSupply = await token.maxSupply();

        await expect(
          token.connect(user1).mint(maxSupply + 1n, ethers.parseEther("100"), user1.address)
        ).to.be.revertedWithCustomError(token, "BondingToken__MaxSupplyReached");
      });
    });

    describe("Burning Tokens", function () {
      beforeEach(async function () {
        // Mint some tokens first
        await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("10"), user1.address);
      });

      it("Should burn tokens and refund reserve", async function () {
        const burnAmount = ethers.parseEther("100");
        const minRefund = ethers.parseEther("0.05");

        const initialBalance = await mockERC20.balanceOf(user1.address);

        const tx = await token.connect(user1).burn(burnAmount, minRefund, user1.address);

        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("400"));
        expect(await mockERC20.balanceOf(user1.address)).to.be.gt(initialBalance);

        const event = await TestHelpers.getEventFromTx(tx, token, "Burn");
        expect(event.args.from).to.equal(user1.address);
        expect(event.args.tokenAmount).to.equal(burnAmount);
      });

      it("Should enforce slippage protection on burn", async function () {
        const burnAmount = ethers.parseEther("100");
        const minRefund = ethers.parseEther("1"); // Too high

        await expect(
          token.connect(user1).burn(burnAmount, minRefund, user1.address)
        ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      });

      it("Should pay royalties on burn", async function () {
        const burnAmount = ethers.parseEther("100");
        const minRefund = ethers.parseEther("0.05");

        const royaltyRecipientBefore = await mockERC20.balanceOf(owner.address);

        await token.connect(user1).burn(burnAmount, minRefund, user1.address);

        const royaltyRecipientAfter = await mockERC20.balanceOf(owner.address);
        expect(royaltyRecipientAfter).to.be.gt(royaltyRecipientBefore); // Should receive royalty
      });

      it("Should reject burning more tokens than owned", async function () {
        const burnAmount = ethers.parseEther("1000"); // More than user owns

        await expect(
          token.connect(user1).burn(burnAmount, 0, user1.address)
        ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
      });
    });

    describe("Mint/Burn Symmetry", function () {
      it("Should maintain approximate mint/burn symmetry", async function () {
        const tokenAmount = ethers.parseEther("100");

        // Calculate cost to mint
        const mintCost = await token.getReserveForTokens(tokenAmount);

        // Mint tokens
        await token.connect(user1).mint(tokenAmount, mintCost + ethers.parseEther("1"), user1.address);

        // Calculate refund for burning the same amount
        const burnRefund = await token.getRefundForTokens(tokenAmount);

        // Should be approximately equal (accounting for royalties)
        TestHelpers.expectAlmostEqual(mintCost, burnRefund, ethers.parseEther("0.01"));
      });
    });

    describe("View Functions", function () {
      it("Should return bonding curve info", async function () {
        const info = await token.getBondingCurveInfo();
        expect(info.currentSupply).to.equal(0);
        expect(info.reserveBalance).to.equal(0);
        expect(info.currentPrice).to.equal(ethers.parseEther("0.001"));
      });

      it("Should return step information", async function () {
        const stepsLength = await token.getStepsLength();
        expect(stepsLength).to.equal(3); // Default test steps

        const firstStep = await token.getStep(0);
        expect(firstStep.rangeTo).to.equal(ethers.parseEther("1000"));
        expect(firstStep.price).to.equal(ethers.parseEther("0.001"));
      });
    });

    describe("ERC20 Compliance", function () {
      beforeEach(async function () {
        await token.connect(user1).mint(ethers.parseEther("1000"), ethers.parseEther("10"), user1.address);
      });

      it("Should support standard ERC20 functions", async function () {
        expect(await token.name()).to.equal("Test Token");
        expect(await token.symbol()).to.equal("TT");
        expect(await token.decimals()).to.equal(18);
        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      });

      it("Should allow transfers", async function () {
        const transferAmount = ethers.parseEther("100");

        await token.connect(user1).transfer(user2.address, transferAmount);

        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
        expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      });

      it("Should allow approvals and transferFrom", async function () {
        const approveAmount = ethers.parseEther("100");

        await token.connect(user1).approve(user2.address, approveAmount);
        expect(await token.allowance(user1.address, user2.address)).to.equal(approveAmount);

        await token.connect(user2).transferFrom(user1.address, user3.address, approveAmount);

        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
        expect(await token.balanceOf(user3.address)).to.equal(approveAmount);
      });
    });

    describe("Edge Cases", function () {
      it("Should handle very small mints", async function () {
        const smallAmount = ethers.parseEther("0.001");

        await expect(
          token.connect(user1).mint(smallAmount, ethers.parseEther("1"), user1.address)
        ).to.not.be.reverted;

        expect(await token.balanceOf(user1.address)).to.equal(smallAmount);
      });

      it("Should handle mints across multiple steps", async function () {
        const largeAmount = ethers.parseEther("2000"); // Spans multiple steps
        const maxCost = ethers.parseEther("10");

        await token.connect(user1).mint(largeAmount, maxCost, user1.address);

        expect(await token.balanceOf(user1.address)).to.equal(largeAmount);
        expect(await token.getCurrentPrice()).to.equal(ethers.parseEther("0.002")); // Second step price
      });

      it("Should handle multiple users minting", async function () {
        await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("5"), user1.address);
        await token.connect(user2).mint(ethers.parseEther("300"), ethers.parseEther("5"), user2.address);
        await token.connect(user3).mint(ethers.parseEther("200"), ethers.parseEther("5"), user3.address);

        expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));
        expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
        expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("300"));
        expect(await token.balanceOf(user3.address)).to.equal(ethers.parseEther("200"));
      });
    });
  });
}); 