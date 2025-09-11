// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.20;

import {ERC20Initializable} from "./libraries/ERC20Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BondingCurveMath} from "./libraries/BondingCurveMath.sol";

/**
 * @title BondingTokenETH
 * @dev Enhanced bonding token that supports both ETH and ERC20 as reserve tokens
 */
contract BondingTokenETH is ERC20Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom errors
    error BondingTokenETH__InvalidCreator();
    error BondingTokenETH__InvalidNFTCollection();
    error BondingTokenETH__InvalidReceiver();
    error BondingTokenETH__InvalidAmount();
    error BondingTokenETH__SlippageExceeded();
    error BondingTokenETH__MaxSupplyReached();
    error BondingTokenETH__InsufficientTokens();
    error BondingTokenETH__TransferFailed();
    error BondingTokenETH__InvalidRoyalty();
    error BondingTokenETH__UnexpectedETH();
    error BondingTokenETH__InsufficientETH();

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
    address public constant ETH_ADDRESS = address(0);

    // State variables
    bool private _initialized;
    address public creator;
    address public nftCollection;
    address public reserveToken; // address(0) for ETH, ERC20 address for tokens

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
     * @dev Initialize the bonding token
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param creator_ Token creator
     * @param nftCollection_ Associated NFT collection
     * @param reserveToken_ Reserve token address (address(0) for ETH)
     * @param steps_ Bonding curve steps
     * @param mintRoyalty_ Mint royalty in basis points
     * @param burnRoyalty_ Burn royalty in basis points
     * @param royaltyRecipient_ Royalty recipient address
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        address creator_,
        address nftCollection_,
        address reserveToken_,
        BondingCurveMath.BondStep[] memory steps_,
        uint16 mintRoyalty_,
        uint16 burnRoyalty_,
        address royaltyRecipient_
    ) external {
        if (_initialized) revert("Already initialized");
        if (creator_ == address(0)) revert BondingTokenETH__InvalidCreator();
        if (nftCollection_ == address(0))
            revert BondingTokenETH__InvalidNFTCollection();

        // Validate steps
        BondingCurveMath.validateSteps(steps_);

        // Validate royalties (max 10%)
        if (mintRoyalty_ > 1000) revert BondingTokenETH__InvalidRoyalty();
        if (burnRoyalty_ > 1000) revert BondingTokenETH__InvalidRoyalty();

        _initialized = true;

        // Initialize ERC20 metadata
        initialize(name_, symbol_);

        // Set bonding curve parameters
        creator = creator_;
        nftCollection = nftCollection_;
        reserveToken = reserveToken_; // Can be address(0) for ETH!

        // Copy steps
        for (uint256 i = 0; i < steps_.length; i++) {
            steps.push(steps_[i]);
        }

        // Set royalty parameters
        mintRoyalty = mintRoyalty_;
        burnRoyalty = burnRoyalty_;
        royaltyRecipient = royaltyRecipient_;

        // Record initial price history
        _recordPriceHistory();
    }

    /**
     * @dev Mint tokens using reserve currency
     * @param tokensToMint Amount of tokens to mint
     * @param maxReserveAmount Maximum reserve amount willing to pay
     * @param receiver Address to receive tokens
     */
    function mint(
        uint256 tokensToMint,
        uint256 maxReserveAmount,
        address receiver
    ) external payable nonReentrant returns (uint256 reserveAmount) {
        if (receiver == address(0)) revert BondingTokenETH__InvalidReceiver();
        if (tokensToMint == 0) revert BondingTokenETH__InvalidAmount();

        // Calculate required reserve amount
        uint256 reserveToBond = BondingCurveMath.calculateBuyCost(
            totalSupply(),
            tokensToMint,
            steps,
            decimals()
        );

        uint256 royalty = (reserveToBond * mintRoyalty) / ROYALTY_BASE;
        reserveAmount = reserveToBond + royalty;

        if (reserveAmount > maxReserveAmount)
            revert BondingTokenETH__SlippageExceeded();
        if (totalSupply() + tokensToMint > maxSupply())
            revert BondingTokenETH__MaxSupplyReached();

        // Handle payment based on reserve token type
        if (reserveToken == ETH_ADDRESS) {
            // ETH as reserve token
            if (msg.value != reserveAmount)
                revert BondingTokenETH__InsufficientETH();
        } else {
            // ERC20 as reserve token
            if (msg.value != 0) revert BondingTokenETH__UnexpectedETH();
            IERC20(reserveToken).safeTransferFrom(
                msg.sender,
                address(this),
                reserveAmount
            );
        }

        // Update reserve balance (only base cost, not royalty)
        reserveBalance += reserveToBond;

        // Pay royalty to recipient
        if (royalty > 0 && royaltyRecipient != address(0)) {
            if (reserveToken == ETH_ADDRESS) {
                // ETH royalty
                (bool success, ) = royaltyRecipient.call{value: royalty}("");
                if (!success) revert BondingTokenETH__TransferFailed();
            } else {
                // ERC20 royalty
                IERC20(reserveToken).safeTransfer(royaltyRecipient, royalty);
            }
            emit RoyaltyPaid(royaltyRecipient, royalty);
        }

        // Mint tokens to receiver
        _mint(receiver, tokensToMint);

        // UI Support: Add holder if new
        _addHolder(receiver);

        // UI Support: Record price history
        _recordPriceHistory();

        emit Mint(msg.sender, receiver, tokensToMint, reserveAmount);

        return reserveAmount;
    }

    /**
     * @dev Burn tokens to get reserve currency back
     * @param tokensToBurn Amount of tokens to burn
     * @param minRefund Minimum refund amount expected
     * @param receiver Address to receive refund
     */
    function burn(
        uint256 tokensToBurn,
        uint256 minRefund,
        address receiver
    ) external nonReentrant returns (uint256 refundAmount) {
        if (receiver == address(0)) revert BondingTokenETH__InvalidReceiver();
        if (tokensToBurn == 0) revert BondingTokenETH__InvalidAmount();
        if (balanceOf(msg.sender) < tokensToBurn)
            revert BondingTokenETH__InsufficientTokens();

        // Calculate refund amount
        uint256 reserveFromBond = BondingCurveMath.calculateSellRefund(
            totalSupply(),
            tokensToBurn,
            steps,
            decimals()
        );

        uint256 royalty = (reserveFromBond * burnRoyalty) / ROYALTY_BASE;
        refundAmount = reserveFromBond - royalty;

        if (refundAmount < minRefund)
            revert BondingTokenETH__SlippageExceeded();

        // Burn tokens from user
        _burn(msg.sender, tokensToBurn);

        // Update reserve balance
        reserveBalance -= reserveFromBond;

        // Pay royalty to recipient
        if (royalty > 0 && royaltyRecipient != address(0)) {
            if (reserveToken == ETH_ADDRESS) {
                // ETH royalty
                (bool success, ) = royaltyRecipient.call{value: royalty}("");
                if (!success) revert BondingTokenETH__TransferFailed();
            } else {
                // ERC20 royalty
                IERC20(reserveToken).safeTransfer(royaltyRecipient, royalty);
            }
            emit RoyaltyPaid(royaltyRecipient, royalty);
        }

        // Transfer refund to receiver
        if (reserveToken == ETH_ADDRESS) {
            // ETH refund
            (bool success, ) = receiver.call{value: refundAmount}("");
            if (!success) revert BondingTokenETH__TransferFailed();
        } else {
            // ERC20 refund
            IERC20(reserveToken).safeTransfer(receiver, refundAmount);
        }

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
     * @dev Get number of steps
     */
    function getStepsLength() external view returns (uint256) {
        return steps.length;
    }

    /**
     * @dev Get step at index
     */
    function getStep(
        uint256 index
    ) external view returns (BondingCurveMath.BondStep memory) {
        return steps[index];
    }

    // UI Support Functions
    function getHolders(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        uint256 length = holders.length;
        if (offset >= length) return new address[](0);

        uint256 end = offset + limit;
        if (end > length) end = length;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = holders[i];
        }
    }

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
        uint256 length = priceHistory.length;
        if (offset >= length) {
            return (new uint256[](0), new uint256[](0), new uint256[](0));
        }

        uint256 end = offset + limit;
        if (end > length) end = length;

        uint256 resultLength = end - offset;
        timestamps = new uint256[](resultLength);
        prices = new uint256[](resultLength);
        supplies = new uint256[](resultLength);

        for (uint256 i = offset; i < end; i++) {
            timestamps[i - offset] = priceHistory[i].timestamp;
            prices[i - offset] = priceHistory[i].price;
            supplies[i - offset] = priceHistory[i].supply;
        }
    }

    function getHolderCount() external view returns (uint256) {
        return holders.length;
    }

    function getPriceHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }

    // Internal functions
    function _addHolder(address holder) internal {
        if (!isHolder[holder]) {
            isHolder[holder] = true;
            holderIndex[holder] = holders.length;
            holders.push(holder);
        }
    }

    function _removeHolder(address holder) internal {
        if (isHolder[holder]) {
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

    function _recordPriceHistory() internal {
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
                price: getCurrentPrice(),
                supply: totalSupply()
            })
        );
    }

    // Name and symbol functions are inherited from ERC20Initializable

    // Allow contract to receive ETH when used as reserve token
    receive() external payable {
        // Only accept ETH if it's the reserve token
        if (reserveToken != ETH_ADDRESS) {
            revert BondingTokenETH__UnexpectedETH();
        }
    }
}
