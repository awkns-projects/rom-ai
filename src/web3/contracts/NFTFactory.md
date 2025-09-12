# NFTFactory Smart Contract Documentation
# NFTFactory 智能合约文档

## Overview / 概述

**English:** The NFTFactory is a factory contract for creating NFT collections with custom pricing and payment tokens. It provides a standardized way to deploy NFT collections with configurable parameters and built-in protocol fee management.

**中文：** NFTFactory 是用于创建具有自定义定价和支付代币的 NFT 集合的工厂合约。它提供了一种标准化方式来部署具有可配置参数和内置协议费用管理的 NFT 集合。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** Ownable, ReentrancyGuard
- **Dependencies:** Clones (OpenZeppelin), SafeERC20

## Key Features / 主要功能

### 1. Collection Deployment / 集合部署

**English:** Creates NFT collections using the clone pattern for gas-efficient deployment.

**中文：** 使用克隆模式创建 NFT 集合，实现 gas 高效的部署。

### 2. Custom Configuration / 自定义配置

**English:** Allows creators to configure pricing, payment tokens, and supply limits for their collections.

**中文：** 允许创建者为其集合配置定价、支付代币和供应限制。

### 3. Protocol Fee Management / 协议费用管理

**English:** Implements configurable protocol fees on collection revenue.

**中文：** 在集合收入上实施可配置的协议费用。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `NFT_COLLECTION_IMPLEMENTATION` | address | Implementation contract for collections / 集合的实现合约 |
| `creationFee` | uint256 | Fee to create a collection / 创建集合的费用 |
| `protocolFeeRecipient` | address | Protocol fee recipient / 协议费用接收者 |
| `protocolFeeBps` | uint256 | Protocol fee in basis points / 协议费用（基点） |
| `collections` | address[] | Array of created collections / 已创建集合的数组 |
| `collectionInfo` | mapping | Collection information mapping / 集合信息映射 |

## Constants / 常量

```solidity
address public constant ETH_ADDRESS = address(0);
```

## Data Structures / 数据结构

### CollectionInfo Struct

```solidity
struct CollectionInfo {
    address creator;        // Collection creator / 集合创建者
    address paymentToken;   // Payment token / 支付代币
    uint256 mintPrice;      // Mint price / 铸造价格
    uint256 maxSupply;      // Maximum supply / 最大供应量
    bool exists;           // Collection exists flag / 集合存在标志
}
```

## Core Functions / 核心函数

### Constructor

**English:** Initializes the factory with implementation and fee settings.

**中文：** 使用实现和费用设置初始化工厂。

```solidity
constructor(
    address nftImplementation,
    uint256 initialCreationFee,
    address protocolFeeRecipient_,
    uint256 protocolFeeBps_,
    address owner
) Ownable(owner)
```

**Parameters / 参数:**
- `nftImplementation`: Implementation contract for NFT collections / NFT 集合的实现合约
- `initialCreationFee`: Initial fee for creating collections / 创建集合的初始费用
- `protocolFeeRecipient_`: Address to receive protocol fees / 接收协议费用的地址
- `protocolFeeBps_`: Protocol fee in basis points / 协议费用（基点）
- `owner`: Owner of the factory / 工厂的所有者

### createCollection()

**English:** Creates a new NFT collection with specified parameters.

**中文：** 使用指定参数创建新的 NFT 集合。

```solidity
function createCollection(
    string calldata name,
    string calldata symbol,
    string calldata baseURI,
    address paymentToken,
    uint256 mintPrice,
    uint256 maxSupply
) external payable nonReentrant returns (address collection)
```

**Parameters / 参数:**
- `name`: Collection name / 集合名称
- `symbol`: Collection symbol / 集合符号
- `baseURI`: Base URI for token metadata / 代币元数据的基础 URI
- `paymentToken`: Payment token (address(0) for ETH) / 支付代币（ETH 为 address(0)）
- `mintPrice`: Price per NFT / 每个 NFT 的价格
- `maxSupply`: Maximum supply of NFTs / NFT 的最大供应量

**Returns / 返回:**
- `collection`: Address of the created collection / 创建的集合地址

**Process Flow / 流程:**

1. **Input Validation / 输入验证:**
   ```solidity
   if (msg.sender == address(0)) revert NFTFactory__InvalidCreator();
   if (mintPrice == 0) revert NFTFactory__InvalidPrice();
   if (maxSupply == 0) revert NFTFactory__InvalidMaxSupply();
   ```

2. **Creation Fee Handling / 创建费用处理:**
   ```solidity
   if (creationFee > 0) {
       if (msg.value < creationFee) revert NFTFactory__InvalidCreationFee();
       
       (bool success, ) = owner().call{value: creationFee}("");
       if (!success) revert NFTFactory__CreationFeeTransferFailed();
   }
   
   // Refund excess ETH
   if (msg.value > creationFee) {
       (bool success, ) = msg.sender.call{value: msg.value - creationFee}("");
       require(success, "Refund failed");
   }
   ```

3. **Collection Deployment / 集合部署:**
   ```solidity
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
   ```

4. **Information Storage / 信息存储:**
   ```solidity
   collectionInfo[collection] = CollectionInfo({
       creator: msg.sender,
       paymentToken: paymentToken,
       mintPrice: mintPrice,
       maxSupply: maxSupply,
       exists: true
   });
   
   collections.push(collection);
   ```

5. **Event Emission / 事件发出:**
   ```solidity
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
   ```

## Administrative Functions / 管理函数

### updateCreationFee()

**English:** Updates the fee required to create new collections (owner only).

**中文：** 更新创建新集合所需的费用（仅所有者）。

```solidity
function updateCreationFee(uint256 newFee) external onlyOwner
```

### updateProtocolFeeRecipient()

**English:** Updates the address that receives protocol fees (owner only).

**中文：** 更新接收协议费用的地址（仅所有者）。

```solidity
function updateProtocolFeeRecipient(address newRecipient) external onlyOwner
```

### updateProtocolFeeBps()

**English:** Updates the protocol fee percentage with a maximum of 10% (owner only).

**中文：** 更新协议费用百分比，最大为 10%（仅所有者）。

```solidity
function updateProtocolFeeBps(uint256 newFeeBps) external onlyOwner
```

**Validation / 验证:**
```solidity
require(newFeeBps <= 1000, "Fee too high"); // Max 10%
```

## View Functions / 查询函数

### getCollectionCount()

**English:** Returns the total number of collections created.

**中文：** 返回已创建集合的总数。

```solidity
function getCollectionCount() external view returns (uint256)
```

### getCollections()

**English:** Returns collections with pagination support.

**中文：** 返回具有分页支持的集合。

```solidity
function getCollections(
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

**Parameters / 参数:**
- `offset`: Starting index / 起始索引
- `limit`: Number of collections to return / 要返回的集合数量

**Implementation / 实现:**
```solidity
uint256 total = collections.length;
if (offset >= total) return new address[](0);

uint256 end = offset + limit;
if (end > total) end = total;

result = new address[](end - offset);
for (uint256 i = offset; i < end; i++) {
    result[i - offset] = collections[i];
}
```

### getCollectionsByCreator()

**English:** Gets collections created by a specific creator with pagination.

**中文：** 获取特定创建者创建的集合，具有分页功能。

```solidity
function getCollectionsByCreator(
    address creator,
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

**Process / 过程:**

1. **Count Collections by Creator / 按创建者计算集合:**
   ```solidity
   uint256 count = 0;
   for (uint256 i = 0; i < collections.length; i++) {
       if (collectionInfo[collections[i]].creator == creator) {
           count++;
       }
   }
   ```

2. **Apply Pagination / 应用分页:**
   ```solidity
   if (offset >= count) return new address[](0);
   
   uint256 end = offset + limit;
   if (end > count) end = count;
   ```

3. **Build Result Array / 构建结果数组:**
   ```solidity
   result = new address[](end - offset);
   uint256 resultIndex = 0;
   uint256 creatorCollectionIndex = 0;
   
   for (uint256 i = 0; i < collections.length && resultIndex < result.length; i++) {
       if (collectionInfo[collections[i]].creator == creator) {
           if (creatorCollectionIndex >= offset) {
               result[resultIndex] = collections[i];
               resultIndex++;
           }
           creatorCollectionIndex++;
       }
   }
   ```

## Events / 事件

### CollectionCreated

**English:** Emitted when a new NFT collection is created.

**中文：** 创建新 NFT 集合时发出。

```solidity
event CollectionCreated(
    address indexed collection,     // Created collection address / 创建的集合地址
    address indexed creator,        // Collection creator / 集合创建者
    string name,                   // Collection name / 集合名称
    string symbol,                 // Collection symbol / 集合符号
    string baseURI,                // Base URI / 基础 URI
    address paymentToken,          // Payment token / 支付代币
    uint256 mintPrice,             // Mint price / 铸造价格
    uint256 maxSupply             // Maximum supply / 最大供应量
);
```

### CreationFeeUpdated

**English:** Emitted when the creation fee is updated.

**中文：** 更新创建费用时发出。

```solidity
event CreationFeeUpdated(uint256 newFee);
```

## Error Handling / 错误处理

### Custom Errors / 自定义错误

```solidity
error NFTFactory__InvalidImplementation();    // Invalid implementation address / 无效实现地址
error NFTFactory__InvalidCreator();          // Invalid creator address / 无效创建者地址
error NFTFactory__InvalidPaymentToken();     // Invalid payment token / 无效支付代币
error NFTFactory__InvalidPrice();            // Invalid price / 无效价格
error NFTFactory__InvalidMaxSupply();        // Invalid max supply / 无效最大供应量
error NFTFactory__CollectionNotFound();      // Collection not found / 未找到集合
error NFTFactory__CreationFeeTransferFailed(); // Fee transfer failed / 费用转账失败
error NFTFactory__InvalidCreationFee();      // Invalid creation fee sent / 发送的创建费用无效
```

## Security Features / 安全功能

### 1. Input Validation / 输入验证

**English:** Comprehensive validation of all input parameters to prevent invalid collections.

**中文：** 全面验证所有输入参数以防止无效集合。

```solidity
if (msg.sender == address(0)) revert NFTFactory__InvalidCreator();
if (mintPrice == 0) revert NFTFactory__InvalidPrice();
if (maxSupply == 0) revert NFTFactory__InvalidMaxSupply();
```

### 2. Fee Management / 费用管理

**English:** Secure handling of creation fees with automatic refunds for overpayment.

**中文：** 安全处理创建费用，为超额支付自动退款。

### 3. Access Control / 访问控制

**English:** Owner-only functions for updating factory settings with proper validation.

**中文：** 仅所有者函数用于更新工厂设置并进行适当验证。

### 4. Reentrancy Protection / 重入攻击保护

**English:** Uses ReentrancyGuard to prevent reentrancy attacks during collection creation.

**中文：** 使用 ReentrancyGuard 防止集合创建过程中的重入攻击。

## Gas Optimization Features / Gas 优化功能

### 1. Clone Pattern / 克隆模式

**English:** Uses OpenZeppelin's Clones library for efficient collection deployment.

**中文：** 使用 OpenZeppelin 的 Clones 库进行高效的集合部署。

```solidity
collection = Clones.clone(NFT_COLLECTION_IMPLEMENTATION);
```

**Benefits / 优势:**
- Significantly reduced deployment costs / 显著降低部署成本
- Consistent implementation across all collections / 所有集合的一致实现
- Smaller bytecode size / 更小的字节码大小

### 2. Efficient Storage / 高效存储

**English:** Uses mappings for O(1) lookups and packed structs for gas efficiency.

**中文：** 使用映射进行 O(1) 查找，使用打包结构体提高 gas 效率。

### 3. Pagination Support / 分页支持

**English:** Built-in pagination prevents gas limit issues when querying large datasets.

**中文：** 内置分页防止查询大数据集时的 gas 限制问题。

## Usage Examples / 使用示例

### Basic Collection Creation / 基本集合创建

```solidity
// English: Create a simple NFT collection
// 中文: 创建简单的 NFT 集合

contract CollectionCreator {
    INFTFactory public nftFactory;
    
    constructor(address factoryAddress) {
        nftFactory = INFTFactory(factoryAddress);
    }
    
    function createMyCollection() external payable {
        uint256 creationFee = nftFactory.creationFee();
        
        address collection = nftFactory.createCollection{value: creationFee}(
            "My Awesome NFTs",           // name
            "MANFT",                     // symbol
            "https://api.mysite.com/",   // baseURI
            address(0),                  // ETH as payment token
            0.05 ether,                  // 0.05 ETH per NFT
            10000                        // Max supply: 10,000 NFTs
        );
        
        // Collection is now deployed and ready to use
        emit CollectionDeployed(collection);
    }
    
    event CollectionDeployed(address indexed collection);
}
```

### ERC20 Payment Collection / ERC20 支付集合

```solidity
// English: Create collection that accepts ERC20 payments
// 中文: 创建接受 ERC20 支付的集合

function createUSDCCollection(address usdcToken) external payable {
    uint256 creationFee = nftFactory.creationFee();
    
    address collection = nftFactory.createCollection{value: creationFee}(
        "USDC Art Collection",
        "USDCART",
        "https://metadata.example.com/",
        usdcToken,                       // USDC as payment token
        50 * 10**6,                      // 50 USDC per NFT (6 decimals)
        5000                             // Max supply: 5,000 NFTs
    );
    
    // Users will need to approve USDC before minting
}
```

### Querying Collections / 查询集合

```solidity
// English: Query factory for collection information
// 中文: 查询工厂获取集合信息

contract CollectionBrowser {
    function browseCollections(
        address factory,
        uint256 page,
        uint256 pageSize
    ) external view returns (
        address[] memory collections,
        uint256 totalCount
    ) {
        INFTFactory nftFactory = INFTFactory(factory);
        
        totalCount = nftFactory.getCollectionCount();
        uint256 offset = page * pageSize;
        
        collections = nftFactory.getCollections(offset, pageSize);
    }
    
    function getCreatorCollections(
        address factory,
        address creator
    ) external view returns (address[] memory) {
        INFTFactory nftFactory = INFTFactory(factory);
        
        // Get all collections by creator (first 100)
        return nftFactory.getCollectionsByCreator(creator, 0, 100);
    }
    
    function getCollectionDetails(
        address factory,
        address collection
    ) external view returns (
        address creator,
        address paymentToken,
        uint256 mintPrice,
        uint256 maxSupply,
        bool exists
    ) {
        INFTFactory nftFactory = INFTFactory(factory);
        
        (creator, paymentToken, mintPrice, maxSupply, exists) = 
            nftFactory.collectionInfo(collection);
    }
}
```

### Administrative Operations / 管理操作

```solidity
// English: Factory administration examples
// 中文: 工厂管理示例

contract FactoryAdmin {
    INFTFactory public nftFactory;
    
    modifier onlyFactoryOwner() {
        require(msg.sender == nftFactory.owner(), "Not factory owner");
        _;
    }
    
    function updateFactorySettings(
        uint256 newCreationFee,
        address newFeeRecipient,
        uint256 newProtocolFeeBps
    ) external onlyFactoryOwner {
        // Update creation fee
        nftFactory.updateCreationFee(newCreationFee);
        
        // Update protocol fee recipient
        nftFactory.updateProtocolFeeRecipient(newFeeRecipient);
        
        // Update protocol fee (max 10%)
        require(newProtocolFeeBps <= 1000, "Fee too high");
        nftFactory.updateProtocolFeeBps(newProtocolFeeBps);
    }
}
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:**
1. Check creation fee before showing collection creation UI
2. Validate all input parameters client-side before submission
3. Handle ETH refunds properly for overpayment scenarios
4. Implement pagination for collection listings
5. Display collection statistics and creator information

**中文:**
1. 显示集合创建 UI 前检查创建费用
2. 提交前在客户端验证所有输入参数
3. 正确处理超额支付场景的 ETH 退款
4. 为集合列表实现分页
5. 显示集合统计信息和创建者信息

### For Smart Contract Integration / 智能合约集成

**English:**
1. Always validate collection addresses before interacting
2. Listen for `CollectionCreated` events for real-time updates
3. Use proper error handling for all custom errors
4. Implement access control for admin functions

**中文:**
1. 交互前始终验证集合地址
2. 监听 `CollectionCreated` 事件进行实时更新
3. 为所有自定义错误使用适当的错误处理
4. 为管理函数实现访问控制

### For Backend Services / 后端服务

**English:**
1. Index `CollectionCreated` events for database updates
2. Monitor protocol fee changes for accounting
3. Track collection performance metrics
4. Implement proper error logging and monitoring

**中文:**
1. 索引 `CollectionCreated` 事件进行数据库更新
2. 监控协议费用变化进行会计处理
3. 跟踪集合性能指标
4. 实现适当的错误日志和监控

## Best Practices / 最佳实践

### 1. Collection Planning / 集合规划

**English:** Plan collection parameters carefully as they cannot be changed after deployment.

**中文：** 仔细规划集合参数，因为部署后无法更改。

### 2. Payment Token Selection / 支付代币选择

**English:** Choose stable, widely-accepted tokens for better user adoption.

**中文：** 选择稳定、广泛接受的代币以获得更好的用户采用。

### 3. Pricing Strategy / 定价策略

**English:** Set reasonable prices that balance accessibility with value.

**中文：** 设置合理的价格，平衡可访问性和价值。

### 4. Supply Management / 供应管理

**English:** Consider market demand and scarcity when setting maximum supply.

**中文：** 设置最大供应量时考虑市场需求和稀缺性。

### 5. Fee Monitoring / 费用监控

**English:** Regularly review and adjust protocol fees to maintain competitiveness.

**中文：** 定期审查和调整协议费用以保持竞争力。

## Deployment Considerations / 部署考虑

### 1. Implementation Contract / 实现合约

**English:** Deploy a single implementation contract and use it across all collections.

**中文：** 部署单个实现合约并在所有集合中使用。

### 2. Fee Structure / 费用结构

**English:** Set initial fees conservatively and adjust based on network conditions.

**中文：** 保守设置初始费用并根据网络条件调整。

### 3. Upgrade Path / 升级路径

**English:** Plan for potential upgrades to the implementation contract.

**中文：** 为实现合约的潜在升级做计划。

### 4. Monitoring and Analytics / 监控和分析

**English:** Implement comprehensive monitoring for factory usage and performance.

**中文：** 为工厂使用和性能实施全面监控。 