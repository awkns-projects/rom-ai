const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MCV2 Step-Based Bonding System", function () {
  let owner, creator, user1, user2;
  let nftFactory, erc20Factory, nftCollection, bondingToken, mockERC20;
  let bondingTokenImplementation;

  // Step-based curve: 3 steps with increasing prices
  const steps = [
    { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }, // 0-1000 tokens at 0.001 ETH each
    { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") }, // 1000-5000 tokens at 0.002 ETH each
    { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }, // 5000-10000 tokens at 0.005 ETH each
  ];

  beforeEach(async function () {
    [owner, creator, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 for reserve token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy("Mock USDC", "USDC", 18);

    // Mint some tokens to users for testing
    await mockERC20.mint(user1.address, ethers.parseEther("100000"));
    await mockERC20.mint(user2.address, ethers.parseEther("100000"));

    // Deploy NFT Factory
    const NFTCollectionImpl = await ethers.getContractFactory("NFTCollection");
    const nftCollectionImplementation = await NFTCollectionImpl.deploy();

    const NFTFactory = await ethers.getContractFactory("NFTFactory");
    nftFactory = await NFTFactory.deploy(
      nftCollectionImplementation.target,
      ethers.parseEther("0.01"), // creation fee
      owner.address, // protocol fee recipient
      200, // protocol fee bps (2%)
      owner.address // owner
    );

    // Deploy Bonding Token Factory
    const BondingTokenImpl = await ethers.getContractFactory("BondingToken");
    bondingTokenImplementation = await BondingTokenImpl.deploy();

    const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    erc20Factory = await ERC20Factory.deploy(
      bondingTokenImplementation.target,
      owner.address,
      ethers.parseEther("0.01"), // creation fee
      owner.address // royalty recipient
    );

    // Create NFT Collection
    await nftFactory.connect(creator).createCollection(
      "Test Collection",
      "TEST",
      "https://test.com/",
      mockERC20.target, // payment token
      ethers.parseEther("0.1"), // mint price
      1000, // max supply
      { value: ethers.parseEther("0.01") }
    );

    const collections = await nftFactory.getCollections(0, 1);
    nftCollection = await ethers.getContractAt("NFTCollection", collections[0]);

    // Create Bonding Token with step-based curve
    await erc20Factory.connect(creator).createToken(
      "Test Token",
      "TT",
      nftCollection.target,
      mockERC20.target, // ERC20 reserve token
      steps,
      200, // 2% mint royalty
      150, // 1.5% burn royalty
      { value: ethers.parseEther("0.01") }
    );

    const tokens = await erc20Factory.getTokens(0, 1);
    bondingToken = await ethers.getContractAt("BondingToken", tokens[0]);
  });

  describe("Step-Based Curve Setup", function () {
    it("Should initialize with correct steps", async function () {
      expect(await bondingToken.getStepsLength()).to.equal(3);

      const step0 = await bondingToken.getStep(0);
      expect(step0.rangeTo).to.equal(ethers.parseEther("1000"));
      expect(step0.price).to.equal(ethers.parseEther("0.001"));

      const step2 = await bondingToken.getStep(2);
      expect(step2.rangeTo).to.equal(ethers.parseEther("10000"));
      expect(step2.price).to.equal(ethers.parseEther("0.005"));
    });

    it("Should have correct max supply", async function () {
      expect(await bondingToken.maxSupply()).to.equal(ethers.parseEther("10000"));
    });

    it("Should return correct initial price", async function () {
      const price = await bondingToken.getCurrentPrice();
      expect(price).to.equal(ethers.parseEther("0.001"));
    });
  });

  describe("MCV2 Mint Function", function () {
    beforeEach(async function () {
      // Approve tokens for minting
      await mockERC20.connect(user1).approve(bondingToken.target, ethers.parseEther("10000"));
    });

    it("Should mint tokens in first step", async function () {
      const tokensToMint = ethers.parseEther("100"); // 100 tokens

      const [reserveAmount, royalty] = await bondingToken.getReserveForTokens(tokensToMint);

      // Should cost: 100 * 0.001 = 0.1 ETH + royalty
      const expectedCost = ethers.parseEther("0.1");
      const expectedRoyalty = (expectedCost * 200n) / 10000n; // 2%

      expect(reserveAmount).to.equal(expectedCost + expectedRoyalty);
      expect(royalty).to.equal(expectedRoyalty);

      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);

      expect(await bondingToken.balanceOf(user1.address)).to.equal(tokensToMint);
      expect(await bondingToken.totalSupply()).to.equal(tokensToMint);
    });

    it("Should mint tokens across steps", async function () {
      const tokensToMint = ethers.parseEther("1500"); // Cross into second step

      const [reserveAmount] = await bondingToken.getReserveForTokens(tokensToMint);

      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);

      // Price should now be in second step
      const currentPrice = await bondingToken.getCurrentPrice();
      expect(currentPrice).to.equal(ethers.parseEther("0.002"));
    });

    it("Should enforce slippage protection", async function () {
      const tokensToMint = ethers.parseEther("100");
      const [reserveAmount] = await bondingToken.getReserveForTokens(tokensToMint);

      // Try to mint with insufficient max reserve amount
      await expect(
        bondingToken.connect(user1).mint(tokensToMint, reserveAmount - 1n, user1.address)
      ).to.be.revertedWithCustomError(bondingToken, "BondingToken__SlippageExceeded");
    });
  });

  describe("MCV2 Burn Function", function () {
    beforeEach(async function () {
      // Mint some tokens first
      await mockERC20.connect(user1).approve(bondingToken.target, ethers.parseEther("10000"));
      const tokensToMint = ethers.parseEther("500");
      const [reserveAmount] = await bondingToken.getReserveForTokens(tokensToMint);
      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);
    });

    it("Should burn tokens and refund reserve", async function () {
      const tokensToBurn = ethers.parseEther("100");
      const [refundAmount, royalty] = await bondingToken.getRefundForTokens(tokensToBurn);

      const initialBalance = await mockERC20.balanceOf(user1.address);

      await bondingToken.connect(user1).burn(tokensToBurn, refundAmount, user1.address);

      const finalBalance = await mockERC20.balanceOf(user1.address);
      expect(finalBalance - initialBalance).to.equal(refundAmount);

      expect(await bondingToken.balanceOf(user1.address)).to.equal(ethers.parseEther("400"));
    });

    it("Should enforce slippage protection on burn", async function () {
      const tokensToBurn = ethers.parseEther("100");
      const [refundAmount] = await bondingToken.getRefundForTokens(tokensToBurn);

      // Try to burn with too high min refund
      await expect(
        bondingToken.connect(user1).burn(tokensToBurn, refundAmount + 1n, user1.address)
      ).to.be.revertedWithCustomError(bondingToken, "BondingToken__SlippageExceeded");
    });
  });

  describe("Royalty System", function () {
    beforeEach(async function () {
      await mockERC20.connect(user1).approve(bondingToken.target, ethers.parseEther("10000"));
    });

    it("Should pay royalties on mint", async function () {
      const tokensToMint = ethers.parseEther("100");
      const [reserveAmount, royalty] = await bondingToken.getReserveForTokens(tokensToMint);

      const initialOwnerBalance = await mockERC20.balanceOf(owner.address);

      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);

      const finalOwnerBalance = await mockERC20.balanceOf(owner.address);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(royalty);
    });

    it("Should pay royalties on burn", async function () {
      // First mint
      const tokensToMint = ethers.parseEther("100");
      const [reserveAmount] = await bondingToken.getReserveForTokens(tokensToMint);
      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);

      // Then burn
      const tokensToBurn = ethers.parseEther("50");
      const [, royalty] = await bondingToken.getRefundForTokens(tokensToBurn);

      const initialOwnerBalance = await mockERC20.balanceOf(owner.address);

      await bondingToken.connect(user1).burn(tokensToBurn, 0, user1.address);

      const finalOwnerBalance = await mockERC20.balanceOf(owner.address);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(royalty);
    });
  });

  describe("Reserve Balance Management", function () {
    it("Should track reserve balance correctly", async function () {
      await mockERC20.connect(user1).approve(bondingToken.target, ethers.parseEther("10000"));

      const tokensToMint = ethers.parseEther("100");
      const [reserveAmount, royalty] = await bondingToken.getReserveForTokens(tokensToMint);

      await bondingToken.connect(user1).mint(tokensToMint, reserveAmount, user1.address);

      // Reserve balance should be net amount (after royalty)
      const expectedReserveBalance = reserveAmount - royalty;
      expect(await bondingToken.reserveBalance()).to.equal(expectedReserveBalance);
    });
  });
}); 