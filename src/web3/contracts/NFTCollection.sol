// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFTCollection
 * @dev ERC721 collection with custom pricing and revenue tracking for staking rewards
 */
contract NFTCollection is ERC721, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Strings for uint256;

    // Error messages
    error NFTCollection__AlreadyInitialized();
    error NFTCollection__InvalidCreator();
    error NFTCollection__InvalidPaymentToken();
    error NFTCollection__InvalidPrice();
    error NFTCollection__InvalidMaxSupply();
    error NFTCollection__MaxSupplyReached();
    error NFTCollection__InsufficientPayment();
    error NFTCollection__PaymentFailed();
    error NFTCollection__InvalidAmount();
    error NFTCollection__InvalidReceiver();
    error NFTCollection__Unauthorized();
    error NFTCollection__NoStakingPool();
    error NFTCollection__ProtocolFeeTransferFailed();

    // Events
    event Minted(address indexed to, uint256 indexed tokenId, uint256 price);
    event StakingPoolSet(address indexed stakingPool);
    event RevenueDistributed(uint256 amount);
    event ProtocolFeePaid(uint256 amount);

    // State variables
    bool private _initialized;
    string private _collectionName;
    string private _collectionSymbol;
    address public creator;
    address public paymentToken; // address(0) for ETH
    uint256 public mintPrice;
    uint256 public maxSupply;
    uint256 public totalSupply;
    string private _baseTokenURI;

    // Revenue tracking for staking rewards
    address public stakingPool;
    uint256 public totalRevenue;
    uint256 public distributedRevenue;

    // Protocol fee settings
    address public protocolFeeRecipient;
    uint256 public protocolFeeBps; // Basis points (10000 = 100%)

    // Constants
    address public constant ETH_ADDRESS = address(0);

    /**
     * @dev Constructor - creates an uninitialized implementation
     */
    constructor() ERC721("", "") {
        // Implementation contract - will be cloned
    }

    /**
     * @dev Initializes the NFT collection
     * @param name_ The name of the collection
     * @param symbol_ The symbol of the collection
     * @param baseURI_ The base URI for token metadata
     * @param creator_ The creator of the collection
     * @param paymentToken_ The payment token (address(0) for ETH)
     * @param mintPrice_ The price to mint each NFT
     * @param maxSupply_ The maximum supply of the collection
     * @param protocolFeeRecipient_ The address to receive protocol fees
     * @param protocolFeeBps_ The protocol fee in basis points
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        string calldata baseURI_,
        address creator_,
        address paymentToken_,
        uint256 mintPrice_,
        uint256 maxSupply_,
        address protocolFeeRecipient_,
        uint256 protocolFeeBps_
    ) external {
        if (_initialized) revert NFTCollection__AlreadyInitialized();
        if (creator_ == address(0)) revert NFTCollection__InvalidCreator();
        if (mintPrice_ == 0) revert NFTCollection__InvalidPrice();
        if (maxSupply_ == 0) revert NFTCollection__InvalidMaxSupply();

        _initialized = true;

        // Set ERC721 metadata
        _collectionName = name_;
        _collectionSymbol = symbol_;
        _baseTokenURI = baseURI_;

        // Set collection parameters
        creator = creator_;
        paymentToken = paymentToken_;
        mintPrice = mintPrice_;
        maxSupply = maxSupply_;
        protocolFeeRecipient = protocolFeeRecipient_;
        protocolFeeBps = protocolFeeBps_;
    }

    /**
     * @dev Returns the name of the collection
     */
    function name() public view override returns (string memory) {
        return _collectionName;
    }

    /**
     * @dev Returns the symbol of the collection
     */
    function symbol() public view override returns (string memory) {
        return _collectionSymbol;
    }

    /**
     * @dev Mints NFTs to the specified address
     * @param to The address to mint to
     * @param amount The number of NFTs to mint
     */
    function mint(address to, uint256 amount) external payable nonReentrant {
        if (to == address(0)) revert NFTCollection__InvalidReceiver();
        if (amount == 0) revert NFTCollection__InvalidAmount();
        if (totalSupply + amount > maxSupply)
            revert NFTCollection__MaxSupplyReached();

        uint256 totalCost = mintPrice * amount;
        uint256 protocolFee = (totalCost * protocolFeeBps) / 10000;
        uint256 netRevenue = totalCost - protocolFee;

        // Handle payment
        if (paymentToken == ETH_ADDRESS) {
            if (msg.value < totalCost)
                revert NFTCollection__InsufficientPayment();

            // Pay protocol fee
            if (protocolFee > 0 && protocolFeeRecipient != address(0)) {
                (bool success, ) = protocolFeeRecipient.call{
                    value: protocolFee
                }("");
                if (!success) revert NFTCollection__ProtocolFeeTransferFailed();
                emit ProtocolFeePaid(protocolFee);
            }

            // Refund excess ETH
            if (msg.value > totalCost) {
                (bool success, ) = msg.sender.call{
                    value: msg.value - totalCost
                }("");
                require(success, "Refund failed");
            }
        } else {
            IERC20(paymentToken).safeTransferFrom(
                msg.sender,
                address(this),
                totalCost
            );

            // Pay protocol fee
            if (protocolFee > 0 && protocolFeeRecipient != address(0)) {
                IERC20(paymentToken).safeTransfer(
                    protocolFeeRecipient,
                    protocolFee
                );
                emit ProtocolFeePaid(protocolFee);
            }
        }

        // Track net revenue (after protocol fee)
        totalRevenue += netRevenue;

        // Mint NFTs
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = totalSupply + 1;
            totalSupply++;
            _mint(to, tokenId);
            emit Minted(to, tokenId, mintPrice);
        }

        // Distribute revenue to staking pool if set
        if (stakingPool != address(0)) {
            _distributeRevenue();
        }
    }

    /**
     * @dev Sets the staking pool address (only creator)
     * @param stakingPool_ The address of the staking pool
     */
    function setStakingPool(address stakingPool_) external {
        if (msg.sender != creator) revert NFTCollection__Unauthorized();

        stakingPool = stakingPool_;
        emit StakingPoolSet(stakingPool_);

        // Distribute any accumulated revenue
        if (stakingPool_ != address(0) && totalRevenue > distributedRevenue) {
            _distributeRevenue();
        }
    }

    /**
     * @dev Sets the staking pool address on behalf of creator (factory only)
     * @param creator_ The creator address to verify authorization
     * @param stakingPool_ The address of the staking pool
     */
    function setStakingPoolByFactory(
        address creator_,
        address stakingPool_
    ) external {
        if (creator_ != creator) revert NFTCollection__Unauthorized();

        stakingPool = stakingPool_;
        emit StakingPoolSet(stakingPool_);

        // Distribute any accumulated revenue
        if (stakingPool_ != address(0) && totalRevenue > distributedRevenue) {
            _distributeRevenue();
        }
    }

    /**
     * @dev Distributes accumulated revenue to the staking pool
     */
    function distributeRevenue() external {
        if (stakingPool == address(0)) revert NFTCollection__NoStakingPool();
        _distributeRevenue();
    }

    /**
     * @dev Internal function to distribute revenue to staking pool
     */
    function _distributeRevenue() internal {
        if (stakingPool == address(0)) return;

        uint256 pendingRevenueAmount = totalRevenue - distributedRevenue;
        if (pendingRevenueAmount == 0) return;

        distributedRevenue = totalRevenue;

        // Transfer revenue to staking pool
        if (paymentToken == ETH_ADDRESS) {
            (bool success, ) = stakingPool.call{value: pendingRevenueAmount}(
                ""
            );
            require(success, "Revenue transfer failed");
        } else {
            IERC20(paymentToken).safeTransfer(
                stakingPool,
                pendingRevenueAmount
            );
        }

        // Notify staking pool of new rewards
        IStakingPool(stakingPool).notifyRewardAmount(pendingRevenueAmount);

        emit RevenueDistributed(pendingRevenueAmount);
    }

    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId The token ID
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "ERC721: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString()))
                : "";
    }

    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Updates the base URI (only creator)
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string calldata newBaseURI) external {
        if (msg.sender != creator) revert NFTCollection__Unauthorized();
        _baseTokenURI = newBaseURI;
    }

    /**
     * @dev Returns pending revenue to be distributed
     */
    function pendingRevenue() external view returns (uint256) {
        return totalRevenue - distributedRevenue;
    }

    /**
     * @dev Emergency withdrawal of revenue (only creator, only if no staking pool)
     */
    function emergencyWithdraw() external {
        if (msg.sender != creator) revert NFTCollection__Unauthorized();
        if (stakingPool != address(0)) revert NFTCollection__Unauthorized();

        uint256 withdrawAmount = totalRevenue - distributedRevenue;
        if (withdrawAmount == 0) return;

        if (paymentToken == ETH_ADDRESS) {
            (bool success, ) = creator.call{value: withdrawAmount}("");
            require(success, "Withdrawal failed");
        } else {
            IERC20(paymentToken).safeTransfer(creator, withdrawAmount);
        }

        // Mark revenue as distributed
        distributedRevenue = totalRevenue;
    }

    /**
     * @dev Gets collection statistics for UI display
     */
    function getCollectionStats()
        external
        view
        returns (
            uint256 totalMinted,
            uint256 maxSupply_,
            uint256 mintPrice_,
            uint256 totalRevenue_,
            uint256 distributedRevenue_,
            uint256 pendingRevenueAmount,
            address stakingPool_,
            address creator_,
            address paymentToken_,
            bool hasStakingPool
        )
    {
        return (
            totalSupply,
            maxSupply,
            mintPrice,
            totalRevenue,
            distributedRevenue,
            totalRevenue - distributedRevenue,
            stakingPool,
            creator,
            paymentToken,
            stakingPool != address(0)
        );
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}

/**
 * @title IStakingPool
 * @dev Interface for staking pool contract
 */
interface IStakingPool {
    function notifyRewardAmount(uint256 reward) external;
}
