const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelpers = require("./helpers/TestHelpers");

describe("🔍 CORRECTED CALCULATION VERIFICATION", function () {
  let contracts, owner, creator, user1, user2, mockERC20;
  let nftFactory, erc20Factory, stakingFactory;
  let collection, token;

  beforeEach(async function () {
    contracts = await TestHelpers.deployContracts();
    ({ owner, creator, user1, user2, nftFactory, erc20Factory, stakingFactory, mockERC20 } = contracts);

    const nftResult = await TestHelpers.createNFTCollection(nftFactory, creator);
    collection = nftResult.collection;

    const tokenResult = await TestHelpers.createBondingToken(
      erc20Factory,
      creator,
      await collection.getAddress(),
      mockERC20
    );
    token = tokenResult.token;
  });

  describe("✅ CORRECT Contract Behavior Understanding", function () {
    it("Should understand getReserveForTokens returns TOTAL amount needed", async function () {
      console.log("\n=== UNDERSTANDING getReserveForTokens ===");

      const [totalAmount, royalty] = await token.getReserveForTokens(ethers.parseEther("100"));
      console.log(`Total amount needed: ${ethers.formatEther(totalAmount)}`);
      console.log(`Royalty portion: ${ethers.formatEther(royalty)}`);
      console.log(`Base cost: ${ethers.formatEther(totalAmount - royalty)}`);

      // This is CORRECT behavior:
      // - Base cost: 100 tokens * 0.001 = 0.1
      // - Royalty: 0.1 * 2% = 0.002  
      // - Total: 0.1 + 0.002 = 0.102
      expect(totalAmount).to.equal(ethers.parseEther("0.102"));
      expect(royalty).to.equal(ethers.parseEther("0.002"));

      console.log("✅ getReserveForTokens behavior: CORRECT");
    });

    it("Should understand step boundaries correctly", async function () {
      console.log("\n=== UNDERSTANDING STEP BOUNDARIES ===");

      // Steps are:
      // Step 0: 0-1000 tokens at 0.001
      // Step 1: 1001-5000 tokens at 0.002
      // Step 2: 5001-10000 tokens at 0.005

      const priceAt0 = await token.getCurrentPrice();
      console.log(`Price at supply 0: ${ethers.formatEther(priceAt0)}`);
      expect(priceAt0).to.equal(ethers.parseEther("0.001"));

      // Mint to exactly 1000 tokens
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));
      await token.connect(user1).mint(ethers.parseEther("1000"), ethers.parseEther("10"), user1.address);

      const priceAt1000 = await token.getCurrentPrice();
      console.log(`Price at supply 1000: ${ethers.formatEther(priceAt1000)}`);
      expect(priceAt1000).to.equal(ethers.parseEther("0.001")); // Still step 0!

      // Mint 1 more token to go to 1001
      await token.connect(user1).mint(ethers.parseEther("1"), ethers.parseEther("1"), user1.address);

      const priceAt1001 = await token.getCurrentPrice();
      console.log(`Price at supply 1001: ${ethers.formatEther(priceAt1001)}`);
      expect(priceAt1001).to.equal(ethers.parseEther("0.002")); // Now step 1!

      console.log("✅ Step boundary behavior: CORRECT");
    });

    it("Should understand cross-step calculations", async function () {
      console.log("\n=== UNDERSTANDING CROSS-STEP CALCULATIONS ===");

      // Calculate cost for 1500 tokens from zero supply
      const [totalCost, royalty] = await token.getReserveForTokens(ethers.parseEther("1500"));
      console.log(`Cost for 1500 tokens: ${ethers.formatEther(totalCost)} (including ${ethers.formatEther(royalty)} royalty)`);

      const baseCost = totalCost - royalty;
      console.log(`Base cost: ${ethers.formatEther(baseCost)}`);

      // Manual calculation:
      // First 1000 tokens: 1000 * 0.001 = 1.0
      // Next 500 tokens: 500 * 0.002 = 1.0  
      // Total base: 2.0
      // Royalty: 2.0 * 2% = 0.04
      // Total: 2.04
      expect(baseCost).to.equal(ethers.parseEther("2.0"));
      expect(royalty).to.equal(ethers.parseEther("0.04"));
      expect(totalCost).to.equal(ethers.parseEther("2.04"));

      console.log("✅ Cross-step calculation: CORRECT");
    });

    it("Should understand reserve balance tracking", async function () {
      console.log("\n=== UNDERSTANDING RESERVE BALANCE TRACKING ===");

      const initialBalance = await token.reserveBalance();
      console.log(`Initial reserve: ${ethers.formatEther(initialBalance)}`);

      // When we mint, only the BASE COST goes to reserves, not royalty
      const [totalCost, royalty] = await token.getReserveForTokens(ethers.parseEther("300"));
      const baseCost = totalCost - royalty;

      console.log(`Total cost: ${ethers.formatEther(totalCost)}`);
      console.log(`Base cost: ${ethers.formatEther(baseCost)}`);
      console.log(`Royalty: ${ethers.formatEther(royalty)}`);

      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      await token.connect(user1).mint(ethers.parseEther("300"), ethers.parseEther("10"), user1.address);

      const balanceAfterMint = await token.reserveBalance();
      console.log(`Reserve after mint: ${ethers.formatEther(balanceAfterMint)}`);

      // Only base cost should be added to reserves (royalty goes to royalty recipient)
      const expectedBalance = initialBalance + baseCost;
      expect(balanceAfterMint).to.equal(expectedBalance);

      console.log("✅ Reserve balance tracking: CORRECT");
    });

    it("Should verify mint/burn symmetry with royalties", async function () {
      console.log("\n=== VERIFYING MINT/BURN SYMMETRY ===");

      const initialReserve = await token.reserveBalance();

      // Mint 200 tokens
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      const [mintTotal, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("200"));
      const mintBase = mintTotal - mintRoyalty;

      console.log(`Mint - Total: ${ethers.formatEther(mintTotal)}, Base: ${ethers.formatEther(mintBase)}, Royalty: ${ethers.formatEther(mintRoyalty)}`);

      await token.connect(user1).mint(ethers.parseEther("200"), ethers.parseEther("10"), user1.address);
      const reserveAfterMint = await token.reserveBalance();

      // Burn the same tokens
      const [burnRefund, burnRoyalty] = await token.getRefundForTokens(ethers.parseEther("200"));
      console.log(`Burn - Refund: ${ethers.formatEther(burnRefund)}, Royalty: ${ethers.formatEther(burnRoyalty)}`);

      await token.connect(user1).burn(ethers.parseEther("200"), ethers.parseEther("0.1"), user1.address);
      const reserveAfterBurn = await token.reserveBalance();

      console.log(`Reserve: ${ethers.formatEther(initialReserve)} → ${ethers.formatEther(reserveAfterMint)} → ${ethers.formatEther(reserveAfterBurn)}`);

      // Should return to initial state
      expect(reserveAfterBurn).to.equal(initialReserve);

      console.log("✅ Mint/Burn symmetry: CORRECT");
    });
  });

  describe("🧮 Mathematical Verification", function () {
    it("Should verify step-based calculations manually", async function () {
      console.log("\n=== MANUAL STEP CALCULATION VERIFICATION ===");

      // Test each step individually
      const steps = [
        { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") },
        { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") },
        { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }
      ];

      // Verify step configuration
      for (let i = 0; i < 3; i++) {
        const step = await token.getStep(i);
        expect(step.rangeTo).to.equal(steps[i].rangeTo);
        expect(step.price).to.equal(steps[i].price);
        console.log(`Step ${i}: ${ethers.formatEther(step.rangeTo)} tokens at ${ethers.formatEther(step.price)} each`);
      }

      // Test costs within each step
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("100"));

      // Step 0: 100 tokens at 0.001 = 0.1 + 2% = 0.102
      const [cost100, royalty100] = await token.getReserveForTokens(ethers.parseEther("100"));
      expect(cost100).to.equal(ethers.parseEther("0.102"));
      expect(royalty100).to.equal(ethers.parseEther("0.002"));

      // Cross-step: 1500 tokens = 1000*0.001 + 500*0.002 = 2.0 + 4% = 2.04
      const [cost1500, royalty1500] = await token.getReserveForTokens(ethers.parseEther("1500"));
      expect(cost1500).to.equal(ethers.parseEther("2.04"));
      expect(royalty1500).to.equal(ethers.parseEther("0.04"));

      console.log("✅ Manual calculations: VERIFIED");
    });

    it("Should verify actual vs expected gas usage", async function () {
      console.log("\n=== GAS USAGE VERIFICATION ===");

      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));

      // Mint transaction
      const mintTx = await token.connect(user1).mint(ethers.parseEther("100"), ethers.parseEther("1"), user1.address);
      const mintReceipt = await mintTx.wait();
      console.log(`Mint gas used: ${mintReceipt.gasUsed.toString()}`);

      // Burn transaction  
      const burnTx = await token.connect(user1).burn(ethers.parseEther("50"), ethers.parseEther("0.01"), user1.address);
      const burnReceipt = await burnTx.wait();
      console.log(`Burn gas used: ${burnReceipt.gasUsed.toString()}`);

      // Gas should be reasonable (< 500k for mint, < 200k for burn)
      expect(mintReceipt.gasUsed).to.be.lt(500000);
      expect(burnReceipt.gasUsed).to.be.lt(200000);

      console.log("✅ Gas usage: REASONABLE");
    });
  });

  describe("🎯 Contract State Verification", function () {
    it("Should verify all state variables are updated correctly", async function () {
      console.log("\n=== STATE VARIABLE VERIFICATION ===");

      const initialSupply = await token.totalSupply();
      const initialReserve = await token.reserveBalance();

      console.log(`Initial state - Supply: ${ethers.formatEther(initialSupply)}, Reserve: ${ethers.formatEther(initialReserve)}`);

      // Mint tokens
      await mockERC20.connect(user1).approve(await token.getAddress(), ethers.parseEther("10"));
      const [mintCost, mintRoyalty] = await token.getReserveForTokens(ethers.parseEther("500"));

      await token.connect(user1).mint(ethers.parseEther("500"), ethers.parseEther("10"), user1.address);

      // Verify all state changes
      const newSupply = await token.totalSupply();
      const newReserve = await token.reserveBalance();
      const userBalance = await token.balanceOf(user1.address);
      const currentPrice = await token.getCurrentPrice();

      console.log(`After mint - Supply: ${ethers.formatEther(newSupply)}, Reserve: ${ethers.formatEther(newReserve)}`);
      console.log(`User balance: ${ethers.formatEther(userBalance)}, Current price: ${ethers.formatEther(currentPrice)}`);

      expect(newSupply).to.equal(ethers.parseEther("500"));
      expect(userBalance).to.equal(ethers.parseEther("500"));
      expect(newReserve).to.equal(mintCost - mintRoyalty); // Only base cost goes to reserve
      expect(currentPrice).to.equal(ethers.parseEther("0.001")); // Still in step 0

      console.log("✅ State variables: ALL CORRECT");
    });
  });
}); 