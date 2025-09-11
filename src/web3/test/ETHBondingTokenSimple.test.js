const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔥 ETH BONDING TOKEN - CORE FUNCTIONALITY", function () {
  let owner, creator, user1, user2, user3;
  let ethBondingToken;
  let BondingTokenETH;

  before(async function () {
    [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy BondingTokenETH contract factory
    BondingTokenETH = await ethers.getContractFactory("BondingTokenETH");
  });

  describe("🎯 ETH as Reserve Token - Core Tests", function () {
    it("Should create and use ETH bonding token successfully", async function () {
      console.log("\n=== ETH BONDING TOKEN - CORE FUNCTIONALITY ===\n");

      // ===== STEP 1: Deploy ETH Bonding Token =====
      console.log("🔥 STEP 1: Deploy ETH Bonding Token");

      ethBondingToken = await BondingTokenETH.deploy();
      await ethBondingToken.waitForDeployment();

      // Create a dummy NFT collection address for testing
      const dummyNFTCollection = ethers.Wallet.createRandom().address;

      // Initialize with ETH as reserve token (address(0))
      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
        { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") },
        { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }
      ];

      await ethBondingToken.initialize(
        "ETH Art Token",
        "ETHAT",
        creator.address,
        dummyNFTCollection,
        ethers.ZeroAddress, // ETH as reserve token!
        steps,
        200, // 2% mint royalty
        150, // 1.5% burn royalty
        creator.address
      );

      const reserveToken = await ethBondingToken.reserveToken();
      const maxSupply = await ethBondingToken.maxSupply();
      const tokenName = await ethBondingToken.name();
      const tokenSymbol = await ethBondingToken.symbol();

      console.log(`   ✅ Token: ${tokenName} (${tokenSymbol})`);
      console.log(`   ✅ Contract: ${await ethBondingToken.getAddress()}`);
      console.log(`   ✅ Reserve Token: ${reserveToken} (${reserveToken === ethers.ZeroAddress ? 'ETH' : 'ERC20'})`);
      console.log(`   ✅ Max Supply: ${ethers.formatEther(maxSupply)}`);

      expect(reserveToken).to.equal(ethers.ZeroAddress);
      expect(tokenName).to.equal("ETH Art Token");
      expect(tokenSymbol).to.equal("ETHAT");

      // ===== STEP 2: Test ETH-based Token Minting =====
      console.log("\n💰 STEP 2: Users mint tokens with ETH");

      // Check cost for different amounts
      const [cost100, royalty100] = await ethBondingToken.getReserveForTokens(ethers.parseEther("100"));
      const [cost500, royalty500] = await ethBondingToken.getReserveForTokens(ethers.parseEther("500"));

      console.log(`   💸 Cost for 100 tokens: ${ethers.formatEther(cost100)} ETH (${ethers.formatEther(royalty100)} royalty)`);
      console.log(`   💸 Cost for 500 tokens: ${ethers.formatEther(cost500)} ETH (${ethers.formatEther(royalty500)} royalty)`);

      // User1 mints 100 tokens with ETH
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

      await ethBondingToken.connect(user1).mint(
        ethers.parseEther("100"),
        ethers.parseEther("1"), // max willing to pay
        user1.address,
        { value: cost100 }
      );

      const user1TokenBalance = await ethBondingToken.balanceOf(user1.address);
      const contractETHBalance = await ethers.provider.getBalance(await ethBondingToken.getAddress());
      const reserveBalance = await ethBondingToken.reserveBalance();
      const totalSupply = await ethBondingToken.totalSupply();
      const currentPrice = await ethBondingToken.getCurrentPrice();

      console.log(`   ✅ User1 tokens: ${ethers.formatEther(user1TokenBalance)}`);
      console.log(`   ✅ Contract ETH: ${ethers.formatEther(contractETHBalance)} ETH`);
      console.log(`   ✅ Reserve balance: ${ethers.formatEther(reserveBalance)} ETH`);
      console.log(`   ✅ Total supply: ${ethers.formatEther(totalSupply)}`);
      console.log(`   ✅ Current price: ${ethers.formatEther(currentPrice)} ETH per token`);

      expect(user1TokenBalance).to.equal(ethers.parseEther("100"));
      expect(contractETHBalance).to.equal(cost100 - royalty100);
      expect(totalSupply).to.equal(ethers.parseEther("100"));

      // ===== STEP 3: Test Cross-Step Minting =====
      console.log("\n📈 STEP 3: Cross-step minting (1200 tokens)");

      // User2 mints 1200 tokens (crosses multiple steps)
      const [cost1200, royalty1200] = await ethBondingToken.getReserveForTokens(ethers.parseEther("1200"));
      console.log(`   💸 Cost for 1200 tokens: ${ethers.formatEther(cost1200)} ETH (${ethers.formatEther(royalty1200)} royalty)`);

      await ethBondingToken.connect(user2).mint(
        ethers.parseEther("1200"),
        ethers.parseEther("5"),
        user2.address,
        { value: cost1200 }
      );

      const user2TokenBalance = await ethBondingToken.balanceOf(user2.address);
      const newTotalSupply = await ethBondingToken.totalSupply();
      const newCurrentPrice = await ethBondingToken.getCurrentPrice();

      console.log(`   ✅ User2 tokens: ${ethers.formatEther(user2TokenBalance)}`);
      console.log(`   ✅ New total supply: ${ethers.formatEther(newTotalSupply)}`);
      console.log(`   ✅ New current price: ${ethers.formatEther(newCurrentPrice)} ETH per token`);

      expect(user2TokenBalance).to.equal(ethers.parseEther("1200"));
      expect(newTotalSupply).to.equal(ethers.parseEther("1300"));
      expect(newCurrentPrice).to.equal(ethers.parseEther("0.002")); // Should be in step 1

      // ===== STEP 4: Test ETH-based Token Burning =====
      console.log("\n🔥 STEP 4: Users burn tokens for ETH");

      const user1BalanceBeforeBurn = await ethers.provider.getBalance(user1.address);

      // User1 burns 50 tokens
      const [refund50, burnRoyalty50] = await ethBondingToken.getRefundForTokens(ethers.parseEther("50"));
      console.log(`   💰 Refund for 50 tokens: ${ethers.formatEther(refund50)} ETH (${ethers.formatEther(burnRoyalty50)} royalty)`);

      const burnTx = await ethBondingToken.connect(user1).burn(
        ethers.parseEther("50"),
        ethers.parseEther("0.01"), // min refund
        user1.address
      );

      const user1TokenBalanceAfterBurn = await ethBondingToken.balanceOf(user1.address);
      const finalTotalSupply = await ethBondingToken.totalSupply();
      const finalCurrentPrice = await ethBondingToken.getCurrentPrice();

      console.log(`   ✅ User1 remaining tokens: ${ethers.formatEther(user1TokenBalanceAfterBurn)}`);
      console.log(`   ✅ Final total supply: ${ethers.formatEther(finalTotalSupply)}`);
      console.log(`   ✅ Final current price: ${ethers.formatEther(finalCurrentPrice)} ETH per token`);

      expect(user1TokenBalanceAfterBurn).to.equal(ethers.parseEther("50"));
      expect(finalTotalSupply).to.equal(ethers.parseEther("1250")); // 1300 - 50

      // ===== STEP 5: Test UI Functions =====
      console.log("\n📊 STEP 5: Test UI view functions");

      const holderCount = await ethBondingToken.getHolderCount();
      const priceHistoryLength = await ethBondingToken.getPriceHistoryLength();
      const holders = await ethBondingToken.getHolders(0, 10);
      const [timestamps, prices, supplies] = await ethBondingToken.getPriceHistory(0, 5);

      console.log(`   ✅ Token holders: ${holderCount}`);
      console.log(`   ✅ Price history entries: ${priceHistoryLength}`);
      console.log(`   ✅ Holders: ${holders.map(h => h.slice(0, 8) + '...').join(', ')}`);
      console.log(`   ✅ Latest prices: ${prices.slice(0, 3).map(p => ethers.formatEther(p)).join(', ')} ETH`);

      expect(holderCount).to.equal(2); // user1 and user2
      expect(priceHistoryLength).to.be.gt(0);
      expect(holders.length).to.equal(2);

      // ===== STEP 6: Test Bonding Curve Info =====
      console.log("\n📋 STEP 6: Test bonding curve information");

      const curveInfo = await ethBondingToken.getBondingCurveInfo();
      const stepsLength = await ethBondingToken.getStepsLength();
      const step0 = await ethBondingToken.getStep(0);
      const step1 = await ethBondingToken.getStep(1);

      console.log(`   ✅ NFT Collection: ${curveInfo.nftCollection_}`);
      console.log(`   ✅ Reserve Token: ${curveInfo.reserveToken_} (${curveInfo.reserveToken_ === ethers.ZeroAddress ? 'ETH' : 'ERC20'})`);
      console.log(`   ✅ Reserve Balance: ${ethers.formatEther(curveInfo.reserveBalance_)} ETH`);
      console.log(`   ✅ Current Supply: ${ethers.formatEther(curveInfo.currentSupply)}`);
      console.log(`   ✅ Current Price: ${ethers.formatEther(curveInfo.currentPrice)} ETH`);
      console.log(`   ✅ Max Supply: ${ethers.formatEther(curveInfo.maxSupply_)}`);
      console.log(`   ✅ Mint Royalty: ${curveInfo.mintRoyalty_} bps (${Number(curveInfo.mintRoyalty_) / 100}%)`);
      console.log(`   ✅ Burn Royalty: ${curveInfo.burnRoyalty_} bps (${Number(curveInfo.burnRoyalty_) / 100}%)`);
      console.log(`   ✅ Steps: ${stepsLength}`);
      console.log(`   ✅ Step 0: ${ethers.formatEther(step0.rangeTo)} tokens @ ${ethers.formatEther(step0.price)} ETH`);
      console.log(`   ✅ Step 1: ${ethers.formatEther(step1.rangeTo)} tokens @ ${ethers.formatEther(step1.price)} ETH`);

      expect(curveInfo.reserveToken_).to.equal(ethers.ZeroAddress);
      expect(curveInfo.currentSupply).to.equal(ethers.parseEther("1250"));
      expect(curveInfo.mintRoyalty_).to.equal(200);
      expect(curveInfo.burnRoyalty_).to.equal(150);
      expect(stepsLength).to.equal(3);

      console.log("\n🎉 ETH BONDING TOKEN CORE FUNCTIONALITY: SUCCESS! 🎉");
    });

    it("Should handle ETH edge cases and errors", async function () {
      console.log("\n=== ETH EDGE CASES & ERROR HANDLING ===");

      // Deploy fresh token
      const ethToken = await BondingTokenETH.deploy();
      await ethToken.waitForDeployment();

      const steps = [{ rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }];
      const dummyNFT = ethers.Wallet.createRandom().address;

      await ethToken.initialize(
        "Test Token", "TEST", creator.address, dummyNFT,
        ethers.ZeroAddress, steps, 200, 150, creator.address
      );

      console.log("🛡️ Testing error conditions:");

      // Test: Insufficient ETH
      const [correctCost] = await ethToken.getReserveForTokens(ethers.parseEther("100"));

      await expect(
        ethToken.connect(user1).mint(
          ethers.parseEther("100"), ethers.parseEther("1"), user1.address,
          { value: correctCost - 1n }
        )
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__InsufficientETH");
      console.log("   ✅ Insufficient ETH: Rejected");

      // Test: Zero tokens
      await expect(
        ethToken.connect(user1).mint(0, ethers.parseEther("1"), user1.address, { value: 0 })
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__InvalidAmount");
      console.log("   ✅ Zero tokens: Rejected");

      // Test: Invalid receiver
      await expect(
        ethToken.connect(user1).mint(
          ethers.parseEther("100"), ethers.parseEther("1"), ethers.ZeroAddress,
          { value: correctCost }
        )
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__InvalidReceiver");
      console.log("   ✅ Invalid receiver: Rejected");

      // Test: Slippage protection
      await expect(
        ethToken.connect(user1).mint(
          ethers.parseEther("100"), ethers.parseEther("0.01"), user1.address, // max too low
          { value: correctCost }
        )
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__SlippageExceeded");
      console.log("   ✅ Slippage protection: Works");

      // Test: Burn without tokens
      await expect(
        ethToken.connect(user1).burn(ethers.parseEther("100"), 0, user1.address)
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__InsufficientTokens");
      console.log("   ✅ Burn without tokens: Rejected");

      console.log("\n🔒 Testing ETH vs ERC20 protection:");

      // Deploy ERC20 token for comparison
      const erc20Token = await BondingTokenETH.deploy();
      await erc20Token.waitForDeployment();

      // Initialize with mock ERC20 (not ETH)
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockERC20 = await MockERC20.deploy("Mock Token", "MOCK", 18);
      await mockERC20.waitForDeployment();

      await erc20Token.initialize(
        "ERC20 Token", "ERC20T", creator.address, dummyNFT,
        await mockERC20.getAddress(), steps, 200, 150, creator.address
      );

      // Test: Send ETH to ERC20 token
      await expect(
        erc20Token.connect(user1).mint(
          ethers.parseEther("100"), ethers.parseEther("1"), user1.address,
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(erc20Token, "BondingTokenETH__UnexpectedETH");
      console.log("   ✅ ETH to ERC20 token: Rejected");

      // Test: Direct ETH transfer to ERC20 token
      await expect(
        user1.sendTransaction({
          to: await erc20Token.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(erc20Token, "BondingTokenETH__UnexpectedETH");
      console.log("   ✅ Direct ETH to ERC20 token: Rejected");

      // Test: Direct ETH transfer to ETH token (should work)
      await expect(
        user1.sendTransaction({
          to: await ethToken.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.not.be.reverted;
      console.log("   ✅ Direct ETH to ETH token: Accepted");

      console.log("\n✅ ALL EDGE CASES & ERROR HANDLING: PASSED");
    });

    it("Should demonstrate ETH vs ERC20 comparison", async function () {
      console.log("\n=== ETH vs ERC20 RESERVE TOKEN COMPARISON ===");

      // Deploy both token types
      const ethToken = await BondingTokenETH.deploy();
      const erc20Token = await BondingTokenETH.deploy();

      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockERC20 = await MockERC20.deploy("Mock USDC", "MUSDC", 6); // 6 decimals like USDC
      await mockERC20.waitForDeployment();

      const steps = [{ rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }];
      const dummyNFT = ethers.Wallet.createRandom().address;

      // Initialize ETH token
      await ethToken.initialize(
        "ETH Token", "ETHT", creator.address, dummyNFT,
        ethers.ZeroAddress, steps, 200, 150, creator.address
      );

      // Initialize ERC20 token
      await erc20Token.initialize(
        "USDC Token", "USDCT", creator.address, dummyNFT,
        await mockERC20.getAddress(), steps, 200, 150, creator.address
      );

      console.log("📊 Token Comparison:");
      console.log(`   🔥 ETH Token: ${await ethToken.name()} (${await ethToken.symbol()})`);
      console.log(`   🏦 Reserve: ${await ethToken.reserveToken()} (ETH)`);
      console.log(`   🪙 ERC20 Token: ${await erc20Token.name()} (${await erc20Token.symbol()})`);
      console.log(`   🏦 Reserve: ${await erc20Token.reserveToken()} (${await mockERC20.symbol()})`);

      // Test minting costs
      const [ethCost] = await ethToken.getReserveForTokens(ethers.parseEther("100"));
      const [erc20Cost] = await erc20Token.getReserveForTokens(ethers.parseEther("100"));

      console.log(`\n💰 Minting 100 tokens:`);
      console.log(`   🔥 ETH cost: ${ethers.formatEther(ethCost)} ETH`);
      console.log(`   🪙 ERC20 cost: ${ethers.formatEther(erc20Cost)} MUSDC`);

      // Mint tokens
      await ethToken.connect(user1).mint(
        ethers.parseEther("100"), ethCost, user1.address,
        { value: ethCost }
      );

      await mockERC20.mint(user2.address, ethers.parseEther("1000"));
      await mockERC20.connect(user2).approve(await erc20Token.getAddress(), erc20Cost);
      await erc20Token.connect(user2).mint(
        ethers.parseEther("100"), erc20Cost, user2.address
      );

      const ethTokenBalance = await ethToken.balanceOf(user1.address);
      const erc20TokenBalance = await erc20Token.balanceOf(user2.address);

      console.log(`\n✅ Results:`);
      console.log(`   🔥 User1 ETH tokens: ${ethers.formatEther(ethTokenBalance)}`);
      console.log(`   🪙 User2 USDC tokens: ${ethers.formatEther(erc20TokenBalance)}`);

      expect(ethTokenBalance).to.equal(ethers.parseEther("100"));
      expect(erc20TokenBalance).to.equal(ethers.parseEther("100"));

      console.log("\n🎯 Key Differences:");
      console.log("   ✅ ETH Token: Direct ETH payments, no approvals needed");
      console.log("   ✅ ERC20 Token: Requires token approval, more predictable costs");
      console.log("   ✅ Both: Same bonding curve math, same royalty system");
      console.log("   ✅ Both: Full UI support with holder tracking and price history");

      console.log("\n🌟 BOTH RESERVE TOKEN TYPES: FULLY FUNCTIONAL!");
    });
  });
}); 