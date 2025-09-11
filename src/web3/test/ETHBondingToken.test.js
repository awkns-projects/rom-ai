const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔥 ETH BONDING TOKEN - COMPLETE SCENARIO", function () {
  let owner, creator, user1, user2, user3;
  let nftFactory, stakingFactory;
  let collection, ethBondingToken, stakingPool;
  let BondingTokenETH;

  before(async function () {
    [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy factories (we'll deploy ETH bonding token manually)
    const contracts = await TestHelpers.deployContracts();
    ({ nftFactory, stakingFactory } = contracts);

    // Deploy BondingTokenETH contract factory
    BondingTokenETH = await ethers.getContractFactory("BondingTokenETH");
  });

  describe("🎯 ETH as Reserve Token - Complete Workflow", function () {
    it("Should execute complete ETH bonding token workflow", async function () {
      console.log("\n=== COMPLETE ETH BONDING TOKEN SCENARIO ===\n");

      // ===== STEP 1: Create NFT Collection =====
      console.log("🎨 STEP 1: Create NFT Collection");

      const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator, {
        name: "ETH Art Collection",
        symbol: "ETHC",
        mintPrice: ethers.parseEther("0.1")
      });
      collection = nftResult.collection;

      console.log(`   ✅ NFT Collection: ${await collection.getAddress()}`);
      console.log(`   ✅ Mint Price: ${ethers.formatEther(await collection.mintPrice())} ETH`);

      // ===== STEP 2: Deploy ETH Bonding Token =====
      console.log("\n🔥 STEP 2: Deploy ETH Bonding Token (address(0) reserve)");

      ethBondingToken = await BondingTokenETH.deploy();
      await ethBondingToken.waitForDeployment();

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
        await collection.getAddress(),
        ethers.ZeroAddress, // ETH as reserve token!
        steps,
        200, // 2% mint royalty
        150, // 1.5% burn royalty
        creator.address
      );

      const reserveToken = await ethBondingToken.reserveToken();
      console.log(`   ✅ ETH Bonding Token: ${await ethBondingToken.getAddress()}`);
      console.log(`   ✅ Reserve Token: ${reserveToken} (${reserveToken === ethers.ZeroAddress ? 'ETH' : 'ERC20'})`);
      console.log(`   ✅ Max Supply: ${ethers.formatEther(await ethBondingToken.maxSupply())}`);

      // ===== STEP 3: Test ETH-based Token Minting =====
      console.log("\n💰 STEP 3: Users mint tokens with ETH");

      // Check cost for 100 tokens
      const [cost100, royalty100] = await ethBondingToken.getReserveForTokens(ethers.parseEther("100"));
      console.log(`   💸 Cost for 100 tokens: ${ethers.formatEther(cost100)} ETH (${ethers.formatEther(royalty100)} royalty)`);

      // User1 mints 100 tokens with ETH
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

      const mintTx = await ethBondingToken.connect(user1).mint(
        ethers.parseEther("100"),
        ethers.parseEther("1"), // max willing to pay
        user1.address,
        { value: cost100 } // Send exact ETH amount
      );
      const mintReceipt = await mintTx.wait();

      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
      const user1TokenBalance = await ethBondingToken.balanceOf(user1.address);
      const contractETHBalance = await ethers.provider.getBalance(await ethBondingToken.getAddress());
      const reserveBalance = await ethBondingToken.reserveBalance();

      console.log(`   ✅ User1 minted: ${ethers.formatEther(user1TokenBalance)} tokens`);
      console.log(`   ✅ ETH spent: ${ethers.formatEther(user1BalanceBefore - user1BalanceAfter - mintReceipt.gasUsed * mintReceipt.gasPrice)} ETH`);
      console.log(`   ✅ Contract ETH balance: ${ethers.formatEther(contractETHBalance)} ETH`);
      console.log(`   ✅ Reserve balance: ${ethers.formatEther(reserveBalance)} ETH`);

      expect(user1TokenBalance).to.equal(ethers.parseEther("100"));
      expect(contractETHBalance).to.equal(cost100 - royalty100); // Only base cost stays in contract
      expect(reserveBalance).to.equal(cost100 - royalty100);

      // ===== STEP 4: Test Cross-Step Minting =====
      console.log("\n📈 STEP 4: Cross-step minting (1200 tokens)");

      const [cost1200, royalty1200] = await ethBondingToken.getReserveForTokens(ethers.parseEther("1200"));
      console.log(`   💸 Cost for 1200 tokens: ${ethers.formatEther(cost1200)} ETH (${ethers.formatEther(royalty1200)} royalty)`);

      // User2 mints 1200 tokens (crosses from step 0 to step 1)
      await ethBondingToken.connect(user2).mint(
        ethers.parseEther("1200"),
        ethers.parseEther("5"),
        user2.address,
        { value: cost1200 }
      );

      const user2TokenBalance = await ethBondingToken.balanceOf(user2.address);
      const totalSupply = await ethBondingToken.totalSupply();
      const currentPrice = await ethBondingToken.getCurrentPrice();

      console.log(`   ✅ User2 minted: ${ethers.formatEther(user2TokenBalance)} tokens`);
      console.log(`   ✅ Total supply: ${ethers.formatEther(totalSupply)} tokens`);
      console.log(`   ✅ Current price: ${ethers.formatEther(currentPrice)} ETH per token`);

      expect(user2TokenBalance).to.equal(ethers.parseEther("1200"));
      expect(totalSupply).to.equal(ethers.parseEther("1300")); // 100 + 1200
      expect(currentPrice).to.equal(ethers.parseEther("0.002")); // Should be in step 1

      // ===== STEP 5: Test ETH-based Token Burning =====
      console.log("\n🔥 STEP 5: Users burn tokens for ETH");

      const user1BalanceBeforeBurn = await ethers.provider.getBalance(user1.address);

      // User1 burns 50 tokens
      const [refund50, burnRoyalty50] = await ethBondingToken.getRefundForTokens(ethers.parseEther("50"));
      console.log(`   💰 Refund for 50 tokens: ${ethers.formatEther(refund50)} ETH (${ethers.formatEther(burnRoyalty50)} royalty)`);

      const burnTx = await ethBondingToken.connect(user1).burn(
        ethers.parseEther("50"),
        ethers.parseEther("0.01"), // min refund
        user1.address
      );
      const burnReceipt = await burnTx.wait();

      const user1BalanceAfterBurn = await ethers.provider.getBalance(user1.address);
      const user1TokenBalanceAfterBurn = await ethBondingToken.balanceOf(user1.address);

      console.log(`   ✅ User1 remaining tokens: ${ethers.formatEther(user1TokenBalanceAfterBurn)}`);
      console.log(`   ✅ ETH received: ${ethers.formatEther(user1BalanceAfterBurn - user1BalanceBeforeBurn + burnReceipt.gasUsed * burnReceipt.gasPrice)} ETH`);

      expect(user1TokenBalanceAfterBurn).to.equal(ethers.parseEther("50"));

      // ===== STEP 6: Test Staking Integration =====
      console.log("\n🥩 STEP 6: Create staking pool for ETH bonding token");

      const stakingTx = await stakingFactory.connect(creator).createPool(
        await ethBondingToken.getAddress(),
        ethers.ZeroAddress, // ETH rewards
        { value: ethers.parseEther("0.01") }
      );

      const stakingReceipt = await stakingTx.wait();
      const stakingEvent = stakingReceipt.logs.find(log => {
        try {
          return stakingFactory.interface.parseLog(log).name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });

      const stakingPoolAddress = stakingFactory.interface.parseLog(stakingEvent).args.pool;
      const StakingPool = await ethers.getContractFactory("StakingPool");
      stakingPool = StakingPool.attach(stakingPoolAddress);

      // Link staking pool to NFT collection
      await collection.connect(creator).setStakingPool(stakingPoolAddress);

      console.log(`   ✅ Staking pool: ${stakingPoolAddress}`);
      console.log(`   ✅ Linked to NFT collection`);

      // ===== STEP 7: Test Staking ETH-based Tokens =====
      console.log("\n🎯 STEP 7: Users stake ETH-based tokens");

      // User1 stakes remaining 50 tokens
      await ethBondingToken.connect(user1).approve(stakingPoolAddress, ethers.parseEther("50"));
      await stakingPool.connect(user1).stake(ethers.parseEther("50"));

      // User2 stakes 500 tokens
      await ethBondingToken.connect(user2).approve(stakingPoolAddress, ethers.parseEther("500"));
      await stakingPool.connect(user2).stake(ethers.parseEther("500"));

      const user1Staked = await stakingPool.stakedBalance(user1.address);
      const user2Staked = await stakingPool.stakedBalance(user2.address);
      const totalStaked = await stakingPool.totalStaked();

      console.log(`   ✅ User1 staked: ${ethers.formatEther(user1Staked)} tokens`);
      console.log(`   ✅ User2 staked: ${ethers.formatEther(user2Staked)} tokens`);
      console.log(`   ✅ Total staked: ${ethers.formatEther(totalStaked)} tokens`);

      // ===== STEP 8: Generate Revenue and Test Rewards =====
      console.log("\n💎 STEP 8: Generate NFT revenue and distribute to stakers");

      // User3 mints NFTs to generate revenue
      await collection.connect(user3).mint(user3.address, 3, { value: ethers.parseEther("0.3") });

      const user1Earned = await stakingPool.earned(user1.address);
      const user2Earned = await stakingPool.earned(user2.address);

      console.log(`   ✅ User1 earned: ${ethers.formatEther(user1Earned)} ETH`);
      console.log(`   ✅ User2 earned: ${ethers.formatEther(user2Earned)} ETH`);

      expect(user1Earned).to.be.gt(0);
      expect(user2Earned).to.be.gt(0);

      // ===== STEP 9: Verify Complete System State =====
      console.log("\n🎉 STEP 9: Final system verification");

      const finalTokenSupply = await ethBondingToken.totalSupply();
      const finalETHBalance = await ethers.provider.getBalance(await ethBondingToken.getAddress());
      const finalReserveBalance = await ethBondingToken.reserveBalance();
      const holderCount = await ethBondingToken.getHolderCount();
      const priceHistoryLength = await ethBondingToken.getPriceHistoryLength();

      console.log(`   📊 Final token supply: ${ethers.formatEther(finalTokenSupply)}`);
      console.log(`   📊 Contract ETH balance: ${ethers.formatEther(finalETHBalance)} ETH`);
      console.log(`   📊 Reserve balance: ${ethers.formatEther(finalReserveBalance)} ETH`);
      console.log(`   📊 Token holders: ${holderCount}`);
      console.log(`   📊 Price history entries: ${priceHistoryLength}`);

      // Final assertions
      expect(finalTokenSupply).to.equal(ethers.parseEther("1250")); // 1300 - 50 burned
      expect(holderCount).to.equal(2); // user1 and user2
      expect(priceHistoryLength).to.be.gt(0);

      console.log("\n🎉 COMPLETE ETH BONDING TOKEN WORKFLOW: SUCCESS! 🎉");
    });

    it("Should handle ETH edge cases correctly", async function () {
      console.log("\n=== ETH EDGE CASES TESTING ===");

      // Deploy fresh ETH bonding token
      const ethToken = await BondingTokenETH.deploy();
      await ethToken.waitForDeployment();

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }
      ];

      await ethToken.initialize(
        "Test ETH Token",
        "TEST",
        creator.address,
        await collection.getAddress(),
        ethers.ZeroAddress, // ETH
        steps,
        200, 150,
        creator.address
      );

      // Test: Send wrong amount of ETH
      const [correctCost] = await ethToken.getReserveForTokens(ethers.parseEther("100"));

      await expect(
        ethToken.connect(user1).mint(
          ethers.parseEther("100"),
          ethers.parseEther("1"),
          user1.address,
          { value: correctCost - 1n } // Send 1 wei less
        )
      ).to.be.revertedWithCustomError(ethToken, "BondingTokenETH__InsufficientETH");

      console.log("✅ Insufficient ETH protection: WORKS");

      // Test: Send ETH to ERC20 token (should fail)
      const erc20Token = await BondingTokenETH.deploy();
      await erc20Token.waitForDeployment();

      // Initialize with MockERC20 as reserve (not ETH)
      const { mockERC20 } = await TestHelpers.deployContracts();
      await erc20Token.initialize(
        "Test ERC20 Token",
        "TEST20",
        creator.address,
        await collection.getAddress(),
        await mockERC20.getAddress(), // ERC20, not ETH
        steps,
        200, 150,
        creator.address
      );

      await expect(
        erc20Token.connect(user1).mint(
          ethers.parseEther("100"),
          ethers.parseEther("1"),
          user1.address,
          { value: ethers.parseEther("0.1") } // Send ETH to ERC20 token
        )
      ).to.be.revertedWithCustomError(erc20Token, "BondingTokenETH__UnexpectedETH");

      console.log("✅ Unexpected ETH protection: WORKS");

      // Test: Try to send ETH directly to ETH token contract
      await ethToken.connect(user1).mint(
        ethers.parseEther("100"),
        correctCost,
        user1.address,
        { value: correctCost }
      );

      // Now try to send ETH directly (should work since it's ETH token)
      await expect(
        user1.sendTransaction({
          to: await ethToken.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.not.be.reverted;

      console.log("✅ Direct ETH sending to ETH token: WORKS");

      // Test: Try to send ETH directly to ERC20 token contract (should fail)
      await expect(
        user1.sendTransaction({
          to: await erc20Token.getAddress(),
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(erc20Token, "BondingTokenETH__UnexpectedETH");

      console.log("✅ Direct ETH sending to ERC20 token: REJECTED");

      console.log("\n✅ ALL ETH EDGE CASES: HANDLED CORRECTLY");
    });

    it("Should verify ETH vs ERC20 reserve token comparison", async function () {
      console.log("\n=== ETH vs ERC20 COMPARISON ===");

      // Deploy both types
      const ethToken = await BondingTokenETH.deploy();
      const erc20Token = await BondingTokenETH.deploy();

      const { mockERC20 } = await TestHelpers.deployContracts();

      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }
      ];

      // Initialize ETH token
      await ethToken.initialize(
        "ETH Token", "ETHT", creator.address, await collection.getAddress(),
        ethers.ZeroAddress, steps, 200, 150, creator.address
      );

      // Initialize ERC20 token
      await erc20Token.initialize(
        "ERC20 Token", "ERC20T", creator.address, await collection.getAddress(),
        await mockERC20.getAddress(), steps, 200, 150, creator.address
      );

      console.log("🔥 ETH Token:");
      console.log(`   Reserve Token: ${await ethToken.reserveToken()}`);
      console.log(`   Is ETH: ${await ethToken.reserveToken() === ethers.ZeroAddress}`);

      console.log("🪙 ERC20 Token:");
      console.log(`   Reserve Token: ${await erc20Token.reserveToken()}`);
      console.log(`   Is ERC20: ${await erc20Token.reserveToken() !== ethers.ZeroAddress}`);

      // Test minting with both
      const [ethCost] = await ethToken.getReserveForTokens(ethers.parseEther("100"));
      const [erc20Cost] = await erc20Token.getReserveForTokens(ethers.parseEther("100"));

      console.log(`\nMinting 100 tokens:`);
      console.log(`   ETH Token cost: ${ethers.formatEther(ethCost)} ETH`);
      console.log(`   ERC20 Token cost: ${ethers.formatEther(erc20Cost)} MockERC20`);

      // Mint ETH tokens with ETH
      await ethToken.connect(user1).mint(
        ethers.parseEther("100"),
        ethCost,
        user1.address,
        { value: ethCost }
      );

      // Mint ERC20 tokens with MockERC20
      await mockERC20.mint(user2.address, ethers.parseEther("1000"));
      await mockERC20.connect(user2).approve(await erc20Token.getAddress(), erc20Cost);
      await erc20Token.connect(user2).mint(
        ethers.parseEther("100"),
        erc20Cost,
        user2.address
      );

      const ethTokenBalance1 = await ethToken.balanceOf(user1.address);
      const erc20TokenBalance2 = await erc20Token.balanceOf(user2.address);

      console.log(`\nResults:`);
      console.log(`   User1 ETH tokens: ${ethers.formatEther(ethTokenBalance1)}`);
      console.log(`   User2 ERC20 tokens: ${ethers.formatEther(erc20TokenBalance2)}`);

      expect(ethTokenBalance1).to.equal(ethers.parseEther("100"));
      expect(erc20TokenBalance2).to.equal(ethers.parseEther("100"));

      console.log("\n✅ BOTH ETH AND ERC20 RESERVE TOKENS: WORKING PERFECTLY");
    });
  });
}); 