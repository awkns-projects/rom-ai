// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakingFactory
 * @dev Factory contract for creating staking pools for ERC20 bonding tokens
 */
contract StakingFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Error messages
    error StakingFactory__InvalidImplementation();
    error StakingFactory__InvalidCreator();
    error StakingFactory__InvalidToken();
    error StakingFactory__InvalidERC20Factory();
    error StakingFactory__PoolAlreadyExists();
    error StakingFactory__PoolNotFound();
    error StakingFactory__CreationFeeTransferFailed();
    error StakingFactory__InvalidCreationFee();
    error StakingFactory__Unauthorized();
    error StakingFactory__InvalidRewardToken();

    // Events
    event PoolCreated(
        address indexed pool,
        address indexed creator,
        address indexed stakingToken,
        address nftCollection,
        address rewardToken
    );
    event CreationFeeUpdated(uint256 newFee);

    // Constants
    address public constant ETH_ADDRESS = address(0);

    // State variables
    address public immutable STAKING_POOL_IMPLEMENTATION;
    address public immutable ERC20_FACTORY;
    uint256 public creationFee;
    address[] public pools;

    // Protocol fee settings
    address public protocolFeeRecipient;
    uint256 public protocolFeeBps; // Basis points (10000 = 100%)

    // Mappings
    mapping(address => PoolInfo) public poolInfo;
    mapping(address => address) public tokenToPool; // Bonding token => staking pool
    mapping(address => bool) public poolExists;

    struct PoolInfo {
        address creator;
        address stakingToken;
        address nftCollection;
        address rewardToken;
        bool exists;
    }

    /**
     * @dev Constructor
     * @param stakingPoolImplementation The implementation contract for staking pools
     * @param erc20Factory The ERC20Factory contract address
     * @param initialCreationFee Initial fee for creating pools
     * @param protocolFeeRecipient_ The address to receive protocol fees
     * @param protocolFeeBps_ The protocol fee in basis points
     * @param owner The owner of the factory
     */
    constructor(
        address stakingPoolImplementation,
        address erc20Factory,
        uint256 initialCreationFee,
        address protocolFeeRecipient_,
        uint256 protocolFeeBps_,
        address owner
    ) Ownable(owner) {
        if (stakingPoolImplementation == address(0))
            revert StakingFactory__InvalidImplementation();
        if (erc20Factory == address(0))
            revert StakingFactory__InvalidERC20Factory();

        STAKING_POOL_IMPLEMENTATION = stakingPoolImplementation;
        ERC20_FACTORY = erc20Factory;
        creationFee = initialCreationFee;
        protocolFeeRecipient = protocolFeeRecipient_;
        protocolFeeBps = protocolFeeBps_;
    }

    /**
     * @dev Creates a new staking pool for a bonding token
     * @param stakingToken The bonding token to stake
     * @param rewardToken The token used for rewards (address(0) for ETH)
     * @return pool The address of the created staking pool
     */
    function createPool(
        address stakingToken,
        address rewardToken
    ) external payable nonReentrant returns (address pool) {
        if (msg.sender == address(0)) revert StakingFactory__InvalidCreator();
        if (stakingToken == address(0)) revert StakingFactory__InvalidToken();
        if (tokenToPool[stakingToken] != address(0))
            revert StakingFactory__PoolAlreadyExists();

        // Verify the staking token was created by our ERC20Factory
        if (!IERC20Factory(ERC20_FACTORY).isValidToken(stakingToken)) {
            revert StakingFactory__InvalidToken();
        }

        // Get token info from ERC20Factory
        (
            address creator,
            address nftCollection,
            address reserveToken,
            ,
            ,
            ,

        ) = IERC20Factory(ERC20_FACTORY).tokenInfo(stakingToken);

        // Verify caller is the creator of the bonding token
        if (creator != msg.sender) revert StakingFactory__Unauthorized();

        // Handle creation fee
        if (creationFee > 0) {
            if (msg.value < creationFee)
                revert StakingFactory__InvalidCreationFee();

            (bool success, ) = owner().call{value: creationFee}("");
            if (!success) revert StakingFactory__CreationFeeTransferFailed();
        }

        // Refund excess ETH
        if (msg.value > creationFee) {
            (bool success, ) = msg.sender.call{value: msg.value - creationFee}(
                ""
            );
            require(success, "Refund failed");
        }

        // Clone the implementation
        pool = Clones.clone(STAKING_POOL_IMPLEMENTATION);

        // Initialize the pool
        IStakingPool(pool).initialize(
            msg.sender,
            stakingToken,
            nftCollection,
            rewardToken,
            protocolFeeRecipient,
            protocolFeeBps
        );

        // Store pool info
        poolInfo[pool] = PoolInfo({
            creator: msg.sender,
            stakingToken: stakingToken,
            nftCollection: nftCollection,
            rewardToken: rewardToken,
            exists: true
        });

        tokenToPool[stakingToken] = pool;
        poolExists[pool] = true;
        pools.push(pool);

        // Note: The creator should manually set the staking pool in the NFT collection
        // INFTCollection(nftCollection).setStakingPool(pool);

        emit PoolCreated(
            pool,
            msg.sender,
            stakingToken,
            nftCollection,
            rewardToken
        );
    }

    /**
     * @dev Updates the creation fee (only owner)
     * @param newFee The new creation fee
     */
    function updateCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    /**
     * @dev Updates the protocol fee recipient (only owner)
     * @param newRecipient The new protocol fee recipient
     */
    function updateProtocolFeeRecipient(
        address newRecipient
    ) external onlyOwner {
        protocolFeeRecipient = newRecipient;
    }

    /**
     * @dev Updates the protocol fee basis points (only owner)
     * @param newFeeBps The new protocol fee in basis points
     */
    function updateProtocolFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        protocolFeeBps = newFeeBps;
    }

    /**
     * @dev Returns the total number of pools created
     */
    function getPoolCount() external view returns (uint256) {
        return pools.length;
    }

    /**
     * @dev Returns pools with pagination
     * @param offset Starting index
     * @param limit Number of pools to return
     */
    function getPools(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        uint256 total = pools.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = pools[i];
        }
    }

    /**
     * @dev Gets the staking pool address for a bonding token
     * @param stakingToken The bonding token address
     * @return The staking pool address (address(0) if not found)
     */
    function getPoolForToken(
        address stakingToken
    ) external view returns (address) {
        return tokenToPool[stakingToken];
    }

    /**
     * @dev Checks if a pool was created by this factory
     * @param pool The pool address to check
     * @return True if the pool exists in this factory
     */
    function isValidPool(address pool) external view returns (bool) {
        return poolExists[pool];
    }

    /**
     * @dev Gets pools by creator with pagination
     * @param creator The creator address
     * @param offset Starting index
     * @param limit Number of pools to return
     */
    function getPoolsByCreator(
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        // First count pools by creator
        uint256 count = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (poolInfo[pools[i]].creator == creator) {
                count++;
            }
        }

        if (offset >= count) return new address[](0);

        uint256 end = offset + limit;
        if (end > count) end = count;

        result = new address[](end - offset);
        uint256 resultIndex = 0;
        uint256 creatorPoolIndex = 0;

        for (
            uint256 i = 0;
            i < pools.length && resultIndex < result.length;
            i++
        ) {
            if (poolInfo[pools[i]].creator == creator) {
                if (creatorPoolIndex >= offset) {
                    result[resultIndex] = pools[i];
                    resultIndex++;
                }
                creatorPoolIndex++;
            }
        }
    }
}

/**
 * @title IStakingPool
 * @dev Interface for staking pool contract
 */
interface IStakingPool {
    function initialize(
        address creator,
        address stakingToken,
        address nftCollection,
        address rewardToken,
        address protocolFeeRecipient,
        uint256 protocolFeeBps
    ) external;
}

/**
 * @title IERC20Factory
 * @dev Interface for ERC20Factory contract
 */
interface IERC20Factory {
    function isValidToken(address token) external view returns (bool);
    function tokenInfo(
        address token
    )
        external
        view
        returns (
            address creator,
            address nftCollection,
            address reserveToken,
            uint256 basePrice,
            uint256 slope,
            uint256 maxSupply,
            bool exists
        );
}

/**
 * @title INFTCollection
 * @dev Interface for NFT collection contract
 */
interface INFTCollection {
    function setStakingPool(address stakingPool) external;
}
