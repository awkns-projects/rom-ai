# StakingFactory Smart Contract Documentation
# StakingFactory 智能合约文档

## Overview / 概述

**English:** The StakingFactory is a factory contract for creating staking pools for ERC20 bonding tokens. It manages the deployment of staking pools that allow users to stake bonding tokens and earn rewards from NFT mint revenue.

**中文：** StakingFactory 是为 ERC20 联合代币创建质押池的工厂合约。它管理质押池的部署，允许用户质押联合代币并从 NFT 铸造收入中获得奖励。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** Ownable, ReentrancyGuard
- **Dependencies:** Clones (OpenZeppelin), SafeERC20

## Key Features / 主要功能

### 1. Pool Creation / 池创建

**English:** Creates staking pools for bonding tokens with configurable reward mechanisms.

**中文：** 为联合代币创建具有可配置奖励机制的质押池。

### 2. Access Control / 访问控制

**English:** Only the creator of a bonding token can create a staking pool for it.

**中文：** 只有联合代币的创建者才能为其创建质押池。

### 3. Protocol Fee Management / 协议费用管理

**English:** Implements configurable protocol fees on staking rewards.

**中文：** 在质押奖励上实施可配置的协议费用。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `STAKING_POOL_IMPLEMENTATION` | address | Staking pool implementation contract / 质押池实现合约 |
| `ERC20_FACTORY` | address | ERC20Factory contract address / ERC20Factory 合约地址 |
| `creationFee` | uint256 | Fee to create a staking pool / 创建质押池的费用 |
| `protocolFeeRecipient` | address | Protocol fee recipient / 协议费用接收者 |
| `protocolFeeBps` | uint256 | Protocol fee in basis points / 协议费用（基点） |
| `pools` | address[] | Array of created pools / 已创建池的数组 |
| `poolInfo` | mapping | Pool information mapping / 池信息映射 |
| `tokenToPool` | mapping | Bonding token to pool mapping / 联合代币到池的映射 |
| `poolExists` | mapping | Pool existence checker / 池存在检查器 |

## Core Functions / 核心函数

### Constructor

**English:** Initializes the factory with implementation addresses and fee settings.

**中文：** 使用实现地址和费用设置初始化工厂。

```solidity
constructor(
    address stakingPoolImplementation,
    address erc20Factory,
    uint256 initialCreationFee,
    address protocolFeeRecipient_,
    uint256 protocolFeeBps_,
    address owner
) Ownable(owner)
```

**Parameters / 参数:**
- `stakingPoolImplementation`: Implementation contract for staking pools / 质押池的实现合约
- `erc20Factory`: ERC20Factory contract address / ERC20Factory 合约地址
- `initialCreationFee`: Initial fee for creating pools / 创建池的初始费用
- `protocolFeeRecipient_`: Address to receive protocol fees / 接收协议费用的地址
- `protocolFeeBps_`: Protocol fee in basis points / 协议费用（基点）
- `owner`: Owner of the factory / 工厂的所有者

### createPool()

**English:** Creates a new staking pool for a bonding token with specified reward token.

**中文：** 为联合代币创建具有指定奖励代币的新质押池。

```solidity
function createPool(
    address stakingToken,
    address rewardToken
) external payable nonReentrant returns (address pool)
```

**Parameters / 参数:**
- `stakingToken`: The bonding token to stake / 要质押的联合代币
- `rewardToken`: The token used for rewards (address(0) for ETH) / 用于奖励的代币（ETH 为 address(0)）

**Returns / 返回:**
- `pool`: The address of the created staking pool / 创建的质押池地址

**Process Flow / 流程:**

1. **Validation / 验证:**
   ```solidity
   // Verify caller and token validity
   if (msg.sender == address(0)) revert StakingFactory__InvalidCreator();
   if (stakingToken == address(0)) revert StakingFactory__InvalidToken();
   if (tokenToPool[stakingToken] != address(0)) revert StakingFactory__PoolAlreadyExists();
   ```

2. **Authorization Check / 授权检查:**
   ```solidity
   // Verify the staking token was created by our ERC20Factory
   if (!IERC20Factory(ERC20_FACTORY).isValidToken(stakingToken)) {
       revert StakingFactory__InvalidToken();
   }
   
   // Verify caller is the creator of the bonding token
   (address creator, , , , , ,) = IERC20Factory(ERC20_FACTORY).tokenInfo(stakingToken);
   if (creator != msg.sender) revert StakingFactory__Unauthorized();
   ```

3. **Fee Handling / 费用处理:**
   ```solidity
   if (creationFee > 0) {
       if (msg.value < creationFee) revert StakingFactory__InvalidCreationFee();
       
       (bool success, ) = owner().call{value: creationFee}("");
       if (!success) revert StakingFactory__CreationFeeTransferFailed();
   }
   
   // Refund excess ETH
   if (msg.value > creationFee) {
       (bool success, ) = msg.sender.call{value: msg.value - creationFee}("");
       require(success, "Refund failed");
   }
   ```

4. **Pool Deployment / 池部署:**
   ```solidity
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
   ```

## Administrative Functions / 管理函数

### updateCreationFee()

**English:** Updates the fee required to create new staking pools (owner only).

**中文：** 更新创建新质押池所需的费用（仅所有者）。

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

### getPoolCount()

**English:** Returns the total number of pools created.

**中文：** 返回已创建池的总数。

```solidity
function getPoolCount() external view returns (uint256)
```

### getPools()

**English:** Returns pools with pagination support.

**中文：** 返回具有分页支持的池。

```solidity
function getPools(
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

**Parameters / 参数:**
- `offset`: Starting index / 起始索引
- `limit`: Number of pools to return / 要返回的池数量

### getPoolForToken()

**English:** Gets the staking pool address for a specific bonding token.

**中文：** 获取特定联合代币的质押池地址。

```solidity
function getPoolForToken(address stakingToken) external view returns (address)
```

### isValidPool()

**English:** Checks if a pool was created by this factory.

**中文：** 检查池是否由此工厂创建。

```solidity
function isValidPool(address pool) external view returns (bool)
```

### getPoolsByCreator()

**English:** Gets pools created by a specific creator with pagination.

**中文：** 获取特定创建者创建的池，具有分页功能。

```solidity
function getPoolsByCreator(
    address creator,
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

## Data Structures / 数据结构

### PoolInfo Struct

```solidity
struct PoolInfo {
    address creator;        // Pool creator / 池创建者
    address stakingToken;   // Bonding token being staked / 被质押的联合代币
    address nftCollection;  // Associated NFT collection / 关联的 NFT 集合
    address rewardToken;    // Reward token / 奖励代币
    bool exists;           // Pool existence flag / 池存在标志
}
```

## Events / 事件

### PoolCreated

**English:** Emitted when a new staking pool is created.

**中文：** 创建新质押池时发出。

```solidity
event PoolCreated(
    address indexed pool,           // Created pool address / 创建的池地址
    address indexed creator,        // Pool creator / 池创建者
    address indexed stakingToken,   // Staking token / 质押代币
    address nftCollection,          // NFT collection / NFT 集合
    address rewardToken            // Reward token / 奖励代币
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
error StakingFactory__InvalidImplementation();    // Invalid implementation address / 无效实现地址
error StakingFactory__InvalidCreator();          // Invalid creator address / 无效创建者地址
error StakingFactory__InvalidToken();            // Invalid token address / 无效代币地址
error StakingFactory__InvalidERC20Factory();     // Invalid ERC20Factory address / 无效 ERC20Factory 地址
error StakingFactory__PoolAlreadyExists();       // Pool already exists for token / 代币已存在池
error StakingFactory__PoolNotFound();            // Pool not found / 未找到池
error StakingFactory__CreationFeeTransferFailed(); // Fee transfer failed / 费用转账失败
error StakingFactory__InvalidCreationFee();      // Invalid creation fee sent / 发送的创建费用无效
error StakingFactory__Unauthorized();            // Unauthorized access / 未授权访问
error StakingFactory__InvalidRewardToken();      // Invalid reward token / 无效奖励代币
```

## Integration Workflow / 集成工作流

### 1. Token Creation to Pool Setup / 从代币创建到池设置

```solidity
// Step 1: Create bonding token via ERC20Factory
// 步骤 1: 通过 ERC20Factory 创建联合代币
address bondingToken = erc20Factory.createToken(...);

// Step 2: Create staking pool for the token
// 步骤 2: 为代币创建质押池
address stakingPool = stakingFactory.createPool{value: creationFee}(
    bondingToken,
    rewardToken
);

// Step 3: Set staking pool in NFT collection (manual step)
// 步骤 3: 在 NFT 集合中设置质押池（手动步骤）
nftCollection.setStakingPool(stakingPool);
```

### 2. Pool Discovery / 池发现

```solidity
// Find pool for a specific token
// 查找特定代币的池
address pool = stakingFactory.getPoolForToken(bondingToken);

// Get all pools by creator
// 获取创建者的所有池
address[] memory creatorPools = stakingFactory.getPoolsByCreator(
    creator,
    0,  // offset
    10  // limit
);
```

## Security Features / 安全功能

### 1. Access Control / 访问控制

**English:** Only bonding token creators can create staking pools for their tokens.

**中文：** 只有联合代币创建者才能为其代币创建质押池。

```solidity
// Verify caller is the creator of the bonding token
(address creator, , , , , ,) = IERC20Factory(ERC20_FACTORY).tokenInfo(stakingToken);
if (creator != msg.sender) revert StakingFactory__Unauthorized();
```

### 2. Token Validation / 代币验证

**English:** Only tokens created by the authorized ERC20Factory can have staking pools.

**中文：** 只有由授权的 ERC20Factory 创建的代币才能拥有质押池。

```solidity
if (!IERC20Factory(ERC20_FACTORY).isValidToken(stakingToken)) {
    revert StakingFactory__InvalidToken();
}
```

### 3. Duplicate Prevention / 重复防护

**English:** Prevents multiple staking pools for the same bonding token.

**中文：** 防止为同一联合代币创建多个质押池。

```solidity
if (tokenToPool[stakingToken] != address(0)) {
    revert StakingFactory__PoolAlreadyExists();
}
```

### 4. Reentrancy Protection / 重入攻击保护

**English:** Uses ReentrancyGuard to prevent reentrancy attacks during pool creation.

**中文：** 使用 ReentrancyGuard 防止池创建过程中的重入攻击。

## Gas Optimization Features / Gas 优化功能

### 1. Clone Pattern / 克隆模式

**English:** Uses OpenZeppelin's Clones library for efficient pool deployment.

**中文：** 使用 OpenZeppelin 的 Clones 库进行高效的池部署。

```solidity
pool = Clones.clone(STAKING_POOL_IMPLEMENTATION);
```

**Benefits / 优势:**
- Reduced deployment costs / 降低部署成本
- Consistent implementation / 一致的实现
- Upgradeable pattern support / 支持可升级模式

### 2. Efficient Storage / 高效存储

**English:** Uses mappings for O(1) lookups and packed structs for gas efficiency.

**中文：** 使用映射进行 O(1) 查找，使用打包结构体提高 gas 效率。

## Usage Examples / 使用示例

### Creating a Staking Pool / 创建质押池

```solidity
// English: Create a staking pool for a bonding token
// 中文: 为联合代币创建质押池

// Assume we have a bonding token already created
address bondingToken = 0x1234...;
address rewardToken = address(0); // Use ETH as reward token

// Get creation fee
uint256 creationFee = stakingFactory.creationFee();

// Create the pool (must be called by token creator)
address newPool = stakingFactory.createPool{value: creationFee}(
    bondingToken,
    rewardToken
);

// The pool is now ready for staking
console.log("Created staking pool:", newPool);
```

### Querying Pool Information / 查询池信息

```solidity
// English: Query pool information
// 中文: 查询池信息

// Check if a pool exists for a token
address poolAddress = stakingFactory.getPoolForToken(bondingToken);
if (poolAddress != address(0)) {
    // Pool exists, get its information
    (
        address creator,
        address stakingToken,
        address nftCollection,
        address rewardToken,
        bool exists
    ) = stakingFactory.poolInfo(poolAddress);
    
    console.log("Pool creator:", creator);
    console.log("Staking token:", stakingToken);
    console.log("NFT collection:", nftCollection);
    console.log("Reward token:", rewardToken);
}
```

### Administrative Operations / 管理操作

```solidity
// English: Update factory settings (owner only)
// 中文: 更新工厂设置（仅所有者）

// Update creation fee
stakingFactory.updateCreationFee(0.01 ether);

// Update protocol fee (max 10%)
stakingFactory.updateProtocolFeeBps(500); // 5%

// Update protocol fee recipient
stakingFactory.updateProtocolFeeRecipient(newRecipient);
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:**
1. Check creation fee before showing pool creation UI
2. Verify user is the token creator before allowing pool creation
3. Handle ETH refunds properly for overpayment
4. Display pool statistics using view functions
5. Implement pagination for pool listings

**中文:**
1. 显示池创建 UI 前检查创建费用
2. 允许池创建前验证用户是代币创建者
3. 正确处理超额支付的 ETH 退款
4. 使用查询函数显示池统计信息
5. 为池列表实现分页功能

### For Smart Contract Integration / 智能合约集成

**English:**
1. Validate pool addresses using `isValidPool()`
2. Listen for `PoolCreated` events for real-time updates
3. Use proper error handling for all custom errors
4. Implement proper access control in dependent contracts

**中文:**
1. 使用 `isValidPool()` 验证池地址
2. 监听 `PoolCreated` 事件进行实时更新
3. 为所有自定义错误使用适当的错误处理
4. 在依赖合约中实现适当的访问控制

## Best Practices / 最佳实践

### 1. Pool Management / 池管理

**English:** Always verify pool authenticity before interacting with it.

**中文：** 与池交互前始终验证池的真实性。

### 2. Fee Handling / 费用处理

**English:** Send exact creation fee amounts to avoid unnecessary gas costs for refunds.

**中文：** 发送准确的创建费用金额以避免退款的不必要 gas 成本。

### 3. Event Monitoring / 事件监控

**English:** Monitor factory events to track pool creation and configuration changes.

**中文：** 监控工厂事件以跟踪池创建和配置更改。

### 4. Error Recovery / 错误恢复

**English:** Implement proper error handling for failed pool creation attempts.

**中文：** 为失败的池创建尝试实现适当的错误处理。 