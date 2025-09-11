// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BondingCurveMath} from "./libraries/BondingCurveMath.sol";
import {IBondingToken} from "./interfaces/ISystemContracts.sol";
import {INFTCollection} from "./interfaces/ISystemContracts.sol";

/**
 * @title ERC20Factory
 * @dev Factory for creating bonding tokens with step-based curves (MCV2 compatible)
 */
contract ERC20Factory is Ownable, ReentrancyGuard {
    // Error messages
    error ERC20Factory__InvalidImplementation();
    error ERC20Factory__InvalidCreationFee();
    error ERC20Factory__InvalidNFTCollection();
    error ERC20Factory__TokenAlreadyExists();
    error ERC20Factory__UnauthorizedCreator();
    error ERC20Factory__InvalidParameters();
    error ERC20Factory__CreationFeeTransferFailed();

    // Events
    event TokenCreated(
        address indexed token,
        address indexed creator,
        address indexed nftCollection,
        string name,
        string symbol,
        address reserveToken,
        uint256 maxSupply,
        uint16 mintRoyalty,
        uint16 burnRoyalty
    );
    event CreationFeeUpdated(uint256 newFee);

    // State variables
    address public immutable BONDING_TOKEN_IMPLEMENTATION;
    uint256 public creationFee;
    address public royaltyRecipient; // Where royalties go

    // Storage
    address[] public tokens;
    mapping(address => TokenInfo) public tokenInfo;
    mapping(address => address) public nftCollectionToToken;

    struct TokenInfo {
        address creator;
        address nftCollection;
        address reserveToken;
        uint256 maxSupply;
        uint16 mintRoyalty;
        uint16 burnRoyalty;
        bool exists;
    }

    /**
     * @dev Constructor
     * @param implementation_ The bonding token implementation address
     * @param owner The contract owner
     * @param creationFee_ The fee for creating tokens
     * @param royaltyRecipient_ Where royalties are sent
     */
    constructor(
        address implementation_,
        address owner,
        uint256 creationFee_,
        address royaltyRecipient_
    ) Ownable(owner) {
        if (implementation_ == address(0))
            revert ERC20Factory__InvalidImplementation();

        BONDING_TOKEN_IMPLEMENTATION = implementation_;
        creationFee = creationFee_;
        royaltyRecipient = royaltyRecipient_;
    }

    /**
     * @dev Creates a new bonding token with step-based curve
     * @param name Token name
     * @param symbol Token symbol
     * @param nftCollection Associated NFT collection
     * @param reserveToken Reserve token address (address(0) for ETH)
     * @param steps Array of bonding curve steps
     * @param mintRoyalty Royalty rate for minting (basis points)
     * @param burnRoyalty Royalty rate for burning (basis points)
     * @return token Address of the created token
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        address nftCollection,
        address reserveToken,
        BondingCurveMath.BondStep[] calldata steps,
        uint16 mintRoyalty,
        uint16 burnRoyalty
    ) external payable nonReentrant returns (address token) {
        // Validate creation fee
        if (msg.value < creationFee) revert ERC20Factory__InvalidCreationFee();

        // Validate NFT collection and creator
        if (nftCollection == address(0))
            revert ERC20Factory__InvalidNFTCollection();

        address nftCreator = INFTCollection(nftCollection).creator();
        if (nftCreator != msg.sender)
            revert ERC20Factory__UnauthorizedCreator();

        // Check if token already exists for this NFT collection
        if (nftCollectionToToken[nftCollection] != address(0)) {
            revert ERC20Factory__TokenAlreadyExists();
        }

        // Validate bonding curve steps
        BondingCurveMath.validateSteps(steps);

        // Validate royalty rates (max 50%)
        if (mintRoyalty > 5000 || burnRoyalty > 5000) {
            revert ERC20Factory__InvalidParameters();
        }

        // Clone the implementation
        token = Clones.clone(BONDING_TOKEN_IMPLEMENTATION);

        // Get max supply from steps
        uint256 maxSupply = BondingCurveMath.getMaxSupply(steps);

        // Initialize the token
        IBondingToken(token).initialize(
            name,
            symbol,
            msg.sender,
            nftCollection,
            reserveToken,
            steps,
            mintRoyalty,
            burnRoyalty,
            royaltyRecipient
        );

        // Store token info
        tokenInfo[token] = TokenInfo({
            creator: msg.sender,
            nftCollection: nftCollection,
            reserveToken: reserveToken,
            maxSupply: maxSupply,
            mintRoyalty: mintRoyalty,
            burnRoyalty: burnRoyalty,
            exists: true
        });

        tokens.push(token);
        nftCollectionToToken[nftCollection] = token;

        // Handle creation fee
        if (creationFee > 0) {
            (bool success, ) = owner().call{value: creationFee}("");
            if (!success) revert ERC20Factory__CreationFeeTransferFailed();
        }

        // Refund excess payment
        if (msg.value > creationFee) {
            (bool success, ) = msg.sender.call{value: msg.value - creationFee}(
                ""
            );
            require(success, "Refund failed");
        }

        emit TokenCreated(
            token,
            msg.sender,
            nftCollection,
            name,
            symbol,
            reserveToken,
            maxSupply,
            mintRoyalty,
            burnRoyalty
        );

        return token;
    }

    /**
     * @dev Updates the creation fee (owner only)
     * @param newFee New creation fee
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    /**
     * @dev Updates the royalty recipient (owner only)
     * @param newRecipient New royalty recipient
     */
    function setRoyaltyRecipient(address newRecipient) external onlyOwner {
        royaltyRecipient = newRecipient;
    }

    /**
     * @dev Gets the total number of created tokens
     */
    function getTokenCount() external view returns (uint256) {
        return tokens.length;
    }

    /**
     * @dev Gets a range of token addresses
     * @param offset Starting index
     * @param limit Maximum number of tokens to return
     */
    function getTokens(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        uint256 totalTokens = tokens.length;
        if (offset >= totalTokens) return new address[](0);

        uint256 end = offset + limit;
        if (end > totalTokens) end = totalTokens;

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = tokens[i];
        }

        return result;
    }

    /**
     * @dev Gets the token address for a given NFT collection
     * @param nftCollection NFT collection address
     */
    function getTokenForNFTCollection(
        address nftCollection
    ) external view returns (address) {
        return nftCollectionToToken[nftCollection];
    }

    /**
     * @dev Checks if a token address is valid (created by this factory)
     * @param token Token address to check
     */
    function isValidToken(address token) external view returns (bool) {
        return tokenInfo[token].exists;
    }

    /**
     * @dev Gets detailed information about a token
     * @param token Token address
     */
    function getTokenInfo(
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
        )
    {
        TokenInfo memory info = tokenInfo[token];
        return (
            info.creator,
            info.nftCollection,
            info.reserveToken,
            info.maxSupply,
            info.mintRoyalty,
            info.burnRoyalty,
            info.exists
        );
    }

    /**
     * @dev Gets the implementation address
     */
    function implementation() external view returns (address) {
        return BONDING_TOKEN_IMPLEMENTATION;
    }

    /**
     * @dev Gets tokens created by a specific creator
     * @param creator The creator address
     * @param offset Starting index
     * @param limit Number of tokens to return
     */
    function getTokensByCreator(
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        // First count tokens by creator
        uint256 count = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokenInfo[tokens[i]].creator == creator) {
                count++;
            }
        }

        if (offset >= count) return new address[](0);

        uint256 end = offset + limit;
        if (end > count) end = count;

        result = new address[](end - offset);
        uint256 resultIndex = 0;
        uint256 creatorTokenIndex = 0;

        for (
            uint256 i = 0;
            i < tokens.length && resultIndex < result.length;
            i++
        ) {
            if (tokenInfo[tokens[i]].creator == creator) {
                if (creatorTokenIndex >= offset) {
                    result[resultIndex] = tokens[i];
                    resultIndex++;
                }
                creatorTokenIndex++;
            }
        }
    }
}
