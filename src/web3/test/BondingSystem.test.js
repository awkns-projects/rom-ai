const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("Bonding System (ERC20Factory + BondingToken)", function () {
  let contracts;
  let owner, creator, user1, user2, user3;
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
      it("Should create bonding token with correct parameters", async function () {
        const result = await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await collection.getAddress(),
          mockERC20
        );
        token = result.token;
        tokenAddress = result.tokenAddress;

        // Verify token properties
        expect(await token.name()).to.equal("Test Token");
        expect(await token.symbol()).to.equal("TT");
        expect(await token.creator()).to.equal(creator.address);
        expect(await token.nftCollection()).to.equal(await collection.getAddress());
        expect(await token.reserveToken()).to.equal(await mockERC20.getAddress());

        // Check step-based curve properties
        expect(await token.getStepsLength()).to.equal(3);
        expect(await token.maxSupply()).to.equal(ethers.parseEther("10000")); // Last step rangeTo
        expect(await token.totalSupply()).to.equal(0);
        expect(await token.reserveBalance()).to.equal(0);

        // Check first step
        const firstStep = await token.getStep(0);
        expect(firstStep.rangeTo).to.equal(ethers.parseEther("1000"));
        expect(firstStep.price).to.equal(ethers.parseEther("0.001"));
      });

      it("Should create token with custom parameters", async function () {
        const customSteps = [
          { rangeTo: ethers.parseEther("500"), price: ethers.parseEther("0.002") },
          { rangeTo: ethers.parseEther("2000"), price: ethers.parseEther("0.004") }
        ];

        const customParams = {
          name: "Custom Token",
          symbol: "CUSTOM",
          steps: customSteps,
          mintRoyalty: 300, // 3%
          burnRoyalty: 250  // 2.5%
        };

        const result = await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await collection.getAddress(),
          mockERC20,
          customParams
        );
        token = result.token;

        expect(await token.name()).to.equal("Custom Token");
        expect(await token.symbol()).to.equal("CUSTOM");
        expect(await token.getStepsLength()).to.equal(2);
        expect(await token.maxSupply()).to.equal(ethers.parseEther("2000"));

        // Check custom steps
        const firstStep = await token.getStep(0);
        expect(firstStep.rangeTo).to.equal(ethers.parseEther("500"));
        expect(firstStep.price).to.equal(ethers.parseEther("0.002"));

        const secondStep = await token.getStep(1);
        expect(secondStep.rangeTo).to.equal(ethers.parseEther("2000"));
        expect(secondStep.price).to.equal(ethers.parseEther("0.004"));
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
        expect(event.args.symbol).to.equal("TT");
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

        const tokens = await erc20Factory.getTokens(0, 10);
        expect(tokens.length).to.equal(1);
        expect(tokens[0]).to.equal(tokenAddress);

        const nftToToken = await erc20Factory.getTokenForNFTCollection(await collection.getAddress());
        expect(nftToToken).to.equal(tokenAddress);
      });

      it("Should require creator to be NFT collection creator", async function () {
        const steps = [
          { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }
        ];

        await expect(
          erc20Factory.connect(user1).createToken(
            "Test Token",
            "TT",
            await collection.getAddress(),
            await mockERC20.getAddress(),
            steps,
            200, // 2% mint royalty
            150, // 1.5% burn royalty
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(erc20Factory, "ERC20Factory__UnauthorizedCreator");
      });

      it("Should reject duplicate tokens for same NFT collection", async function () {
        // Create first token
        await TestHelpers.createBondingToken(
          erc20Factory,
          creator,
          await collection.getAddress(),
          mockERC20
        );

        // Try to create second token for same collection
        await expect(
          erc20Factory.connect(creator).createToken(
            "Second Token",
            "ST",
            await collection.getAddress(),
            ethers.ZeroAddress,
            ethers.parseEther("0.001"),
            ethers.parseEther("0.000001"),
            ethers.parseEther("1000000"),
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.revertedWithCustomError(erc20Factory, "ERC20Factory__TokenAlreadyExists");
      });

      it("Should require creation fee", async function () {
        await expect(
          erc20Factory.connect(creator).createToken(
            "Test Token",
            "TT",
            await collection.getAddress(),
            ethers.ZeroAddress,
            ethers.parseEther("0.001"),
            ethers.parseEther("0.000001"),
            ethers.parseEther("1000000"),
            { value: ethers.parseEther("0.005") } // Insufficient fee
          )
        ).to.be.revertedWithCustomError(erc20Factory, "ERC20Factory__InvalidCreationFee");
      });

      it("Should validate bonding curve parameters", async function () {
        // Zero base price
        await expect(
          erc20Factory.connect(creator).createToken(
            "Test Token",
            "TT",
            await collection.getAddress(),
            ethers.ZeroAddress,
            0, // Zero base price
            ethers.parseEther("0.000001"),
            ethers.parseEther("1000000"),
            { value: ethers.parseEther("0.01") }
          )
        ).to.be.reverted; // Will revert in BondingCurveMath validation
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
      tokenAddress = result.tokenAddress;
    });

    describe("Price Calculation", function () {
      it("Should return correct initial price", async function () {
        const price = await token.getCurrentPrice();
        expect(price).to.equal(ethers.parseEther("0.001")); // First step price
      });

      it("Should calculate reserve cost correctly", async function () {
        const cost = await token.getReserveForTokens(ethers.parseEther("1"));
        expect(cost).to.equal(ethers.parseEther("0.001")); // First token costs base price
      });

      it("Should calculate tokens for reserve correctly", async function () {
        const tokens = await token.getTokensForReserve(ethers.parseEther("0.001"));
        expect(tokens).to.equal(ethers.parseEther("1")); // Can buy 1 token with base price
      });
    });

    describe("Minting Tokens", function () {
      beforeEach(async function () {
        // Approve mockERC20 for minting
        await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));
        await mockERC20.connect(user2).approve(await token.getAddress(), ethers.parseEther("100"));
      });

      it("Should mint tokens with ERC20", async function () {
        const tokenAmount = ethers.parseEther("100");
        const maxReserve = ethers.parseEther("1");

        const tx = await token.connect(user1).mint(
          tokenAmount,
          maxReserve,
          user1.address
        );

        const tokenBalance = await token.balanceOf(user1.address);
        expect(tokenBalance).to.equal(tokenAmount);

        const event = await TestHelpers.getEventFromTx(tx, token, "Mint");
        expect(event.args.to).to.equal(user1.address);
        expect(event.args.tokenAmount).to.equal(tokenAmount);
      });

      it("Should buy exact tokens", async function () {
        const tokenAmount = ethers.parseEther("100");
        const maxCost = ethers.parseEther("1");

        const tx = await token.connect(user1).buyExactTokens(
          tokenAmount,
          maxCost,
          user1.address,
          { value: maxCost }
        );

        expect(await token.balanceOf(user1.address)).to.equal(tokenAmount);

        const event = await TestHelpers.getEventFromTx(tx, token, "Buy");
        expect(event.args.tokenAmount).to.equal(tokenAmount);
      });

      it("Should buy with reserve amount", async function () {
        const reserveAmount = ethers.parseEther("0.1");

        const tx = await token.connect(user1).buyWithReserve(
          reserveAmount,
          0, // No minimum
          user1.address,
          { value: reserveAmount }
        );

        const balance = await token.balanceOf(user1.address);
        expect(balance).to.be.gt(0);

        const event = await TestHelpers.getEventFromTx(tx, token, "Buy");
        TestHelpers.expectAlmostEqual(event.args.reserveAmount, reserveAmount, ethers.parseEther("0.000001"));
      });

      it("Should update price after buying", async function () {
        const initialPrice = await token.getCurrentPrice();

        await token.connect(user1).buy(
          0,
          user1.address,
          { value: ethers.parseEther("1") }
        );

        const newPrice = await token.getCurrentPrice();
        expect(newPrice).to.be.gt(initialPrice);
      });

      it("Should update reserve balance", async function () {
        const initialReserve = await token.reserveBalance();

        await token.connect(user1).buyWithReserve(
          ethers.parseEther("0.1"),
          0,
          user1.address,
          { value: ethers.parseEther("0.1") }
        );

        const newReserve = await token.reserveBalance();
        expect(newReserve).to.be.gt(initialReserve);
      });

      it("Should refund excess ETH", async function () {
        const balanceBefore = await TestHelpers.getBalance(user1.address);

        const tx = await token.connect(user1).buyWithReserve(
          ethers.parseEther("0.1"),
          0,
          user1.address,
          { value: ethers.parseEther("0.2") } // Excess
        );

        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        const balanceAfter = await TestHelpers.getBalance(user1.address);

        // Should refund excess
        const spent = balanceBefore - balanceAfter - gasUsed;
        expect(spent).to.be.lte(ethers.parseEther("0.1"));
      });

      it("Should reject insufficient payment", async function () {
        await expect(
          token.connect(user1).buyExactTokens(
            ethers.parseEther("1000"),
            ethers.parseEther("0.001"), // Too low
            user1.address,
            { value: ethers.parseEther("0.001") }
          )
        ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      });

      it("Should reject buying beyond max supply", async function () {
        const maxSupply = await token.maxSupply();

        await expect(
          token.connect(user1).buyExactTokens(
            maxSupply + ethers.parseEther("1"),
            ethers.parseEther("1000"),
            user1.address,
            { value: ethers.parseEther("1000") }
          )
        ).to.be.revertedWithCustomError(token, "BondingToken__MaxSupplyReached");
      });

      it("Should enforce slippage protection", async function () {
        await expect(
          token.connect(user1).buy(
            ethers.parseEther("1000"), // Unrealistic minimum
            user1.address,
            { value: ethers.parseEther("0.001") }
          )
        ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      });
    });

    describe("Selling Tokens", function () {
      beforeEach(async function () {
        // Buy some tokens first
        await token.connect(user1).buy(
          0,
          user1.address,
          { value: ethers.parseEther("1") }
        );
      });

      it("Should sell tokens back to curve", async function () {
        const tokenBalance = await token.balanceOf(user1.address);
        const sellAmount = tokenBalance / 2n;

        const balanceBefore = await TestHelpers.getBalance(user1.address);

        const tx = await token.connect(user1).sell(
          sellAmount,
          0, // No minimum
          user1.address
        );

        const balanceAfter = await TestHelpers.getBalance(user1.address);
        expect(balanceAfter).to.be.gt(balanceBefore); // Should receive ETH

        const event = await TestHelpers.getEventFromTx(tx, token, "Sell");
        expect(event.args.seller).to.equal(user1.address);
        expect(event.args.tokenAmount).to.equal(sellAmount);
      });

      it("Should update price after selling", async function () {
        const priceBefore = await token.getCurrentPrice();
        const tokenBalance = await token.balanceOf(user1.address);

        await token.connect(user1).sell(
          tokenBalance / 2n,
          0,
          user1.address
        );

        const priceAfter = await token.getCurrentPrice();
        expect(priceAfter).to.be.lt(priceBefore);
      });

      it("Should update reserve balance after selling", async function () {
        const reserveBefore = await token.reserveBalance();
        const tokenBalance = await token.balanceOf(user1.address);

        await token.connect(user1).sell(
          tokenBalance / 2n,
          0,
          user1.address
        );

        const reserveAfter = await token.reserveBalance();
        expect(reserveAfter).to.be.lt(reserveBefore);
      });

      it("Should reject selling more tokens than owned", async function () {
        const tokenBalance = await token.balanceOf(user1.address);

        await expect(
          token.connect(user1).sell(
            tokenBalance + ethers.parseEther("1"),
            0,
            user1.address
          )
        ).to.be.revertedWithCustomError(token, "BondingToken__InsufficientTokens");
      });

      it("Should enforce slippage protection on selling", async function () {
        const tokenBalance = await token.balanceOf(user1.address);

        await expect(
          token.connect(user1).sell(
            tokenBalance,
            ethers.parseEther("1000"), // Unrealistic minimum
            user1.address
          )
        ).to.be.revertedWithCustomError(token, "BondingToken__SlippageExceeded");
      });

      it("Should reject selling zero tokens", async function () {
        await expect(
          token.connect(user1).sell(0, 0, user1.address)
        ).to.be.revertedWithCustomError(token, "BondingToken__InvalidAmount");
      });
    });

    describe("Buy/Sell Symmetry", function () {
      it("Should maintain approximate buy/sell symmetry", async function () {
        // Buy tokens
        const buyTx = await token.connect(user1).buyWithReserve(
          ethers.parseEther("1"),
          0,
          user1.address,
          { value: ethers.parseEther("1") }
        );

        const buyEvent = await TestHelpers.getEventFromTx(buyTx, token, "Buy");
        const tokensBought = buyEvent.args.tokenAmount;
        const actualCost = buyEvent.args.reserveAmount;

        // Sell same tokens back
        const sellTx = await token.connect(user1).sell(
          tokensBought,
          0,
          user1.address
        );

        const sellEvent = await TestHelpers.getEventFromTx(sellTx, token, "Sell");
        const refund = sellEvent.args.reserveAmount;

        // Refund should be close to cost (within small tolerance)
        TestHelpers.expectAlmostEqual(refund, actualCost, ethers.parseEther("0.01"));
      });
    });

    describe("View Functions", function () {
      it("Should return bonding curve info", async function () {
        const info = await token.getBondingCurveInfo();
        expect(info[0]).to.equal(await collection.getAddress()); // nftCollection
        expect(info[1]).to.equal(ethers.ZeroAddress); // reserveToken
        expect(info[2]).to.equal(ethers.parseEther("0.001")); // basePrice
        expect(info[3]).to.equal(ethers.parseEther("0.000001")); // slope
        expect(info[4]).to.equal(ethers.parseEther("1000000")); // maxSupply
      });

      it("Should calculate sell refund correctly", async function () {
        // Buy some tokens first
        await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });

        const balance = await token.balanceOf(user1.address);
        const refund = await token.getSellRefund(balance);
        expect(refund).to.be.gt(0);
      });
    });

    describe("ERC20 Compliance", function () {
      beforeEach(async function () {
        // Buy tokens for testing
        await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
        await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });
      });

      it("Should support standard ERC20 functions", async function () {
        const balance1 = await token.balanceOf(user1.address);
        const balance2 = await token.balanceOf(user2.address);
        const totalSupply = await token.totalSupply();

        expect(balance1).to.be.gt(0);
        expect(balance2).to.be.gt(0);
        expect(totalSupply).to.equal(balance1 + balance2);
      });

      it("Should allow transfers", async function () {
        const balance1Before = await token.balanceOf(user1.address);
        const transferAmount = balance1Before / 2n;

        await token.connect(user1).transfer(user2.address, transferAmount);

        const balance1After = await token.balanceOf(user1.address);
        const balance2After = await token.balanceOf(user2.address);

        expect(balance1After).to.equal(balance1Before - transferAmount);
        expect(balance2After).to.be.gt(0);
      });

      it("Should allow approvals and transferFrom", async function () {
        const balance1 = await token.balanceOf(user1.address);
        const transferAmount = balance1 / 2n;

        await token.connect(user1).approve(user2.address, transferAmount);
        expect(await token.allowance(user1.address, user2.address)).to.equal(transferAmount);

        await token.connect(user2).transferFrom(user1.address, user3.address, transferAmount);
        expect(await token.balanceOf(user3.address)).to.equal(transferAmount);
      });
    });

    describe("Edge Cases", function () {
      it("Should handle very small purchases", async function () {
        const tx = await token.connect(user1).buy(
          0,
          user1.address,
          { value: ethers.parseEther("0.001") } // Minimal amount
        );

        const balance = await token.balanceOf(user1.address);
        expect(balance).to.be.gt(0);
      });

      it("Should handle large purchases within limits", async function () {
        const tx = await token.connect(user1).buy(
          0,
          user1.address,
          { value: ethers.parseEther("100") }
        );

        const balance = await token.balanceOf(user1.address);
        expect(balance).to.be.gt(0);
        expect(balance).to.be.lt(await token.maxSupply());
      });

      it("Should handle multiple users buying", async function () {
        await token.connect(user1).buy(0, user1.address, { value: ethers.parseEther("1") });
        await token.connect(user2).buy(0, user2.address, { value: ethers.parseEther("1") });
        await token.connect(user3).buy(0, user3.address, { value: ethers.parseEther("1") });

        const balance1 = await token.balanceOf(user1.address);
        const balance2 = await token.balanceOf(user2.address);
        const balance3 = await token.balanceOf(user3.address);

        expect(balance1).to.be.gt(0);
        expect(balance2).to.be.gt(0);
        expect(balance3).to.be.gt(0);

        // Later buyers should get fewer tokens due to price increase
        expect(balance1).to.be.gte(balance2);
        expect(balance2).to.be.gte(balance3);
      });
    });
  });
}); 