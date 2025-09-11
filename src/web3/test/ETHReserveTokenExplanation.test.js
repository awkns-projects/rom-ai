const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔥 ETH AS RESERVE TOKEN - EXPLANATION", function () {
  let contracts, creator, user1, mockERC20;
  let nftFactory, erc20Factory;

  before(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ creator, user1, nftFactory, erc20Factory, mockERC20 } = contracts);
  });

  it("Should explain current ETH limitation and MCV2 pattern", async function () {
    console.log("\n=== CAN RESERVE TOKEN BE ETH? ===\n");

    // Try to create a bonding token with ETH as reserve token
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);

    console.log("🚫 CURRENT LIMITATION:");
    console.log("   ❌ Our current BondingToken contract REJECTS address(0) as reserve token");
    console.log("   ❌ This means you CANNOT use ETH directly as reserve token");

    // Demonstrate the rejection
    const steps = [
      { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
      { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") }
    ];

    try {
      await erc20Factory.connect(creator).createToken(
        "ETH Test Token",
        "ETHT",
        await nftResult.collection.getAddress(),
        ethers.ZeroAddress, // Try to use ETH (address(0))
        steps,
        200, // 2% mint royalty
        150, // 1.5% burn royalty
        { value: ethers.parseEther("0.01") }
      );
      console.log("   ✅ ETH reserve token worked!");
    } catch (error) {
      console.log(`   ❌ ETH reserve token failed: ${error.message.includes('BondingToken__InvalidReserveToken') ? 'Invalid Reserve Token' : 'Error occurred'}`);
    }

    console.log("\n💡 WHY THIS LIMITATION EXISTS:");
    console.log("   🏗️ Current implementation follows 'ERC20-only' pattern");
    console.log("   🛡️ Simpler security model (no ETH handling edge cases)");
    console.log("   🔧 Easier to implement and audit");
    console.log("   📊 Consistent interface for all reserve tokens");

    console.log("\n🌟 THE MCV2 SOLUTION - ZAP CONTRACTS:");
    console.log("   🔄 Users can still use ETH through 'Zap' contracts");
    console.log("   ⚡ Zap converts ETH → WETH → Buy tokens (in one transaction)");
    console.log("   ⚡ Zap converts Sell tokens → WETH → ETH (in one transaction)");
    console.log("   ✨ User experience: Feels like using ETH directly!");
  });

  it("Should show how ETH support COULD be implemented", async function () {
    console.log("\n=== HOW ETH SUPPORT COULD BE ADDED ===\n");

    console.log("🛠️ TO SUPPORT ETH AS RESERVE TOKEN:");
    console.log("   1. Remove the address(0) check in BondingToken.initialize()");
    console.log("   2. Add ETH handling in mint() function:");
    console.log("      - Check if reserveToken == address(0)");
    console.log("      - If yes, use msg.value instead of ERC20 transfer");
    console.log("      - Handle ETH refunds for burns");
    console.log("   3. Add receive() function to accept ETH");
    console.log("   4. Update all transfer logic to handle ETH vs ERC20");

    console.log("\n📝 CODE CHANGES NEEDED:");
    console.log(`
    // In BondingToken.sol:
    
    // 1. Remove this check:
    // if (reserveToken_ == address(0)) revert BondingToken__InvalidReserveToken();
    
    // 2. Add ETH handling in mint():
    function mint(uint256 tokensToMint, uint256 maxReserveAmount, address receiver) external payable {
        uint256 reserveAmount;
        
        if (reserveToken == address(0)) {
            // ETH as reserve token
            reserveAmount = msg.value;
        } else {
            // ERC20 as reserve token
            IERC20(reserveToken).safeTransferFrom(msg.sender, address(this), reserveAmount);
        }
        
        // ... rest of mint logic
    }
    
    // 3. Add ETH handling in burn():
    function burn(uint256 tokensToBurn, uint256 minRefund, address receiver) external {
        // ... burn logic
        
        if (reserveToken == address(0)) {
            // ETH refund
            (bool success, ) = receiver.call{value: refundAmount}("");
            if (!success) revert BondingToken__TransferFailed();
        } else {
            // ERC20 refund
            IERC20(reserveToken).safeTransfer(receiver, refundAmount);
        }
    }
    
    // 4. Add receive function:
    receive() external payable {}
    `);

    console.log("\n⚖️ TRADE-OFFS:");
    console.log("   ✅ PROS:");
    console.log("      - Users can use ETH directly (better UX)");
    console.log("      - No need for WETH wrapping");
    console.log("      - More familiar to average users");

    console.log("   ❌ CONS:");
    console.log("      - More complex contract code");
    console.log("      - Higher gas costs (ETH transfers more expensive)");
    console.log("      - More security considerations");
    console.log("      - ETH price volatility affects bonding curve");
  });

  it("Should demonstrate the Zap contract approach", async function () {
    console.log("\n=== ZAP CONTRACT APPROACH (RECOMMENDED) ===\n");

    // Show how current system works with WETH
    console.log("🔄 CURRENT RECOMMENDED APPROACH:");
    console.log("   1. 🏦 Use WETH as reserve token in bonding curve");
    console.log("   2. 🔧 Deploy a 'Zap' contract that:");
    console.log("      - Accepts ETH from users");
    console.log("      - Wraps ETH → WETH");
    console.log("      - Calls bonding curve with WETH");
    console.log("      - Returns tokens to user");
    console.log("   3. ✨ User experience: Send ETH, get tokens (seamless!)");

    console.log("\n📋 ZAP CONTRACT PSEUDOCODE:");
    console.log(`
    contract BondingCurveZap {
        IWETH public weth;
        IBondingToken public bondingToken;
        
        // Buy tokens with ETH
        function mintWithETH(uint256 minTokensOut, address receiver) external payable {
            // 1. Wrap ETH to WETH
            weth.deposit{value: msg.value}();
            
            // 2. Approve bonding token to spend WETH
            weth.approve(address(bondingToken), msg.value);
            
            // 3. Buy tokens using WETH
            bondingToken.mint(calculateTokenAmount(msg.value), msg.value, receiver);
        }
        
        // Sell tokens for ETH
        function burnForETH(uint256 tokenAmount, uint256 minETHOut, address receiver) external {
            // 1. Transfer tokens from user
            bondingToken.transferFrom(msg.sender, address(this), tokenAmount);
            
            // 2. Burn tokens for WETH
            uint256 wethReceived = bondingToken.burn(tokenAmount, minETHOut, address(this));
            
            // 3. Unwrap WETH to ETH
            weth.withdraw(wethReceived);
            
            // 4. Send ETH to user
            (bool success, ) = receiver.call{value: wethReceived}("");
            require(success);
        }
    }
    `);

    console.log("\n🌟 BENEFITS OF ZAP APPROACH:");
    console.log("   ✅ Keep bonding curve contract simple and secure");
    console.log("   ✅ Users can still use ETH (through Zap)");
    console.log("   ✅ Bonding curve uses stable WETH (1:1 with ETH)");
    console.log("   ✅ Separates concerns (bonding logic vs ETH handling)");
    console.log("   ✅ Can add multiple Zap contracts for different features");

    console.log("\n🎯 REAL-WORLD EXAMPLES:");
    console.log("   🦄 Uniswap: Uses WETH in pools, Zap contracts for ETH");
    console.log("   🥞 PancakeSwap: Same pattern - WETH pools + ETH Zaps");
    console.log("   🪙 MintClub V2: Uses this exact pattern!");
  });

  it("Should show both approaches working", async function () {
    console.log("\n=== COMPARISON: CURRENT vs ETH-ENABLED ===\n");

    // Current approach with MockERC20 (simulating WETH)
    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await nftResult.collection.getAddress(),
      mockERC20 // This simulates WETH
    );
    const token = tokenResult.token;

    console.log("✅ CURRENT APPROACH (ERC20 Reserve):");
    console.log(`   🏦 Reserve Token: ${await token.reserveToken()}`);
    console.log("   💰 User needs: MockERC20 tokens (like WETH)");
    console.log("   🔄 Process: ERC20 → Bonding Tokens");

    // Show the purchase
    await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("1"));
    await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);

    const balance = await token.balanceOf(user1.address);
    console.log(`   ✅ Result: User got ${ethers.formatEther(balance)} tokens`);

    console.log("\n🔮 HYPOTHETICAL ETH-ENABLED APPROACH:");
    console.log("   🔥 Reserve Token: address(0) (ETH)");
    console.log("   💰 User needs: Just ETH");
    console.log("   🔄 Process: ETH → Bonding Tokens (direct)");
    console.log("   ⚠️ Status: Not implemented in current version");

    console.log("\n🎯 RECOMMENDATION:");
    console.log("   ✅ Use WETH as reserve token");
    console.log("   ✅ Build Zap contract for ETH UX");
    console.log("   ✅ Best of both worlds!");
  });
}); 