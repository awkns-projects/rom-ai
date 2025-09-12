# ERC20Factory Smart Contract Documentation
# ERC20Factory 智能合约文档

## Overview / 概述

**English:** The ERC20Factory is a factory contract for creating bonding tokens with step-based curves that are MCV2 compatible. It provides a standardized way to deploy bonding tokens with configurable bonding curve parameters and royalty settings.

**中文：** ERC20Factory 是用于创建具有阶梯式曲线的联合代币的工厂合约，与 MCV2 兼容。它提供了一种标准化方式来部署具有可配置联合曲线参数和版税设置的联合代币。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** Ownable, ReentrancyGuard
- **Dependencies:** Clones (OpenZeppelin), BondingCurveMath

## Key Features / 主要功能

### 1. Bonding Token Deployment / 联合代币部署

**English:** Creates bonding tokens using the clone pattern for gas-efficient deployment with step-based bonding curves.

**中文：** 使用克隆模式创建联合代币，实现 gas 高效的部署，具有阶梯式联合曲线。

### 2. MCV2 Compatibility / MCV2 兼容性

**English:** Follows MCV2 patterns for bonding curve implementation and reserve token management.

**中文：** 遵循 MCV2 模式进行联合曲线实现和储备代币管理。

### 3. Access Control / 访问控制

**English:** Only NFT collection creators can create bonding tokens for their collections.

**中文：** 只有 NFT 集合创建者才能为其集合创建联合代币。

### 4. Royalty Management / 版税管理

**English:** Configurable royalty rates for minting and burning operations with maximum limits.

**中文：** 铸造和销毁操作的可配置版税率，具有最大限制。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `BONDING_TOKEN_IMPLEMENTATION` | address | Implementation contract for bonding tokens / 联合代币的实现合约 |
| `creationFee` | uint256 | Fee to create a bonding token / 创建联合代币的费用 |
| `royaltyRecipient` | address | Where royalties are sent / 版税发送地址 |
| `tokens` | address[] | Array of created tokens / 已创建代币的数组 |
| `tokenInfo` | mapping | Token information mapping / 代币信息映射 |
| `nftCollectionToToken` | mapping | NFT collection to token mapping / NFT 集合到代币的映射 |

## Data Structures / 数据结构

### TokenInfo Struct

```solidity
struct TokenInfo {
    address creator;        // Token creator / 代币创建者
    address nftCollection;  // Associated NFT collection / 关联的 NFT 集合
    address reserveToken;   // Reserve token / 储备代币
    uint256 maxSupply;      // Maximum supply / 最大供应量
    uint16 mintRoyalty;     // Mint royalty in basis points / 铸造版税（基点）
    uint16 burnRoyalty;     // Burn royalty in basis points / 销毁版税（基点）
    bool exists;           // Token exists flag / 代币存在标志
}
```

## Core Functions / 核心函数

### Constructor

**English:** Initializes the factory with implementation and configuration settings.

**中文：** 使用实现和配置设置初始化工厂。

```solidity
constructor(
    address implementation_,
    address owner,
    uint256 creationFee_,
    address royaltyRecipient_
) Ownable(owner)
```

**Parameters / 参数:**
- `implementation_`: Bonding token implementation address / 联合代币实现地址
- `owner`: Contract owner / 合约所有者
- `creationFee_`: Fee for creating tokens / 创建代币的费用
- `royaltyRecipient_`: Where royalties are sent / 版税发送地址

### createToken()

**English:** Creates a new bonding token with step-based curve for an NFT collection.

**中文：** 为 NFT 集合创建具有阶梯式曲线的新联合代币。

```solidity
function createToken(
    string calldata name,
    string calldata symbol,
    address nftCollection,
    address reserveToken,
    BondingCurveMath.BondStep[] calldata steps,
    uint16 mintRoyalty,
    uint16 burnRoyalty
) external payable nonReentrant returns (address token)
```

**Parameters / 参数:**
- `name`: Token name / 代币名称
- `symbol`: Token symbol / 代币符号
- `nftCollection`: Associated NFT collection / 关联的 NFT 集合
- `reserveToken`: Reserve token address (address(0) for ETH) / 储备代币地址（ETH 为 address(0)）
- `steps`: Array of bonding curve steps / 联合曲线阶梯数组
- `mintRoyalty`: Royalty rate for minting (basis points) / 铸造版税率（基点）
- `burnRoyalty`: Royalty rate for burning (basis points) / 销毁版税率（基点）

**Returns / 返回:**
- `token`: Address of the created bonding token / 创建的联合代币地址

**Process Flow / 流程:**

1. **Fee Validation / 费用验证:**
   ```solidity
   if (msg.value < creationFee) revert ERC20Factory__InvalidCreationFee();
   ```

2. **NFT Collection Validation / NFT 集合验证:**
   ```solidity
   if (nftCollection == address(0)) revert ERC20Factory__InvalidNFTCollection();
   
   address nftCreator = INFTCollection(nftCollection).creator();
   if (nftCreator != msg.sender) revert ERC20Factory__UnauthorizedCreator();
   ```

3. **Duplicate Prevention / 重复防护:**
   ```solidity
   if (nftCollectionToToken[nftCollection] != address(0)) {
       revert ERC20Factory__TokenAlreadyExists();
   }
   ```

4. **Curve Validation / 曲线验证:**
   ```solidity
   BondingCurveMath.validateSteps(steps);
   ```

5. **Royalty Validation / 版税验证:**
   ```solidity
   if (mintRoyalty > 5000 || burnRoyalty > 5000) {
       revert ERC20Factory__InvalidParameters(); // Max 50%
   }
   ```

6. **Token Deployment / 代币部署:**
   ```solidity
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
   ```

7. **Information Storage / 信息存储:**
   ```solidity
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
   ```

8. **Fee Handling / 费用处理:**
   ```solidity
   if (creationFee > 0) {
       (bool success, ) = owner().call{value: creationFee}("");
       if (!success) revert ERC20Factory__CreationFeeTransferFailed();
   }
   
   // Refund excess payment
   if (msg.value > creationFee) {
       (bool success, ) = msg.sender.call{value: msg.value - creationFee}("");
       require(success, "Refund failed");
   }
   ```

## Administrative Functions / 管理函数

### setCreationFee()

**English:** Updates the creation fee (owner only).

**中文：** 更新创建费用（仅所有者）。

```solidity
function setCreationFee(uint256 newFee) external onlyOwner
```

### setRoyaltyRecipient()

**English:** Updates the royalty recipient (owner only).

**中文：** 更新版税接收者（仅所有者）。

```solidity
function setRoyaltyRecipient(address newRecipient) external onlyOwner
```

## View Functions / 查询函数

### getTokenCount()

**English:** Gets the total number of created tokens.

**中文：** 获取已创建代币的总数。

```solidity
function getTokenCount() external view returns (uint256)
```

### getTokens()

**English:** Gets a range of token addresses with pagination.

**中文：** 获取具有分页功能的代币地址范围。

```solidity
function getTokens(
    uint256 offset,
    uint256 limit
) external view returns (address[] memory)
```

**Implementation / 实现:**
```solidity
uint256 totalTokens = tokens.length;
if (offset >= totalTokens) return new address[](0);

uint256 end = offset + limit;
if (end > totalTokens) end = totalTokens;

address[] memory result = new address[](end - offset);
for (uint256 i = offset; i < end; i++) {
    result[i - offset] = tokens[i];
}

return result;
```

### getTokenForNFTCollection()

**English:** Gets the token address for a given NFT collection.

**中文：** 获取给定 NFT 集合的代币地址。

```solidity
function getTokenForNFTCollection(address nftCollection) external view returns (address)
```

### isValidToken()

**English:** Checks if a token address is valid (created by this factory).

**中文：** 检查代币地址是否有效（由此工厂创建）。

```solidity
function isValidToken(address token) external view returns (bool)
```

### getTokenInfo()

**English:** Gets detailed information about a token.

**中文：** 获取代币的详细信息。

```solidity
function getTokenInfo(address token) external view returns (
    address creator,
    address nftCollection,
    address reserveToken,
    uint256 maxSupply,
    uint16 mintRoyalty,
    uint16 burnRoyalty,
    bool exists
)
```

### getTokensByCreator()

**English:** Gets tokens created by a specific creator with pagination.

**中文：** 获取特定创建者创建的代币，具有分页功能。

```solidity
function getTokensByCreator(
    address creator,
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

**Process / 过程:**

1. **Count Tokens by Creator / 按创建者计算代币:**
   ```solidity
   uint256 count = 0;
   for (uint256 i = 0; i < tokens.length; i++) {
       if (tokenInfo[tokens[i]].creator == creator) {
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
   uint256 creatorTokenIndex = 0;
   
   for (uint256 i = 0; i < tokens.length && resultIndex < result.length; i++) {
       if (tokenInfo[tokens[i]].creator == creator) {
           if (creatorTokenIndex >= offset) {
               result[resultIndex] = tokens[i];
               resultIndex++;
           }
           creatorTokenIndex++;
       }
   }
   ```

## Events / 事件

### TokenCreated

**English:** Emitted when a new bonding token is created.

**中文：** 创建新联合代币时发出。

```solidity
event TokenCreated(
    address indexed token,          // Created token address / 创建的代币地址
    address indexed creator,        // Token creator / 代币创建者
    address indexed nftCollection,  // Associated NFT collection / 关联的 NFT 集合
    string name,                   // Token name / 代币名称
    string symbol,                 // Token symbol / 代币符号
    address reserveToken,          // Reserve token / 储备代币
    uint256 maxSupply,             // Maximum supply / 最大供应量
    uint16 mintRoyalty,            // Mint royalty / 铸造版税
    uint16 burnRoyalty             // Burn royalty / 销毁版税
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
error ERC20Factory__InvalidImplementation();    // Invalid implementation address / 无效实现地址
error ERC20Factory__InvalidCreationFee();      // Invalid creation fee / 无效创建费用
error ERC20Factory__InvalidNFTCollection();    // Invalid NFT collection / 无效 NFT 集合
error ERC20Factory__TokenAlreadyExists();      // Token already exists / 代币已存在
error ERC20Factory__UnauthorizedCreator();     // Unauthorized creator / 未授权创建者
error ERC20Factory__InvalidParameters();       // Invalid parameters / 无效参数
error ERC20Factory__CreationFeeTransferFailed(); // Fee transfer failed / 费用转账失败
```

## Security Features / 安全功能

### 1. Access Control / 访问控制

**English:** Only NFT collection creators can create bonding tokens for their collections.

**中文：** 只有 NFT 集合创建者才能为其集合创建联合代币。

```solidity
address nftCreator = INFTCollection(nftCollection).creator();
if (nftCreator != msg.sender) revert ERC20Factory__UnauthorizedCreator();
```

### 2. Duplicate Prevention / 重复防护

**English:** Prevents multiple bonding tokens for the same NFT collection.

**中文：** 防止为同一 NFT 集合创建多个联合代币。

```solidity
if (nftCollectionToToken[nftCollection] != address(0)) {
    revert ERC20Factory__TokenAlreadyExists();
}
```

### 3. Parameter Validation / 参数验证

**English:** Comprehensive validation of bonding curve steps and royalty rates.

**中文：** 全面验证联合曲线阶梯和版税率。

```solidity
BondingCurveMath.validateSteps(steps);
if (mintRoyalty > 5000 || burnRoyalty > 5000) {
    revert ERC20Factory__InvalidParameters();
}
```

### 4. Reentrancy Protection / 重入攻击保护

**English:** Uses ReentrancyGuard to prevent reentrancy attacks during token creation.

**中文：** 使用 ReentrancyGuard 防止代币创建过程中的重入攻击。

## Bonding Curve Integration / 联合曲线集成

### Step-Based Curves / 阶梯式曲线

**English:** The factory validates and uses step-based bonding curves for predictable pricing.

**中文：** 工厂验证并使用阶梯式联合曲线进行可预测的定价。

**Example Steps Definition / 示例阶梯定义:**
```solidity
BondingCurveMath.BondStep[] memory steps = new BondingCurveMath.BondStep[](3);
steps[0] = BondingCurveMath.BondStep(1000 * 10**18, 1 * 10**18);    // 0-1000: 1 unit
steps[1] = BondingCurveMath.BondStep(5000 * 10**18, 2 * 10**18);    // 1001-5000: 2 units  
steps[2] = BondingCurveMath.BondStep(10000 * 10**18, 5 * 10**18);   // 5001-10000: 5 units
```

### Maximum Supply Calculation / 最大供应量计算

**English:** Automatically calculates maximum supply from the final step.

**中文：** 从最终阶梯自动计算最大供应量。

```solidity
uint256 maxSupply = BondingCurveMath.getMaxSupply(steps);
```

## Usage Examples / 使用示例

### Basic Token Creation / 基本代币创建

```solidity
// English: Create a bonding token for an NFT collection
// 中文: 为 NFT 集合创建联合代币

contract TokenCreator {
    IERC20Factory public erc20Factory;
    
    constructor(address factoryAddress) {
        erc20Factory = IERC20Factory(factoryAddress);
    }
    
    function createBondingToken(
        address nftCollection,
        address reserveToken
    ) external payable {
        // Define bonding curve steps
        BondingCurveMath.BondStep[] memory steps = new BondingCurveMath.BondStep[](3);
        steps[0] = BondingCurveMath.BondStep(1000 * 10**18, 1 * 10**18);
        steps[1] = BondingCurveMath.BondStep(5000 * 10**18, 2 * 10**18);
        steps[2] = BondingCurveMath.BondStep(10000 * 10**18, 5 * 10**18);
        
        uint256 creationFee = erc20Factory.creationFee();
        
        address token = erc20Factory.createToken{value: creationFee}(
            "My Bonding Token",      // name
            "MBT",                   // symbol
            nftCollection,           // NFT collection
            reserveToken,            // reserve token
            steps,                   // bonding curve steps
            250,                     // 2.5% mint royalty
            150                      // 1.5% burn royalty
        );
        
        emit TokenCreated(token, nftCollection);
    }
    
    event TokenCreated(address indexed token, address indexed nftCollection);
}
```

### ETH Reserve Token / ETH 储备代币

```solidity
// English: Create bonding token with ETH as reserve
// 中文: 创建以 ETH 为储备的联合代币

function createETHBondingToken(address nftCollection) external payable {
    BondingCurveMath.BondStep[] memory steps = new BondingCurveMath.BondStep[](2);
    steps[0] = BondingCurveMath.BondStep(5000 * 10**18, 0.001 ether);   // 0-5000: 0.001 ETH
    steps[1] = BondingCurveMath.BondStep(10000 * 10**18, 0.002 ether);  // 5001-10000: 0.002 ETH
    
    address token = erc20Factory.createToken{value: erc20Factory.creationFee()}(
        "ETH Bonding Token",
        "ETHBT",
        nftCollection,
        address(0),              // ETH as reserve token
        steps,
        300,                     // 3% mint royalty
        200                      // 2% burn royalty
    );
}
```

### Querying Factory Data / 查询工厂数据

```solidity
// English: Query factory for token information
// 中文: 查询工厂获取代币信息

contract FactoryBrowser {
    function browseTokens(
        address factory,
        uint256 page,
        uint256 pageSize
    ) external view returns (
        address[] memory tokens,
        uint256 totalCount
    ) {
        IERC20Factory erc20Factory = IERC20Factory(factory);
        
        totalCount = erc20Factory.getTokenCount();
        uint256 offset = page * pageSize;
        
        tokens = erc20Factory.getTokens(offset, pageSize);
    }
    
    function getTokenDetails(
        address factory,
        address token
    ) external view returns (
        address creator,
        address nftCollection,
        address reserveToken,
        uint256 maxSupply,
        uint16 mintRoyalty,
        uint16 burnRoyalty
    ) {
        IERC20Factory erc20Factory = IERC20Factory(factory);
        
        (creator, nftCollection, reserveToken, maxSupply, mintRoyalty, burnRoyalty, ) = 
            erc20Factory.getTokenInfo(token);
    }
    
    function findTokenForCollection(
        address factory,
        address nftCollection
    ) external view returns (address token) {
        IERC20Factory erc20Factory = IERC20Factory(factory);
        return erc20Factory.getTokenForNFTCollection(nftCollection);
    }
}
```

### Integration with Staking / 与质押集成

```solidity
// English: Complete workflow from NFT collection to staking
// 中文: 从 NFT 集合到质押的完整工作流程

contract EcosystemSetup {
    IERC20Factory public erc20Factory;
    IStakingFactory public stakingFactory;
    
    function setupCompleteEcosystem(
        address nftCollection,
        address reserveToken
    ) external payable returns (
        address bondingToken,
        address stakingPool
    ) {
        // 1. Create bonding token
        BondingCurveMath.BondStep[] memory steps = new BondingCurveMath.BondStep[](2);
        steps[0] = BondingCurveMath.BondStep(5000 * 10**18, 1 * 10**18);
        steps[1] = BondingCurveMath.BondStep(10000 * 10**18, 2 * 10**18);
        
        uint256 tokenCreationFee = erc20Factory.creationFee();
        bondingToken = erc20Factory.createToken{value: tokenCreationFee}(
            "Ecosystem Token",
            "ECO",
            nftCollection,
            reserveToken,
            steps,
            250,  // 2.5% mint royalty
            150   // 1.5% burn royalty
        );
        
        // 2. Create staking pool
        uint256 poolCreationFee = stakingFactory.creationFee();
        stakingPool = stakingFactory.createPool{value: poolCreationFee}(
            bondingToken,
            reserveToken    // Same token for rewards
        );
        
        // 3. Link NFT collection to staking pool
        INFTCollection(nftCollection).setStakingPool(stakingPool);
        
        return (bondingToken, stakingPool);
    }
}
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:**
1. Check creation fee before showing token creation UI
2. Validate NFT collection ownership before allowing creation
3. Provide bonding curve configuration tools
4. Display token statistics and performance metrics
5. Handle creation fee refunds properly

**中文:**
1. 显示代币创建 UI 前检查创建费用
2. 允许创建前验证 NFT 集合所有权
3. 提供联合曲线配置工具
4. 显示代币统计信息和性能指标
5. 正确处理创建费用退款

### For Smart Contract Integration / 智能合约集成

**English:**
1. Always validate token addresses using `isValidToken()`
2. Listen for `TokenCreated` events for real-time updates
3. Implement proper error handling for custom errors
4. Use factory queries for token discovery

**中文:**
1. 始终使用 `isValidToken()` 验证代币地址
2. 监听 `TokenCreated` 事件进行实时更新
3. 为自定义错误实现适当的错误处理
4. 使用工厂查询进行代币发现

### For Backend Services / 后端服务

**English:**
1. Index `TokenCreated` events for database updates
2. Monitor bonding curve performance and trading activity
3. Track royalty payments and fee distributions
4. Implement comprehensive analytics and reporting

**中文:**
1. 索引 `TokenCreated` 事件进行数据库更新
2. 监控联合曲线性能和交易活动
3. 跟踪版税支付和费用分发
4. 实施全面的分析和报告

## Best Practices / 最佳实践

### 1. Bonding Curve Design / 联合曲线设计

**English:** Design curves that provide fair pricing and adequate liquidity across all price ranges.

**中文：** 设计在所有价格范围内提供公平定价和充足流动性的曲线。

### 2. Royalty Management / 版税管理

**English:** Set reasonable royalty rates that balance creator incentives with user adoption.

**中文：** 设置合理的版税率，平衡创建者激励和用户采用。

### 3. Reserve Token Selection / 储备代币选择

**English:** Choose stable, liquid reserve tokens for better user experience.

**中文：** 选择稳定、流动的储备代币以获得更好的用户体验。

### 4. Gas Optimization / Gas 优化

**English:** Use the clone pattern and efficient storage structures to minimize deployment costs.

**中文：** 使用克隆模式和高效存储结构以最小化部署成本。

### 5. Security Considerations / 安全考虑

**English:** Implement comprehensive validation and access controls to prevent misuse.

**中文：** 实施全面验证和访问控制以防止滥用。

## Gas Optimization Features / Gas 优化功能

### 1. Clone Pattern / 克隆模式

**English:** Significantly reduces deployment costs compared to full contract deployment.

**中文：** 与完整合约部署相比显著降低部署成本。

### 2. Efficient Storage / 高效存储

**English:** Uses packed structs and optimized mappings for gas-efficient operations.

**中文：** 使用打包结构体和优化映射进行 gas 高效操作。

### 3. Batch Operations / 批量操作

**English:** Supports efficient querying with built-in pagination.

**中文：** 支持具有内置分页的高效查询。

## Monitoring and Analytics / 监控和分析

### Key Metrics to Track / 要跟踪的关键指标

**English:**
- Total tokens created
- Active tokens and trading volume
- Royalty distributions
- Creator adoption rates
- Gas costs and efficiency

**中文:**
- 已创建的总代币数
- 活跃代币和交易量
- 版税分发
- 创建者采用率
- Gas 成本和效率

### Event-Based Monitoring / 基于事件的监控

**English:** Use events for real-time monitoring and analytics:

**中文：** 使用事件进行实时监控和分析：

```solidity
// Monitor token creation
event TokenCreated(...);

// Monitor fee updates
event CreationFeeUpdated(uint256 newFee);
``` 