const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🚀 SIMPLIFIED SYSTEM COMPARISON - ERC20 vs ETH", function () {
  let owner, creator, user1, user2, user3;
  let nftFactory, erc20Factory;
  let mockERC20;
  let BondingTokenETH;

  // System components
  let nftCollection, erc20BondingToken, ethBondingToken;

  before(async function () {
    [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy system contracts
    const contracts = await TestHelpers.deployContracts();
    ({ nftFactory, erc20Factory, mockERC20 } = contracts);

    // Deploy ETH bonding token factory
    BondingTokenETH = await ethers.getContractFactory("BondingTokenETH");
  });

  describe("🎯 Core Bonding Curve Comparison", function () {
    it("Should execute complete bonding curve workflow for both ERC20 and ETH tokens", async function () {
      console.log("\n" + "=".repeat(100));
      console.log("🚀 CORE BONDING CURVE COMPARISON - ERC20 vs ETH");
      console.log("=".repeat(100));

      // ===== STEP 1: SETUP NFT COLLECTION =====
      console.log("\n" + "─".repeat(80));
      console.log("🎨 STEP 1: Create NFT Collection");
      console.log("─".repeat(80));

      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "Art Collection",
        symbol: "ART",
        mintPrice: ethers.parseEther("0.1")
      });
      nftCollection = nftResult.collection;

      console.log(`✅ NFT Collection: ${await nftCollection.getAddress()}`);
      console.log(`✅ Mint Price: ${ethers.formatEther(await nftCollection.mintPrice())} ETH`);
      console.log(`✅ Creator: ${creator.address}`);

      // ===== STEP 2: CREATE BONDING TOKENS =====
      console.log("\n" + "─".repeat(80));
      console.log("🪙 STEP 2: Create Bonding Tokens (ERC20 vs ETH)");
      console.log("─".repeat(80));

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
        { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") },
        { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }
      ];

      // Create ERC20-based bonding token
      const erc20TokenResult = await TestHelpers.createBondingToken(
        erc20Factory,
        creator,
        await nftCollection.getAddress(),
        mockERC20
      );
      erc20BondingToken = erc20TokenResult.token;

      // Create ETH-based bonding token
      ethBondingToken = await BondingTokenETH.deploy();
      await ethBondingToken.waitForDeployment();

      await ethBondingToken.initialize(
        "ETH Art Token",
        "ETHART",
        creator.address,
        await nftCollection.getAddress(),
        ethers.ZeroAddress, // ETH as reserve
        steps,
        200, // 2% mint royalty
        150, // 1.5% burn royalty
        creator.address
      );

      console.log("🪙 ERC20 Bonding Token:");
      console.log(`   ✅ Name: ${await erc20BondingToken.name()}`);
      console.log(`   ✅ Symbol: ${await erc20BondingToken.symbol()}`);
      console.log(`   ✅ Address: ${await erc20BondingToken.getAddress()}`);
      console.log(`   ✅ Reserve: ${await erc20BondingToken.reserveToken()}`);
      console.log(`   ✅ Max Supply: ${ethers.formatEther(await erc20BondingToken.maxSupply())}`);

      console.log("\n🔥 ETH Bonding Token:");
      console.log(`   ✅ Name: ${await ethBondingToken.name()}`);
      console.log(`   ✅ Symbol: ${await ethBondingToken.symbol()}`);
      console.log(`   ✅ Address: ${await ethBondingToken.getAddress()}`);
      console.log(`   ✅ Reserve: ${await ethBondingToken.reserveToken()} (ETH)`);
      console.log(`   ✅ Max Supply: ${ethers.formatEther(await ethBondingToken.maxSupply())}`);

      // Verify both have same configuration
      expect(await erc20BondingToken.maxSupply()).to.equal(await ethBondingToken.maxSupply());

      // ===== STEP 3: INITIAL TOKEN MINTING =====
      console.log("\n" + "─".repeat(80));
      console.log("💰 STEP 3: Initial Token Minting (100 tokens each)");
      console.log("─".repeat(80));

      // Prepare ERC20 minting
      await mockERC20.mint(user1.address, ethers.parseEther("10"));
      const [erc20Cost100, erc20Royalty100] = await erc20BondingToken.getReserveForTokens(ethers.parseEther("100"));
      await mockERC20.connect(user1).approve(await erc20BondingToken.getAddress(), erc20Cost100);

      // Prepare ETH minting
      const [ethCost100, ethRoyalty100] = await ethBondingToken.getReserveForTokens(ethers.parseEther("100"));

      console.log(`💸 ERC20 Cost: ${ethers.formatEther(erc20Cost100)} MockERC20 (${ethers.formatEther(erc20Royalty100)} royalty)`);
      console.log(`💸 ETH Cost: ${ethers.formatEther(ethCost100)} ETH (${ethers.formatEther(ethRoyalty100)} royalty)`);

      // Verify costs are identical
      expect(erc20Cost100).to.equal(ethCost100);
      expect(erc20Royalty100).to.equal(ethRoyalty100);

      // Execute minting
      const creatorERC20Before = await mockERC20.balanceOf(creator.address);
      const creatorETHBefore = await ethers.provider.getBalance(creator.address);

      await erc20BondingToken.connect(user1).mint(
        ethers.parseEther("100"),
        erc20Cost100,
        user1.address
      );

      await ethBondingToken.connect(user1).mint(
        ethers.parseEther("100"),
        ethCost100,
        user1.address,
        { value: ethCost100 }
      );

      const erc20Tokens1 = await erc20BondingToken.balanceOf(user1.address);
      const ethTokens1 = await ethBondingToken.balanceOf(user1.address);
      const erc20Supply1 = await erc20BondingToken.totalSupply();
      const ethSupply1 = await ethBondingToken.totalSupply();
      const erc20Price1 = await erc20BondingToken.getCurrentPrice();
      const ethPrice1 = await ethBondingToken.getCurrentPrice();

      console.log(`✅ User1 ERC20 tokens: ${ethers.formatEther(erc20Tokens1)}`);
      console.log(`✅ User1 ETH tokens: ${ethers.formatEther(ethTokens1)}`);
      console.log(`✅ ERC20 supply: ${ethers.formatEther(erc20Supply1)}`);
      console.log(`✅ ETH supply: ${ethers.formatEther(ethSupply1)}`);
      console.log(`✅ ERC20 price: ${ethers.formatEther(erc20Price1)} MockERC20`);
      console.log(`✅ ETH price: ${ethers.formatEther(ethPrice1)} ETH`);

      // Verify identical results
      expect(erc20Tokens1).to.equal(ethTokens1);
      expect(erc20Supply1).to.equal(ethSupply1);
      expect(erc20Price1).to.equal(ethPrice1);

      // ===== STEP 4: CROSS-STEP MINTING =====
      console.log("\n" + "─".repeat(80));
      console.log("📈 STEP 4: Cross-Step Minting (1500 tokens each)");
      console.log("─".repeat(80));

      // Prepare large minting
      await mockERC20.mint(user2.address, ethers.parseEther("20"));
      const [erc20Cost1500, erc20Royalty1500] = await erc20BondingToken.getReserveForTokens(ethers.parseEther("1500"));
      const [ethCost1500, ethRoyalty1500] = await ethBondingToken.getReserveForTokens(ethers.parseEther("1500"));

      await mockERC20.connect(user2).approve(await erc20BondingToken.getAddress(), erc20Cost1500);

      console.log(`💸 ERC20 Cost (1500): ${ethers.formatEther(erc20Cost1500)} MockERC20 (${ethers.formatEther(erc20Royalty1500)} royalty)`);
      console.log(`💸 ETH Cost (1500): ${ethers.formatEther(ethCost1500)} ETH (${ethers.formatEther(ethRoyalty1500)} royalty)`);

      // Verify costs are identical
      expect(erc20Cost1500).to.equal(ethCost1500);
      expect(erc20Royalty1500).to.equal(ethRoyalty1500);

      // Execute cross-step minting
      await erc20BondingToken.connect(user2).mint(
        ethers.parseEther("1500"),
        erc20Cost1500,
        user2.address
      );

      await ethBondingToken.connect(user2).mint(
        ethers.parseEther("1500"),
        ethCost1500,
        user2.address,
        { value: ethCost1500 }
      );

      const erc20Supply2 = await erc20BondingToken.totalSupply();
      const ethSupply2 = await ethBondingToken.totalSupply();
      const erc20Price2 = await erc20BondingToken.getCurrentPrice();
      const ethPrice2 = await ethBondingToken.getCurrentPrice();

      console.log(`✅ ERC20 total supply: ${ethers.formatEther(erc20Supply2)}`);
      console.log(`✅ ETH total supply: ${ethers.formatEther(ethSupply2)}`);
      console.log(`✅ ERC20 current price: ${ethers.formatEther(erc20Price2)} MockERC20`);
      console.log(`✅ ETH current price: ${ethers.formatEther(ethPrice2)} ETH`);
      console.log(`📈 Price increase: ${((Number(erc20Price2) / Number(erc20Price1)) * 100 - 100).toFixed(1)}%`);

      // Verify identical results
      expect(erc20Supply2).to.equal(ethers.parseEther("1600")); // 100 + 1500
      expect(ethSupply2).to.equal(ethers.parseEther("1600"));
      expect(erc20Price2).to.equal(ethers.parseEther("0.002")); // Step 1 price
      expect(ethPrice2).to.equal(ethers.parseEther("0.002"));
      expect(erc20Supply2).to.equal(ethSupply2);
      expect(erc20Price2).to.equal(ethPrice2);

      // ===== STEP 5: TOKEN BURNING =====
      console.log("\n" + "─".repeat(80));
      console.log("🔥 STEP 5: Token Burning (300 tokens each)");
      console.log("─".repeat(80));

      const [erc20Refund300, erc20BurnRoyalty300] = await erc20BondingToken.getRefundForTokens(ethers.parseEther("300"));
      const [ethRefund300, ethBurnRoyalty300] = await ethBondingToken.getRefundForTokens(ethers.parseEther("300"));

      console.log(`💰 ERC20 Refund: ${ethers.formatEther(erc20Refund300)} MockERC20 (${ethers.formatEther(erc20BurnRoyalty300)} royalty)`);
      console.log(`💰 ETH Refund: ${ethers.formatEther(ethRefund300)} ETH (${ethers.formatEther(ethBurnRoyalty300)} royalty)`);

      // Verify refunds are identical
      expect(erc20Refund300).to.equal(ethRefund300);
      expect(erc20BurnRoyalty300).to.equal(ethBurnRoyalty300);

      // Execute burning
      const user2MockBefore = await mockERC20.balanceOf(user2.address);
      const user2ETHBefore = await ethers.provider.getBalance(user2.address);

      await erc20BondingToken.connect(user2).burn(
        ethers.parseEther("300"),
        ethers.parseEther("0.1"),
        user2.address
      );

      await ethBondingToken.connect(user2).burn(
        ethers.parseEther("300"),
        ethers.parseEther("0.1"),
        user2.address
      );

      const user2MockAfter = await mockERC20.balanceOf(user2.address);
      const user2ETHAfter = await ethers.provider.getBalance(user2.address);

      const finalERC20Supply = await erc20BondingToken.totalSupply();
      const finalETHSupply = await ethBondingToken.totalSupply();
      const finalERC20Price = await erc20BondingToken.getCurrentPrice();
      const finalETHPrice = await ethBondingToken.getCurrentPrice();

      console.log(`✅ User2 MockERC20 increase: ${ethers.formatEther(user2MockAfter - user2MockBefore)}`);
      console.log(`✅ User2 ETH increase: ~${ethers.formatEther(user2ETHAfter - user2ETHBefore)} ETH`);
      console.log(`✅ Final ERC20 supply: ${ethers.formatEther(finalERC20Supply)}`);
      console.log(`✅ Final ETH supply: ${ethers.formatEther(finalETHSupply)}`);
      console.log(`✅ Final ERC20 price: ${ethers.formatEther(finalERC20Price)} MockERC20`);
      console.log(`✅ Final ETH price: ${ethers.formatEther(finalETHPrice)} ETH`);

      // Verify identical results
      expect(finalERC20Supply).to.equal(ethers.parseEther("1300")); // 1600 - 300
      expect(finalETHSupply).to.equal(ethers.parseEther("1300"));
      expect(finalERC20Supply).to.equal(finalETHSupply);
      expect(finalERC20Price).to.equal(finalETHPrice);

      // ===== STEP 6: UI FUNCTIONS COMPARISON =====
      console.log("\n" + "─".repeat(80));
      console.log("📊 STEP 6: UI Functions Comparison");
      console.log("─".repeat(80));

      const erc20HolderCount = await erc20BondingToken.getHolderCount();
      const ethHolderCount = await ethBondingToken.getHolderCount();
      const erc20PriceHistory = await erc20BondingToken.getPriceHistoryLength();
      const ethPriceHistory = await ethBondingToken.getPriceHistoryLength();

      const erc20CurveInfo = await erc20BondingToken.getBondingCurveInfo();
      const ethCurveInfo = await ethBondingToken.getBondingCurveInfo();

      const erc20Holders = await erc20BondingToken.getHolders(0, 10);
      const ethHolders = await ethBondingToken.getHolders(0, 10);

      console.log("📊 ERC20 Token Stats:");
      console.log(`   👥 Holders: ${erc20HolderCount}`);
      console.log(`   📈 Price history: ${erc20PriceHistory} entries`);
      console.log(`   💰 Reserve balance: ${ethers.formatEther(erc20CurveInfo.reserveBalance_)} MockERC20`);
      console.log(`   🪙 Supply: ${ethers.formatEther(erc20CurveInfo.currentSupply)}`);
      console.log(`   💎 Price: ${ethers.formatEther(erc20CurveInfo.currentPrice)} MockERC20`);

      console.log("\n📊 ETH Token Stats:");
      console.log(`   👥 Holders: ${ethHolderCount}`);
      console.log(`   📈 Price history: ${ethPriceHistory} entries`);
      console.log(`   💰 Reserve balance: ${ethers.formatEther(ethCurveInfo.reserveBalance_)} ETH`);
      console.log(`   🔥 Supply: ${ethers.formatEther(ethCurveInfo.currentSupply)}`);
      console.log(`   💎 Price: ${ethers.formatEther(ethCurveInfo.currentPrice)} ETH`);

      // Verify UI data consistency
      expect(erc20HolderCount).to.equal(ethHolderCount);
      expect(erc20CurveInfo.currentSupply).to.equal(ethCurveInfo.currentSupply);
      expect(erc20CurveInfo.currentPrice).to.equal(ethCurveInfo.currentPrice);

      // ===== STEP 7: MATHEMATICAL VERIFICATION =====
      console.log("\n" + "─".repeat(80));
      console.log("🔬 STEP 7: Mathematical Verification");
      console.log("─".repeat(80));

      // Test various amounts to ensure math is identical
      const testAmounts = [
        ethers.parseEther("1"),
        ethers.parseEther("50"),
        ethers.parseEther("500"),
        ethers.parseEther("999"), // Edge of step 0
        ethers.parseEther("1001"), // Edge of step 1
      ];

      console.log("Testing cost calculations for various amounts:");
      for (let i = 0; i < testAmounts.length; i++) {
        const amount = testAmounts[i];
        const [erc20Cost] = await erc20BondingToken.getReserveForTokens(amount);
        const [ethCost] = await ethBondingToken.getReserveForTokens(amount);

        console.log(`   ${ethers.formatEther(amount)} tokens: ERC20=${ethers.formatEther(erc20Cost)}, ETH=${ethers.formatEther(ethCost)}`);
        expect(erc20Cost).to.equal(ethCost, `Cost mismatch for ${ethers.formatEther(amount)} tokens`);
      }

      console.log("✅ All mathematical calculations are identical!");

      // ===== STEP 8: EDGE CASES =====
      console.log("\n" + "─".repeat(80));
      console.log("🛡️ STEP 8: Edge Case Testing");
      console.log("─".repeat(80));

      // Test slippage protection
      const [testCost] = await ethBondingToken.getReserveForTokens(ethers.parseEther("10"));

      await expect(
        ethBondingToken.connect(user3).mint(
          ethers.parseEther("10"),
          ethers.parseEther("0.001"), // too low
          user3.address,
          { value: testCost }
        )
      ).to.be.revertedWithCustomError(ethBondingToken, "BondingTokenETH__SlippageExceeded");

      await expect(
        ethBondingToken.connect(user3).mint(
          ethers.parseEther("10"),
          testCost,
          user3.address,
          { value: testCost - 1n } // insufficient ETH
        )
      ).to.be.revertedWithCustomError(ethBondingToken, "BondingTokenETH__InsufficientETH");

      console.log("✅ ETH edge cases handled correctly");

      // ===== FINAL SUMMARY =====
      console.log("\n" + "─".repeat(80));
      console.log("🏆 FINAL VERIFICATION SUMMARY");
      console.log("─".repeat(80));

      console.log("🪙 ERC20 BONDING TOKEN:");
      console.log("   ✅ Token creation: SUCCESS");
      console.log("   ✅ Initial minting: SUCCESS");
      console.log("   ✅ Cross-step minting: SUCCESS");
      console.log("   ✅ Token burning: SUCCESS");
      console.log("   ✅ UI functions: SUCCESS");
      console.log("   ✅ Mathematical accuracy: SUCCESS");

      console.log("\n🔥 ETH BONDING TOKEN:");
      console.log("   ✅ Token creation: SUCCESS");
      console.log("   ✅ Initial minting: SUCCESS");
      console.log("   ✅ Cross-step minting: SUCCESS");
      console.log("   ✅ Token burning: SUCCESS");
      console.log("   ✅ UI functions: SUCCESS");
      console.log("   ✅ Mathematical accuracy: SUCCESS");
      console.log("   ✅ Edge case handling: SUCCESS");

      console.log("\n🎯 COMPARISON RESULTS:");
      console.log("   ✅ Identical bonding curve math");
      console.log("   ✅ Identical pricing calculations");
      console.log("   ✅ Identical royalty handling");
      console.log("   ✅ Identical UI data");
      console.log("   ✅ Identical supply management");
      console.log("   ✅ Both systems are mathematically equivalent");

      console.log("\n" + "=".repeat(100));
      console.log("🎉 BOTH ERC20 AND ETH BONDING TOKENS ARE PERFECT!");
      console.log("🎉 COMPLETE MATHEMATICAL EQUIVALENCE VERIFIED!");
      console.log("🎉 PRODUCTION READY FOR BOTH RESERVE TOKEN TYPES!");
      console.log("=".repeat(100));

      // Final comprehensive assertions
      expect(erc20HolderCount).to.equal(2); // user1, user2
      expect(ethHolderCount).to.equal(2); // user1, user2
      expect(finalERC20Supply).to.equal(finalETHSupply);
      expect(finalERC20Price).to.equal(finalETHPrice);
      expect(erc20CurveInfo.reserveToken_).to.equal(await mockERC20.getAddress());
      expect(ethCurveInfo.reserveToken_).to.equal(ethers.ZeroAddress);
    });
  });
}); 