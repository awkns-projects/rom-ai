// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {BondingCurveMath} from "../libraries/BondingCurveMath.sol";

/**
 * @title INFTFactory
 * @dev Interface for NFT Factory contract
 */
interface INFTFactory {
    function createCollection(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        address paymentToken,
        uint256 mintPrice,
        uint256 maxSupply
    ) external payable returns (address collection);

    function getCollectionCount() external view returns (uint256);
    function getCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);
    function collectionInfo(
        address collection
    )
        external
        view
        returns (
            address creator,
            address paymentToken,
            uint256 mintPrice,
            uint256 maxSupply,
            bool exists
        );
}

/**
 * @title INFTCollection
 * @dev Interface for NFT Collection contract
 */
interface INFTCollection {
    function initialize(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        address creator,
        address paymentToken,
        uint256 mintPrice,
        uint256 maxSupply
    ) external;

    function mint(address to, uint256 amount) external payable;
    function setStakingPool(address stakingPool) external;
    function setStakingPoolByFactory(
        address creator,
        address stakingPool
    ) external;
    function setBaseURI(string calldata newBaseURI) external;
    function distributeRevenue() external;

    function creator() external view returns (address);
    function paymentToken() external view returns (address);
    function mintPrice() external view returns (uint256);
    function maxSupply() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function stakingPool() external view returns (address);
    function totalRevenue() external view returns (uint256);
    function distributedRevenue() external view returns (uint256);
    function pendingRevenue() external view returns (uint256);
}

/**
 * @title IERC20Factory
 * @dev Interface for ERC20 Factory contract (MCV2 compatible)
 */
interface IERC20Factory {
    function createToken(
        string calldata name,
        string calldata symbol,
        address nftCollection,
        address reserveToken,
        BondingCurveMath.BondStep[] calldata steps,
        uint16 mintRoyalty,
        uint16 burnRoyalty
    ) external payable returns (address token);

    function getTokenCount() external view returns (uint256);
    function getTokens(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);
    function getTokenForNFTCollection(
        address nftCollection
    ) external view returns (address);
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
            uint256 maxSupply,
            uint16 mintRoyalty,
            uint16 burnRoyalty,
            bool exists
        );
}

/**
 * @title IBondingToken
 * @dev Interface for Bonding Token contract (MCV2 compatible)
 */
interface IBondingToken {
    function initialize(
        string calldata name,
        string calldata symbol,
        address creator,
        address nftCollection,
        address reserveToken,
        BondingCurveMath.BondStep[] calldata steps,
        uint16 mintRoyalty,
        uint16 burnRoyalty,
        address royaltyRecipient
    ) external;

    function mint(
        uint256 tokensToMint,
        uint256 maxReserveAmount,
        address receiver
    ) external returns (uint256 reserveAmount);
    function burn(
        uint256 tokensToBurn,
        uint256 minRefund,
        address receiver
    ) external returns (uint256 refundAmount);

    function getCurrentPrice() external view returns (uint256);
    function getReserveForTokens(
        uint256 tokensToMint
    ) external view returns (uint256 reserveAmount, uint256 royalty);
    function getRefundForTokens(
        uint256 tokensToBurn
    ) external view returns (uint256 refundAmount, uint256 royalty);

    function getBondingCurveInfo()
        external
        view
        returns (
            address nftCollection,
            address reserveToken,
            uint256 reserveBalance,
            uint256 currentSupply,
            uint256 currentPrice,
            uint256 maxSupply,
            uint16 mintRoyalty,
            uint16 burnRoyalty
        );

    function creator() external view returns (address);
    function nftCollection() external view returns (address);
    function reserveToken() external view returns (address);
    function maxSupply() external view returns (uint256);
    function reserveBalance() external view returns (uint256);
    function getStepsLength() external view returns (uint256);
    function getStep(
        uint256 index
    ) external view returns (uint128 rangeTo, uint128 price);
}

/**
 * @title IStakingFactory
 * @dev Interface for Staking Factory contract
 */
interface IStakingFactory {
    function createPool(
        address stakingToken,
        address rewardToken
    ) external payable returns (address pool);

    function getPoolCount() external view returns (uint256);
    function getPools(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);
    function getPoolForToken(
        address stakingToken
    ) external view returns (address);
    function getPoolsByCreator(
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);
    function isValidPool(address pool) external view returns (bool);

    function poolInfo(
        address pool
    )
        external
        view
        returns (
            address creator,
            address stakingToken,
            address nftCollection,
            address rewardToken,
            bool exists
        );
}

/**
 * @title IStakingPool
 * @dev Interface for Staking Pool contract
 */
interface IStakingPool {
    function initialize(
        address creator,
        address stakingToken,
        address nftCollection,
        address rewardToken
    ) external;

    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;
    function exit() external;
    function notifyRewardAmount(uint256 reward) external;

    function earned(address user) external view returns (uint256);
    function rewardPerToken() external view returns (uint256);
    function getStakerCount() external view returns (uint256);
    function getStakers(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory);

    function getPoolInfo()
        external
        view
        returns (
            address creator,
            address stakingToken,
            address nftCollection,
            address rewardToken,
            uint256 totalStaked,
            uint256 totalRewards,
            uint256 distributedRewards,
            uint256 stakerCount
        );

    function getUserInfo(
        address user
    )
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 earnedAmount,
            bool isActiveStaker
        );

    function creator() external view returns (address);
    function stakingToken() external view returns (address);
    function nftCollection() external view returns (address);
    function rewardToken() external view returns (address);
    function totalStaked() external view returns (uint256);
    function totalRewards() external view returns (uint256);
    function distributedRewards() external view returns (uint256);
    function stakedBalance(address user) external view returns (uint256);
    function pendingRewards(address user) external view returns (uint256);
}
