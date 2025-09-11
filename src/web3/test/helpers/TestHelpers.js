const { ethers } = require("hardhat");
const { expect } = require("chai");

// Common test utilities
class TestHelpers {
  static async deployContracts() {
    const [owner, creator, user1, user2, user3] = await ethers.getSigners();

    // Deploy implementation contracts
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftImplementation = await NFTCollection.deploy();
    await nftImplementation.waitForDeployment();

    const BondingToken = await ethers.getContractFactory("BondingToken");
    const bondingImplementation = await BondingToken.deploy();
    await bondingImplementation.waitForDeployment();

    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingImplementation = await StakingPool.deploy();
    await stakingImplementation.waitForDeployment();

    // Deploy factory contracts
    const NFTFactory = await ethers.getContractFactory("NFTFactory");
    const nftFactory = await NFTFactory.deploy(
      await nftImplementation.getAddress(),
      ethers.parseEther("0.01"), // 0.01 ETH creation fee
      owner.address, // protocol fee recipient
      250, // 2.5% protocol fee
      owner.address
    );
    await nftFactory.waitForDeployment();

    const ERC20Factory = await ethers.getContractFactory("ERC20Factory");
    const erc20Factory = await ERC20Factory.deploy(
      await bondingImplementation.getAddress(),
      owner.address, // owner
      ethers.parseEther("0.01"), // creation fee
      owner.address // royalty recipient
    );
    await erc20Factory.waitForDeployment();

    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await StakingFactory.deploy(
      await stakingImplementation.getAddress(),
      await erc20Factory.getAddress(),
      ethers.parseEther("0.01"), // 0.01 ETH creation fee
      owner.address, // protocol fee recipient
      150, // 1.5% protocol fee
      owner.address
    );
    await stakingFactory.waitForDeployment();

    // Deploy a default MockERC20 for testing
    const mockERC20 = await TestHelpers.deployMockERC20();

    // Mint tokens to test users
    await mockERC20.mint(creator.address, ethers.parseEther("100000"));
    await mockERC20.mint(user1.address, ethers.parseEther("100000"));
    await mockERC20.mint(user2.address, ethers.parseEther("100000"));
    await mockERC20.mint(user3.address, ethers.parseEther("100000"));

    return {
      owner,
      creator,
      user1,
      user2,
      user3,
      nftFactory,
      erc20Factory,
      stakingFactory,
      nftImplementation,
      bondingImplementation,
      stakingImplementation,
      mockERC20
    };
  }

  static async createNFTCollection(nftFactory, creator, params = {}) {
    const defaultParams = {
      name: "Test Collection",
      symbol: "TEST",
      baseURI: "https://api.test.com/metadata/",
      paymentToken: ethers.ZeroAddress, // ETH
      mintPrice: ethers.parseEther("0.1"),
      maxSupply: 10000
    };

    const finalParams = { ...defaultParams, ...params };

    const tx = await nftFactory.connect(creator).createCollection(
      finalParams.name,
      finalParams.symbol,
      finalParams.baseURI,
      finalParams.paymentToken,
      finalParams.mintPrice,
      finalParams.maxSupply,
      { value: ethers.parseEther("0.01") } // Creation fee
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return nftFactory.interface.parseLog(log).name === 'CollectionCreated';
      } catch (e) {
        return false;
      }
    });

    if (!event) {
      throw new Error("CollectionCreated event not found");
    }

    const parsedEvent = nftFactory.interface.parseLog(event);
    const collectionAddress = parsedEvent.args.collection;

    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const collection = NFTCollection.attach(collectionAddress);

    return { collection, collectionAddress, tx, receipt };
  }

  static async deployMockERC20(name = "Mock USDC", symbol = "USDC", decimals = 18) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy(name, symbol, decimals);
    await mockERC20.waitForDeployment();
    return mockERC20;
  }

  static async createBondingToken(erc20Factory, creator, nftCollectionAddress, reserveToken, params = {}) {
    // Default step-based curve: 3 steps with increasing prices
    const defaultSteps = [
      { rangeTo: ethers.parseEther("1000"), price: ethers.parseEther("0.001") }, // 0-1000 tokens at 0.001 each
      { rangeTo: ethers.parseEther("5000"), price: ethers.parseEther("0.002") }, // 1000-5000 tokens at 0.002 each
      { rangeTo: ethers.parseEther("10000"), price: ethers.parseEther("0.005") }, // 5000-10000 tokens at 0.005 each
    ];

    const defaultParams = {
      name: "Test Token",
      symbol: "TT",
      steps: defaultSteps,
      mintRoyalty: 200, // 2%
      burnRoyalty: 150  // 1.5%
    };

    const finalParams = { ...defaultParams, ...params };

    const tx = await erc20Factory.connect(creator).createToken(
      finalParams.name,
      finalParams.symbol,
      nftCollectionAddress,
      await reserveToken.getAddress(),
      finalParams.steps,
      finalParams.mintRoyalty,
      finalParams.burnRoyalty,
      { value: ethers.parseEther("0.01") } // Creation fee
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return erc20Factory.interface.parseLog(log).name === 'TokenCreated';
      } catch (e) {
        return false;
      }
    });

    if (!event) {
      throw new Error("TokenCreated event not found");
    }

    const parsedEvent = erc20Factory.interface.parseLog(event);
    const tokenAddress = parsedEvent.args.token;

    const BondingToken = await ethers.getContractFactory("BondingToken");
    const token = BondingToken.attach(tokenAddress);

    return { token, tokenAddress, tx, receipt };
  }

  static async createStakingPool(stakingFactory, creator, stakingTokenAddress, params = {}) {
    const defaultParams = {
      rewardToken: ethers.ZeroAddress // ETH
    };

    const finalParams = { ...defaultParams, ...params };

    const tx = await stakingFactory.connect(creator).createPool(
      stakingTokenAddress,
      finalParams.rewardToken,
      { value: ethers.parseEther("0.01") } // Creation fee
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return stakingFactory.interface.parseLog(log).name === 'PoolCreated';
      } catch (e) {
        return false;
      }
    });

    if (!event) {
      throw new Error("PoolCreated event not found");
    }

    const parsedEvent = stakingFactory.interface.parseLog(event);
    const poolAddress = parsedEvent.args.pool;

    const StakingPool = await ethers.getContractFactory("StakingPool");
    const pool = StakingPool.attach(poolAddress);

    return { pool, poolAddress, tx, receipt };
  }

  static async expectRevert(promise, errorMessage) {
    try {
      await promise;
      expect.fail("Expected transaction to revert");
    } catch (error) {
      if (errorMessage) {
        expect(error.message).to.include(errorMessage);
      }
    }
  }

  static async getEventFromTx(tx, contract, eventName) {
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === eventName;
      } catch (e) {
        return false;
      }
    });

    if (!event) {
      throw new Error(`${eventName} event not found`);
    }

    return contract.interface.parseLog(event);
  }

  static async advanceTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  static async advanceBlock() {
    await ethers.provider.send("evm_mine");
  }

  static async getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  static formatEther(value) {
    return ethers.formatEther(value);
  }

  static parseEther(value) {
    return ethers.parseEther(value.toString());
  }

  static async getBalance(address) {
    return await ethers.provider.getBalance(address);
  }

  static expectAlmostEqual(actual, expected, tolerance = ethers.parseEther("0.001")) {
    const diff = actual > expected ? actual - expected : expected - actual;
    expect(diff).to.be.lte(tolerance);
  }
}

module.exports = TestHelpers; 