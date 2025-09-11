// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BondingCurveMath} from "./libraries/BondingCurveMath.sol";

/**
 * @title BondingToken
 * @dev ERC20 token with step-based bonding curve pricing (MCV2 compatible)
 * Following MCV2 pattern: Only supports ERC20 reserve tokens (use Zap for ETH)
 */
contract BondingToken is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using BondingCurveMath for BondingCurveMath.BondStep[];

    // Error messages
    error BondingToken__AlreadyInitialized();
    error BondingToken__InvalidCreator();
    error BondingToken__InvalidNFTCollection();
    error BondingToken__InvalidReserveToken();
    error BondingToken__InvalidParameters();
    error BondingToken__InsufficientTokens();
    error BondingToken__MaxSupplyReached();
    error BondingToken__InvalidAmount();
    error BondingToken__SlippageExceeded();
    error BondingToken__Unauthorized();
    error BondingToken__RoyaltyTransferFailed();
    error BondingToken__InvalidReceiver();

    // Events
    event Mint(
        address indexed user,
        address indexed receiver,
        uint256 tokenAmount,
        uint256 reserveAmount
    );
    event Burn(
        address indexed user,
        address indexed receiver,
        uint256 tokenAmount,
        uint256 refundAmount
    );
    event RoyaltyPaid(address indexed recipient, uint256 amount);

    // Constants
    uint256 private constant ROYALTY_BASE = 10000; // 100.00%

    // State variables
    bool private _initialized;
    string private _tokenName;
    string private _tokenSymbol;
    address public creator;
    address public nftCollection;
    address public reserveToken; // ERC20 only (following MCV2 pattern)

    // Bonding curve state
    BondingCurveMath.BondStep[] public steps;
    uint256 public reserveBalance; // Current reserve balance
    uint16 public mintRoyalty; // Basis points (10000 = 100%)
    uint16 public burnRoyalty; // Basis points (10000 = 100%)
    address public royaltyRecipient;

    // UI Support: Token holder tracking
    address[] public holders;
    mapping(address => bool) public isHolder;
    mapping(address => uint256) public holderIndex;

    // UI Support: Price history tracking
    struct PricePoint {
        uint256 timestamp;
        uint256 price;
        uint256 supply;
    }
    PricePoint[] public priceHistory;
    uint256 public constant MAX_PRICE_HISTORY = 1000; // Limit history size

    /**
     * @dev Constructor - creates an uninitialized implementation
     */
    constructor() ERC20("", "") {
        // Implementation contract - will be cloned
    }

    /**
     * @dev Initializes the bonding token with step-based curve
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param creator_ The creator of the token
     * @param nftCollection_ The NFT collection this token is tied to
     * @param reserveToken_ The ERC20 reserve token for the bonding curve
     * @param steps_ Array of bonding curve steps
     * @param mintRoyalty_ Royalty rate for minting (basis points)
     * @param burnRoyalty_ Royalty rate for burning (basis points)
     * @param royaltyRecipient_ Address to receive royalties
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address creator_,
        address nftCollection_,
        address reserveToken_,
        BondingCurveMath.BondStep[] calldata steps_,
        uint16 mintRoyalty_,
        uint16 burnRoyalty_,
        address royaltyRecipient_
    ) external {
        if (_initialized) revert BondingToken__AlreadyInitialized();
        if (creator_ == address(0)) revert BondingToken__InvalidCreator();
        if (nftCollection_ == address(0))
            revert BondingToken__InvalidNFTCollection();
        if (reserveToken_ == address(0))
            revert BondingToken__InvalidReserveToken();

        // Validate steps
        BondingCurveMath.validateSteps(steps_);

        _initialized = true;

        // Set ERC20 metadata
        _tokenName = name_;
        _tokenSymbol = symbol_;

        // Set bonding curve parameters
        creator = creator_;
        nftCollection = nftCollection_;
        reserveToken = reserveToken_;

        // Copy steps
        for (uint256 i = 0; i < steps_.length; i++) {
            steps.push(steps_[i]);
        }

        // Set royalty parameters
        mintRoyalty = mintRoyalty_;
        burnRoyalty = burnRoyalty_;
        royaltyRecipient = royaltyRecipient_;
    }

    /**
     * @dev Returns the name of the token
     */
    function name() public view override returns (string memory) {
        return _tokenName;
    }

    /**
     * @dev Returns the symbol of the token
     */
    function symbol() public view override returns (string memory) {
        return _tokenSymbol;
    }

    /**
     * @dev Mint tokens by depositing reserve tokens (MCV2 compatible)
     * @param tokensToMint Amount of tokens to mint
     * @param maxReserveAmount Maximum reserve amount to spend (slippage protection)
     * @param receiver Address to receive the minted tokens
     * @return reserveAmount Amount of reserve tokens spent
     */
    function mint(
        uint256 tokensToMint,
        uint256 maxReserveAmount,
        address receiver
    ) external nonReentrant returns (uint256 reserveAmount) {
        if (receiver == address(0)) revert BondingToken__InvalidReceiver();
        if (tokensToMint == 0) revert BondingToken__InvalidAmount();

        // Calculate required reserve amount (following MCV2 pattern)
        uint256 reserveToBond = BondingCurveMath.calculateBuyCost(
            totalSupply(),
            tokensToMint,
            steps,
            decimals()
        );

        uint256 royalty = (reserveToBond * mintRoyalty) / ROYALTY_BASE;
        reserveAmount = reserveToBond + royalty;

        if (reserveAmount > maxReserveAmount)
            revert BondingToken__SlippageExceeded();
        if (totalSupply() + tokensToMint > maxSupply())
            revert BondingToken__MaxSupplyReached();

        // MCV2 pattern: Update reserve & fee balances
        reserveBalance += reserveAmount - royalty;

        // Pay royalty to creator (MCV2 pattern)
        if (royalty > 0 && royaltyRecipient != address(0)) {
            IERC20(reserveToken).safeTransferFrom(
                msg.sender,
                royaltyRecipient,
                royalty
            );
            emit RoyaltyPaid(royaltyRecipient, royalty);
        }

        // Mint tokens to receiver
        _mint(receiver, tokensToMint);

        // Transfer reserve tokens from user (MCV2 pattern)
        IERC20(reserveToken).safeTransferFrom(
            msg.sender,
            address(this),
            reserveAmount - royalty
        );

        // UI Support: Track holder
        _addHolder(receiver);

        // UI Support: Record price history
        _recordPriceHistory();

        emit Mint(msg.sender, receiver, tokensToMint, reserveAmount);

        return reserveAmount;
    }

    /**
     * @dev Burn tokens and receive reserve tokens back (MCV2 compatible)
     * @param tokensToBurn Amount of tokens to burn
     * @param minRefund Minimum refund amount (slippage protection)
     * @param receiver Address to receive the refund
     * @return refundAmount Amount of reserve tokens refunded
     */
    function burn(
        uint256 tokensToBurn,
        uint256 minRefund,
        address receiver
    ) external nonReentrant returns (uint256 refundAmount) {
        if (receiver == address(0)) revert BondingToken__InvalidReceiver();
        if (tokensToBurn == 0) revert BondingToken__InvalidAmount();
        if (balanceOf(msg.sender) < tokensToBurn)
            revert BondingToken__InsufficientTokens();

        // Calculate refund amount (following MCV2 pattern)
        uint256 reserveFromBond = BondingCurveMath.calculateSellRefund(
            totalSupply(),
            tokensToBurn,
            steps,
            decimals()
        );

        uint256 royalty = (reserveFromBond * burnRoyalty) / ROYALTY_BASE;
        refundAmount = reserveFromBond - royalty;

        if (refundAmount < minRefund) revert BondingToken__SlippageExceeded();

        // Burn tokens from user
        _burn(msg.sender, tokensToBurn);

        // MCV2 pattern: Update reserve & fee balances
        reserveBalance -= (refundAmount + royalty);

        // Pay royalty to creator (MCV2 pattern)
        if (royalty > 0 && royaltyRecipient != address(0)) {
            IERC20(reserveToken).safeTransfer(royaltyRecipient, royalty);
            emit RoyaltyPaid(royaltyRecipient, royalty);
        }

        // Transfer reserve tokens to receiver (MCV2 pattern)
        IERC20(reserveToken).safeTransfer(receiver, refundAmount);

        // UI Support: Remove holder if balance is zero
        if (balanceOf(msg.sender) == 0) {
            _removeHolder(msg.sender);
        }

        // UI Support: Record price history
        _recordPriceHistory();

        emit Burn(msg.sender, receiver, tokensToBurn, refundAmount);

        return refundAmount;
    }

    /**
     * @dev Get current price per token
     */
    function getCurrentPrice() public view returns (uint256) {
        return BondingCurveMath.getCurrentPrice(totalSupply(), steps);
    }

    /**
     * @dev Get reserve amount required for minting tokens (including royalty)
     * @param tokensToMint Amount of tokens to mint
     * @return reserveAmount Total reserve amount needed (including royalty)
     * @return royalty Royalty amount
     */
    function getReserveForTokens(
        uint256 tokensToMint
    ) external view returns (uint256 reserveAmount, uint256 royalty) {
        uint256 reserveToBond = BondingCurveMath.calculateBuyCost(
            totalSupply(),
            tokensToMint,
            steps,
            decimals()
        );
        royalty = (reserveToBond * mintRoyalty) / ROYALTY_BASE;
        reserveAmount = reserveToBond + royalty;
    }

    /**
     * @dev Get refund amount for burning tokens (after royalty)
     * @param tokensToBurn Amount of tokens to burn
     * @return refundAmount Net refund amount (after royalty)
     * @return royalty Royalty amount
     */
    function getRefundForTokens(
        uint256 tokensToBurn
    ) external view returns (uint256 refundAmount, uint256 royalty) {
        uint256 reserveFromBond = BondingCurveMath.calculateSellRefund(
            totalSupply(),
            tokensToBurn,
            steps,
            decimals()
        );
        royalty = (reserveFromBond * burnRoyalty) / ROYALTY_BASE;
        refundAmount = reserveFromBond - royalty;
    }

    /**
     * @dev Get maximum supply from steps
     */
    function maxSupply() public view returns (uint256) {
        return BondingCurveMath.getMaxSupply(steps);
    }

    /**
     * @dev Get bonding curve information
     */
    function getBondingCurveInfo()
        external
        view
        returns (
            address nftCollection_,
            address reserveToken_,
            uint256 reserveBalance_,
            uint256 currentSupply,
            uint256 currentPrice,
            uint256 maxSupply_,
            uint16 mintRoyalty_,
            uint16 burnRoyalty_
        )
    {
        return (
            nftCollection,
            reserveToken,
            reserveBalance,
            totalSupply(),
            getCurrentPrice(),
            maxSupply(),
            mintRoyalty,
            burnRoyalty
        );
    }

    /**
     * @dev Get number of steps in the bonding curve
     */
    function getStepsLength() external view returns (uint256) {
        return steps.length;
    }

    /**
     * @dev Get a specific step
     */
    function getStep(
        uint256 index
    ) external view returns (uint128 rangeTo, uint128 price) {
        require(index < steps.length, "Index out of bounds");
        BondingCurveMath.BondStep memory step = steps[index];
        return (step.rangeTo, step.price);
    }

    /**
     * @dev Gets token holders with pagination (UI support)
     * @param offset Starting index
     * @param limit Number of holders to return
     */
    function getHolders(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        uint256 total = holders.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = holders[i];
        }
    }

    /**
     * @dev Gets price history with pagination (UI support)
     * @param offset Starting index (0 = most recent)
     * @param limit Number of price points to return
     */
    function getPriceHistory(
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (
            uint256[] memory timestamps,
            uint256[] memory prices,
            uint256[] memory supplies
        )
    {
        uint256 total = priceHistory.length;
        if (offset >= total) {
            return (new uint256[](0), new uint256[](0), new uint256[](0));
        }

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256 length = end - offset;
        timestamps = new uint256[](length);
        prices = new uint256[](length);
        supplies = new uint256[](length);

        // Return in reverse order (most recent first)
        for (uint256 i = 0; i < length; i++) {
            uint256 index = total - 1 - offset - i;
            timestamps[i] = priceHistory[index].timestamp;
            prices[i] = priceHistory[index].price;
            supplies[i] = priceHistory[index].supply;
        }
    }

    /**
     * @dev Gets the number of token holders
     */
    function getHolderCount() external view returns (uint256) {
        return holders.length;
    }

    /**
     * @dev Gets the number of price history points
     */
    function getPriceHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

    /**
     * @dev Internal function to add a holder
     */
    function _addHolder(address holder) internal {
        if (!isHolder[holder]) {
            isHolder[holder] = true;
            holderIndex[holder] = holders.length;
            holders.push(holder);
        }
    }

    /**
     * @dev Internal function to remove a holder
     */
    function _removeHolder(address holder) internal {
        if (isHolder[holder] && balanceOf(holder) == 0) {
            uint256 index = holderIndex[holder];
            uint256 lastIndex = holders.length - 1;

            if (index != lastIndex) {
                address lastHolder = holders[lastIndex];
                holders[index] = lastHolder;
                holderIndex[lastHolder] = index;
            }

            holders.pop();
            delete isHolder[holder];
            delete holderIndex[holder];
        }
    }

    /**
     * @dev Internal function to record price history
     */
    function _recordPriceHistory() internal {
        uint256 currentPrice = getCurrentPrice();
        uint256 currentSupply = totalSupply();

        // Only record if price or supply changed significantly
        if (
            priceHistory.length == 0 ||
            priceHistory[priceHistory.length - 1].price != currentPrice ||
            priceHistory[priceHistory.length - 1].supply != currentSupply
        ) {
            // Limit history size
            if (priceHistory.length >= MAX_PRICE_HISTORY) {
                // Remove oldest entry
                for (uint256 i = 0; i < priceHistory.length - 1; i++) {
                    priceHistory[i] = priceHistory[i + 1];
                }
                priceHistory.pop();
            }

            priceHistory.push(
                PricePoint({
                    timestamp: block.timestamp,
                    price: currentPrice,
                    supply: currentSupply
                })
            );
        }
    }
}
