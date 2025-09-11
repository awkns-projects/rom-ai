const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("💰 RESERVE TOKEN EXPLANATION", function () {
  let contracts, creator, user1, mockERC20;
  let nftFactory, erc20Factory;

  before(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ creator, user1, nftFactory, erc20Factory, mockERC20 } = contracts);
  });

  it("Should explain what Reserve Token is and why it has that address", async function () {
    console.log("\n=== WHAT IS A RESERVE TOKEN? ===\n");

    // 1. Show the MockERC20 contract details
    const mockAddress = await mockERC20.getAddress();
    const mockName = await mockERC20.name();
    const mockSymbol = await mockERC20.symbol();
    const mockDecimals = await mockERC20.decimals();

    console.log("🏦 RESERVE TOKEN DETAILS:");
    console.log(`   📍 Address: ${mockAddress}`);
    console.log(`   🏷️  Name: ${mockName}`);
    console.log(`   🏷️  Symbol: ${mockSymbol}`);
    console.log(`   🔢 Decimals: ${mockDecimals}`);

    // 2. Create a bonding token to show the relationship
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await nftResult.collection.getAddress(),
      mockERC20
    );
    const bondingToken = tokenResult.token;

    const reserveTokenAddress = await bondingToken.reserveToken();
    console.log(`\n🪙 BONDING TOKEN RESERVE TOKEN: ${reserveTokenAddress}`);
    console.log(`   ✅ Same as MockERC20? ${reserveTokenAddress === mockAddress}`);

    // 3. Explain what Reserve Token means
    console.log("\n📚 RESERVE TOKEN EXPLANATION:");
    console.log("   🎯 PURPOSE: The Reserve Token is the 'currency' used to buy/sell your bonding curve tokens");
    console.log("   💱 ANALOGY: Like using USD to buy stocks - the Reserve Token is your 'USD'");
    console.log("   🔄 FLOW: Users pay Reserve Tokens → Get Bonding Curve Tokens");
    console.log("   🏪 BACKING: The bonding curve holds Reserve Tokens as 'reserves' to back the token value");

    // 4. Show why we use MockERC20 in tests
    console.log("\n🧪 WHY MockERC20 IN TESTS:");
    console.log("   🎭 MockERC20 = Fake USDC/USDT for testing");
    console.log("   🚫 We can't use real USDC in local tests (no real money!)");
    console.log("   ✅ MockERC20 behaves exactly like real USDC/USDT");
    console.log("   💰 We can mint unlimited MockERC20 for testing");

    // 5. Show the Reserve Token in action
    console.log("\n⚡ RESERVE TOKEN IN ACTION:");

    // Check user's mock token balance
    const userBalance = await mockERC20.balanceOf(user1.address);
    console.log(`   💳 User1's ${mockSymbol} balance: ${ethers.formatEther(userBalance)}`);

    // Calculate cost to buy 100 bonding tokens
    const [totalCost, royalty] = await bondingToken.getReserveForTokens(ethers.parseEther("100"));
    console.log(`   💸 Cost to buy 100 bonding tokens: ${ethers.formatEther(totalCost)} ${mockSymbol}`);
    console.log(`   💸 (Base: ${ethers.formatEther(totalCost - royalty)} + Royalty: ${ethers.formatEther(royalty)})`);

    // Actually buy the tokens
    await mockERC20.connect(user1).approve(await bondingToken.getAddress(), totalCost);
    await bondingToken.connect(user1).mint(ethers.parseEther("100"), totalCost, user1.address);

    const newUserBalance = await mockERC20.balanceOf(user1.address);
    const bondingTokenBalance = await bondingToken.balanceOf(user1.address);

    console.log(`   ✅ User1's ${mockSymbol} balance after purchase: ${ethers.formatEther(newUserBalance)}`);
    console.log(`   ✅ User1's bonding tokens received: ${ethers.formatEther(bondingTokenBalance)}`);
    console.log(`   ✅ ${mockSymbol} spent: ${ethers.formatEther(userBalance - newUserBalance)}`);

    // Show reserve balance in bonding contract
    const reserveBalance = await bondingToken.reserveBalance();
    console.log(`   🏦 Bonding contract now holds: ${ethers.formatEther(reserveBalance)} ${mockSymbol} as reserves`);

    // 6. Real-world examples
    console.log("\n🌍 REAL-WORLD EXAMPLES:");
    console.log("   💵 USDC as Reserve Token: Users pay USDC to buy your project tokens");
    console.log("   💎 WETH as Reserve Token: Users pay Wrapped Ethereum to buy tokens");
    console.log("   🪙 DAI as Reserve Token: Users pay DAI stablecoin to buy tokens");
    console.log("   🎯 ANY ERC20: You can use any ERC20 token as the reserve currency!");

    console.log("\n🎉 SUMMARY:");
    console.log(`   📍 ${mockAddress} = MockERC20 contract (fake USDC for testing)`);
    console.log("   🏦 Reserve Token = The 'money' people use to buy your bonding curve tokens");
    console.log("   💱 Bonding Curve = Automatic market maker using Reserve Tokens");
    console.log("   🎯 In production: Use real USDC, USDT, WETH, or any ERC20 you want!");

    // Verify everything is working
    expect(reserveTokenAddress).to.equal(mockAddress);
    expect(bondingTokenBalance).to.equal(ethers.parseEther("100"));
    expect(reserveBalance).to.equal(totalCost - royalty);
  });

  it("Should show different Reserve Token options", async function () {
    console.log("\n=== DIFFERENT RESERVE TOKEN OPTIONS ===\n");

    console.log("🎯 POPULAR RESERVE TOKEN CHOICES:");
    console.log("   1. 💵 USDC (0xA0b86a33E6441e4c4c0B8C9D5c1a0B9c4c0B8C9D)");
    console.log("      - Most stable (pegged to USD)");
    console.log("      - Widely accepted");
    console.log("      - Easy for users to understand pricing");

    console.log("   2. 💎 WETH (0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2)");
    console.log("      - Native Ethereum ecosystem");
    console.log("      - High liquidity");
    console.log("      - Appeals to crypto natives");

    console.log("   3. 🪙 DAI (0x6B175474E89094C44Da98b954EedeAC495271d0F)");
    console.log("      - Decentralized stablecoin");
    console.log("      - Stable value");
    console.log("      - DeFi ecosystem favorite");

    console.log("   4. 🎮 Custom Project Tokens");
    console.log("      - Use your own ecosystem token");
    console.log("      - Create token-to-token bonding curves");
    console.log("      - Build interconnected token economies");

    console.log("\n🏗️ HOW TO CHOOSE:");
    console.log("   💡 For Art/NFT Projects: USDC (easy pricing)");
    console.log("   💡 For DeFi Projects: WETH or DAI");
    console.log("   💡 For Gaming: Your game's main token");
    console.log("   💡 For Meme Coins: WETH (crypto natives love it)");

    console.log("\n⚙️ IN OUR TESTS:");
    console.log(`   🧪 We use MockERC20 (${await mockERC20.getAddress()})`);
    console.log("   🎭 It pretends to be USDC with unlimited supply");
    console.log("   ✅ Perfect for testing without real money");
  });
}); 