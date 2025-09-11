const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔥 ETH BONDING TOKEN - COMPLETE DEMO", function () {
  let creator, user1, user2, user3;
  let ethBondingToken;
  let BondingTokenETH;

  before(async function () {
    [, creator, user1, user2, user3] = await ethers.getSigners();
    BondingTokenETH = await ethers.getContractFactory("BondingTokenETH");
  });

  it("Should demonstrate complete ETH bonding token use case", async function () {
    console.log("\n" + "=".repeat(80));
    console.log("🔥 ETH BONDING TOKEN - COMPLETE DEMONSTRATION");
    console.log("=".repeat(80));

    console.log("\n🎯 SCENARIO: Art Collection with ETH-based Bonding Curve Token");
    console.log("   • Creator launches art collection");
    console.log("   • Creates bonding curve token using ETH as reserve currency");
    console.log("   • Users can buy/sell tokens directly with ETH");
    console.log("   • No need for wrapped tokens or external exchanges");

    // ===== DEPLOY & INITIALIZE =====
    console.log("\n" + "─".repeat(60));
    console.log("📦 STEP 1: Deploy ETH Bonding Token");
    console.log("─".repeat(60));

    ethBondingToken = await BondingTokenETH.deploy();
    await ethBondingToken.waitForDeployment();

    const dummyNFTCollection = ethers.Wallet.createRandom().address;
    const steps = [
      { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },   // 0-1000: 0.001 ETH
      { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") },   // 1000-5000: 0.002 ETH
      { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }   // 5000-10000: 0.005 ETH
    ];

    await ethBondingToken.initialize(
      "ArtCoin",
      "ART",
      creator.address,
      dummyNFTCollection,
      ethers.ZeroAddress, // ETH as reserve!
      steps,
      200, // 2% mint royalty
      150, // 1.5% burn royalty
      creator.address
    );

    console.log(`✅ Token Name: ${await ethBondingToken.name()}`);
    console.log(`✅ Token Symbol: ${await ethBondingToken.symbol()}`);
    console.log(`✅ Contract: ${await ethBondingToken.getAddress()}`);
    console.log(`✅ Reserve Token: ${await ethBondingToken.reserveToken()} (ETH)`);
    console.log(`✅ Max Supply: ${ethers.formatEther(await ethBondingToken.maxSupply())} tokens`);
    console.log(`✅ Creator: ${creator.address}`);

    // ===== USER 1: EARLY ADOPTER =====
    console.log("\n" + "─".repeat(60));
    console.log("👤 STEP 2: User1 - Early Adopter (100 tokens)");
    console.log("─".repeat(60));

    const [cost100, royalty100] = await ethBondingToken.getReserveForTokens(ethers.parseEther("100"));
    console.log(`💰 Cost for 100 tokens: ${ethers.formatEther(cost100)} ETH`);
    console.log(`👑 Royalty to creator: ${ethers.formatEther(royalty100)} ETH`);

    const user1ETHBefore = await ethers.provider.getBalance(user1.address);
    const creatorETHBefore = await ethers.provider.getBalance(creator.address);

    await ethBondingToken.connect(user1).mint(
      ethers.parseEther("100"),
      ethers.parseEther("1"), // max willing to pay
      user1.address,
      { value: cost100 }
    );

    const user1Tokens = await ethBondingToken.balanceOf(user1.address);
    const contractETH = await ethers.provider.getBalance(await ethBondingToken.getAddress());
    const creatorETHAfter = await ethers.provider.getBalance(creator.address);
    const currentPrice = await ethBondingToken.getCurrentPrice();

    console.log(`✅ User1 tokens: ${ethers.formatEther(user1Tokens)} ART`);
    console.log(`✅ Contract ETH balance: ${ethers.formatEther(contractETH)} ETH`);
    console.log(`✅ Creator earned: ${ethers.formatEther(creatorETHAfter - creatorETHBefore)} ETH`);
    console.log(`✅ Current token price: ${ethers.formatEther(currentPrice)} ETH`);

    // ===== USER 2: WHALE PURCHASE =====
    console.log("\n" + "─".repeat(60));
    console.log("🐋 STEP 3: User2 - Whale Purchase (2000 tokens, crosses steps)");
    console.log("─".repeat(60));

    const [cost2000, royalty2000] = await ethBondingToken.getReserveForTokens(ethers.parseEther("2000"));
    console.log(`💰 Cost for 2000 tokens: ${ethers.formatEther(cost2000)} ETH`);
    console.log(`👑 Royalty to creator: ${ethers.formatEther(royalty2000)} ETH`);

    const creatorETHBefore2 = await ethers.provider.getBalance(creator.address);

    await ethBondingToken.connect(user2).mint(
      ethers.parseEther("2000"),
      ethers.parseEther("10"), // max willing to pay
      user2.address,
      { value: cost2000 }
    );

    const user2Tokens = await ethBondingToken.balanceOf(user2.address);
    const totalSupply = await ethBondingToken.totalSupply();
    const newPrice = await ethBondingToken.getCurrentPrice();
    const creatorETHAfter2 = await ethers.provider.getBalance(creator.address);

    console.log(`✅ User2 tokens: ${ethers.formatEther(user2Tokens)} ART`);
    console.log(`✅ Total supply: ${ethers.formatEther(totalSupply)} ART`);
    console.log(`✅ New token price: ${ethers.formatEther(newPrice)} ETH`);
    console.log(`✅ Creator earned: ${ethers.formatEther(creatorETHAfter2 - creatorETHBefore2)} ETH`);
    console.log(`📈 Price increase: ${((Number(newPrice) / Number(currentPrice)) * 100 - 100).toFixed(1)}%`);

    // ===== USER 3: SMALLER PURCHASE =====
    console.log("\n" + "─".repeat(60));
    console.log("👥 STEP 4: User3 - Regular Purchase (300 tokens)");
    console.log("─".repeat(60));

    const [cost300, royalty300] = await ethBondingToken.getReserveForTokens(ethers.parseEther("300"));
    console.log(`💰 Cost for 300 tokens: ${ethers.formatEther(cost300)} ETH`);

    await ethBondingToken.connect(user3).mint(
      ethers.parseEther("300"),
      ethers.parseEther("5"),
      user3.address,
      { value: cost300 }
    );

    const user3Tokens = await ethBondingToken.balanceOf(user3.address);
    const finalSupply = await ethBondingToken.totalSupply();
    const finalPrice = await ethBondingToken.getCurrentPrice();

    console.log(`✅ User3 tokens: ${ethers.formatEther(user3Tokens)} ART`);
    console.log(`✅ Final supply: ${ethers.formatEther(finalSupply)} ART`);
    console.log(`✅ Final price: ${ethers.formatEther(finalPrice)} ETH`);

    // ===== SELLING DEMONSTRATION =====
    console.log("\n" + "─".repeat(60));
    console.log("💸 STEP 5: User1 sells 50 tokens back to ETH");
    console.log("─".repeat(60));

    const [refund50, burnRoyalty50] = await ethBondingToken.getRefundForTokens(ethers.parseEther("50"));
    console.log(`💰 Refund for 50 tokens: ${ethers.formatEther(refund50)} ETH`);
    console.log(`👑 Burn royalty: ${ethers.formatEther(burnRoyalty50)} ETH`);

    const user1ETHBeforeSell = await ethers.provider.getBalance(user1.address);

    await ethBondingToken.connect(user1).burn(
      ethers.parseEther("50"),
      ethers.parseEther("0.01"), // min refund
      user1.address
    );

    const user1TokensAfterSell = await ethBondingToken.balanceOf(user1.address);
    const user1ETHAfterSell = await ethers.provider.getBalance(user1.address);

    console.log(`✅ User1 remaining tokens: ${ethers.formatEther(user1TokensAfterSell)} ART`);
    console.log(`✅ User1 ETH increase: ~${ethers.formatEther(user1ETHAfterSell - user1ETHBeforeSell)} ETH`);

    // ===== SYSTEM STATISTICS =====
    console.log("\n" + "─".repeat(60));
    console.log("📊 STEP 6: System Statistics & UI Data");
    console.log("─".repeat(60));

    const holderCount = await ethBondingToken.getHolderCount();
    const priceHistoryLength = await ethBondingToken.getPriceHistoryLength();
    const holders = await ethBondingToken.getHolders(0, 10);
    const [timestamps, prices, supplies] = await ethBondingToken.getPriceHistory(0, 10);
    const curveInfo = await ethBondingToken.getBondingCurveInfo();

    console.log(`📈 Token holders: ${holderCount}`);
    console.log(`📊 Price history entries: ${priceHistoryLength}`);
    console.log(`💰 Contract ETH balance: ${ethers.formatEther(curveInfo.reserveBalance_)} ETH`);
    console.log(`🔄 Total tokens in circulation: ${ethers.formatEther(curveInfo.currentSupply)} ART`);
    console.log(`💎 Current token price: ${ethers.formatEther(curveInfo.currentPrice)} ETH`);

    console.log(`\n📈 Price History (last 3 entries):`);
    for (let i = Math.max(0, prices.length - 3); i < prices.length; i++) {
      const date = new Date(Number(timestamps[i]) * 1000);
      console.log(`   ${i + 1}. ${ethers.formatEther(prices[i])} ETH @ supply ${ethers.formatEther(supplies[i])}`);
    }

    // ===== FINAL SUMMARY =====
    console.log("\n" + "─".repeat(60));
    console.log("🎉 FINAL SUMMARY");
    console.log("─".repeat(60));

    const totalCreatorRoyalties = royalty100 + royalty2000 + royalty300 + burnRoyalty50;
    console.log(`✅ Creator total royalties: ${ethers.formatEther(totalCreatorRoyalties)} ETH`);
    console.log(`✅ Total ETH in bonding curve: ${ethers.formatEther(curveInfo.reserveBalance_)} ETH`);
    console.log(`✅ Tokens distributed: ${ethers.formatEther(curveInfo.currentSupply)} ART`);
    console.log(`✅ Active holders: ${holderCount}`);
    console.log(`✅ Price appreciation: ${((Number(curveInfo.currentPrice) / Number(ethers.parseEther("0.001"))) * 100 - 100).toFixed(1)}%`);

    console.log("\n🌟 KEY BENEFITS OF ETH RESERVE TOKEN:");
    console.log("   ✅ Direct ETH payments - no token approvals needed");
    console.log("   ✅ Familiar UX - users just send ETH");
    console.log("   ✅ Instant liquidity - always can buy/sell");
    console.log("   ✅ Transparent pricing - bonding curve math");
    console.log("   ✅ Creator royalties - sustainable revenue");
    console.log("   ✅ No external dependencies - self-contained system");

    console.log("\n" + "=".repeat(80));
    console.log("🎉 ETH BONDING TOKEN DEMONSTRATION: COMPLETE SUCCESS!");
    console.log("=".repeat(80));

    // Final assertions to ensure everything worked correctly
    expect(await ethBondingToken.reserveToken()).to.equal(ethers.ZeroAddress);
    expect(holderCount).to.equal(3); // user1, user2, user3
    expect(Number(curveInfo.currentSupply)).to.be.greaterThan(0);
    expect(Number(curveInfo.reserveBalance_)).to.be.greaterThan(0);
  });
}); 