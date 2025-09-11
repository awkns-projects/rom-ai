// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTFactory
 * @dev Factory contract for creating NFT collections with custom pricing and payment tokens
 */
contract NFTFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Error messages
    error NFTFactory__InvalidImplementation();
    error NFTFactory__InvalidCreator();
    error NFTFactory__InvalidPaymentToken();
    error NFTFactory__InvalidPrice();
    error NFTFactory__InvalidMaxSupply();
    error NFTFactory__CollectionNotFound();
    error NFTFactory__CreationFeeTransferFailed();
    error NFTFactory__InvalidCreationFee();

    // Events
    event CollectionCreated(
        address indexed collection,
        address indexed creator,
        string name,
        string symbol,
        string baseURI,
        address paymentToken,
        uint256 mintPrice,
        uint256 maxSupply
    );
    event CreationFeeUpdated(uint256 newFee);

    // Constants
    address public constant ETH_ADDRESS = address(0);

    // State variables
    address public immutable NFT_COLLECTION_IMPLEMENTATION;
    uint256 public creationFee;
    address[] public collections;

    // Protocol fee settings
    address public protocolFeeRecipient;
    uint256 public protocolFeeBps; // Basis points (10000 = 100%)

    // Collection info mapping
    mapping(address => CollectionInfo) public collectionInfo;

    struct CollectionInfo {
        address creator;
        address paymentToken;
        uint256 mintPrice;
        uint256 maxSupply;
        bool exists;
    }

    /**
     * @dev Constructor
     * @param nftImplementation The implementation contract for NFT collections
     * @param initialCreationFee Initial fee for creating collections
     * @param protocolFeeRecipient_ The address to receive protocol fees
     * @param protocolFeeBps_ The protocol fee in basis points
     * @param owner The owner of the factory
     */
    constructor(
        address nftImplementation,
        uint256 initialCreationFee,
        address protocolFeeRecipient_,
        uint256 protocolFeeBps_,
        address owner
    ) Ownable(owner) {
        if (nftImplementation == address(0))
            revert NFTFactory__InvalidImplementation();

        NFT_COLLECTION_IMPLEMENTATION = nftImplementation;
        creationFee = initialCreationFee;
        protocolFeeRecipient = protocolFeeRecipient_;
        protocolFeeBps = protocolFeeBps_;
    }

    /**
     * @dev Creates a new NFT collection
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseURI The base URI for token metadata
     * @param paymentToken The token used for payments (address(0) for ETH)
     * @param mintPrice The price to mint each NFT
     * @param maxSupply The maximum supply of the collection
     * @return collection The address of the created collection
     */
    function createCollection(
        string calldata name,
        string calldata symbol,
        string calldata baseURI,
        address paymentToken,
        uint256 mintPrice,
        uint256 maxSupply
    ) external payable nonReentrant returns (address collection) {
        if (msg.sender == address(0)) revert NFTFactory__InvalidCreator();
        if (mintPrice == 0) revert NFTFactory__InvalidPrice();
        if (maxSupply == 0) revert NFTFactory__InvalidMaxSupply();

        // Handle creation fee
        if (creationFee > 0) {
            if (msg.value < creationFee)
                revert NFTFactory__InvalidCreationFee();

            (bool success, ) = owner().call{value: creationFee}("");
            if (!success) revert NFTFactory__CreationFeeTransferFailed();
        }

        // Refund excess ETH
        if (msg.value > creationFee) {
            (bool success, ) = msg.sender.call{value: msg.value - creationFee}(
                ""
            );
            require(success, "Refund failed");
        }

        // Clone the implementation
        collection = Clones.clone(NFT_COLLECTION_IMPLEMENTATION);

        // Initialize the collection
        INFTCollection(collection).initialize(
            name,
            symbol,
            baseURI,
            msg.sender,
            paymentToken,
            mintPrice,
            maxSupply,
            protocolFeeRecipient,
            protocolFeeBps
        );

        // Store collection info
        collectionInfo[collection] = CollectionInfo({
            creator: msg.sender,
            paymentToken: paymentToken,
            mintPrice: mintPrice,
            maxSupply: maxSupply,
            exists: true
        });

        collections.push(collection);

        emit CollectionCreated(
            collection,
            msg.sender,
            name,
            symbol,
            baseURI,
            paymentToken,
            mintPrice,
            maxSupply
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
     * @dev Returns the total number of collections created
     */
    function getCollectionCount() external view returns (uint256) {
        return collections.length;
    }

    /**
     * @dev Returns collections with pagination
     * @param offset Starting index
     * @param limit Number of collections to return
     */
    function getCollections(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        uint256 total = collections.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = collections[i];
        }
    }

    /**
     * @dev Gets collections created by a specific creator
     * @param creator The creator address
     * @param offset Starting index
     * @param limit Number of collections to return
     */
    function getCollectionsByCreator(
        address creator,
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        // First count collections by creator
        uint256 count = 0;
        for (uint256 i = 0; i < collections.length; i++) {
            if (collectionInfo[collections[i]].creator == creator) {
                count++;
            }
        }

        if (offset >= count) return new address[](0);

        uint256 end = offset + limit;
        if (end > count) end = count;

        result = new address[](end - offset);
        uint256 resultIndex = 0;
        uint256 creatorCollectionIndex = 0;

        for (
            uint256 i = 0;
            i < collections.length && resultIndex < result.length;
            i++
        ) {
            if (collectionInfo[collections[i]].creator == creator) {
                if (creatorCollectionIndex >= offset) {
                    result[resultIndex] = collections[i];
                    resultIndex++;
                }
                creatorCollectionIndex++;
            }
        }
    }
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
        uint256 maxSupply,
        address protocolFeeRecipient,
        uint256 protocolFeeBps
    ) external;
}
