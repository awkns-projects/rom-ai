# NFTCollection Smart Contract Documentation
# NFTCollection 智能合约文档

## Overview / 概述

**English:** The NFTCollection is an ERC721 collection with custom pricing and revenue tracking for staking rewards. It automatically distributes mint revenue to associated staking pools, creating a revenue-sharing ecosystem for NFT holders and token stakers.

**中文：** NFTCollection 是一个具有自定义定价和收入跟踪功能的 ERC721 集合，用于质押奖励。它自动将铸造收入分发给关联的质押池，为 NFT 持有者和代币质押者创建收入分享生态系统。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** ERC721, ReentrancyGuard
- **Dependencies:** SafeERC20, OpenZeppelin Strings

## Key Features / 主要功能

### 1. Revenue Distribution / 收入分发

**English:** Automatically distributes mint revenue to staking pools for token stakers to earn rewards.

**中文：** 自动将铸造收入分发给质押池，让代币质押者获得奖励。

### 2. Multi-Currency Support / 多货币支持

**English:** Supports both ETH and ERC20 tokens as payment methods for minting.

**中文：** 支持 ETH 和 ERC20 代币作为铸造的支付方式。

### 3. Protocol Fee System / 协议费用系统

**English:** Implements configurable protocol fees on mint revenue.

**中文：** 在铸造收入上实施可配置的协议费用。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `creator` | address | Collection creator / 集合创建者 |
| `paymentToken` | address | Payment token (address(0) for ETH) / 支付代币（ETH 为 address(0)） |
| `mintPrice` | uint256 | Price per NFT / 每个 NFT 的价格 |
| `maxSupply` | uint256 | Maximum supply of NFTs / NFT 的最大供应量 |
| `totalSupply` | uint256 | Current total supply / 当前总供应量 |
| `stakingPool` | address | Associated staking pool / 关联的质押池 |
| `totalRevenue` | uint256 | Total revenue generated / 产生的总收入 |
| `distributedRevenue` | uint256 | Revenue distributed to staking / 分发给质押的收入 |
| `protocolFeeRecipient` | address | Protocol fee recipient / 协议费用接收者 |
| `protocolFeeBps` | uint256 | Protocol fee in basis points / 协议费用（基点） |

## Constants / 常量

```solidity
address public constant ETH_ADDRESS = address(0);
```

## Core Functions / 核心函数

### initialize()

**English:** Initializes the NFT collection with metadata and pricing parameters.

**中文：** 使用元数据和定价参数初始化 NFT 集合。

```solidity
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
) external
```

**Parameters / 参数:**
- `name_`: Collection name / 集合名称
- `symbol_`: Collection symbol / 集合符号
- `baseURI_`: Base URI for metadata / 元数据的基础 URI
- `creator_`: Collection creator / 集合创建者
- `paymentToken_`: Payment token address / 支付代币地址
- `mintPrice_`: Price per NFT / 每个 NFT 的价格
- `maxSupply_`: Maximum supply / 最大供应量
- `protocolFeeRecipient_`: Protocol fee recipient / 协议费用接收者
- `protocolFeeBps_`: Protocol fee in basis points / 协议费用（基点）

### mint()

**English:** Mints NFTs to a specified address with automatic revenue distribution.

**中文：** 向指定地址铸造 NFT 并自动分发收入。

```solidity
function mint(address to, uint256 amount) external payable nonReentrant
```

**Parameters / 参数:**
- `to`: Recipient address / 接收者地址
- `amount`: Number of NFTs to mint / 要铸造的 NFT 数量

**Process Flow / 流程:**

1. **Validation / 验证:**
   ```solidity
   if (to == address(0)) revert NFTCollection__InvalidReceiver();
   if (amount == 0) revert NFTCollection__InvalidAmount();
   if (totalSupply + amount > maxSupply) revert NFTCollection__MaxSupplyReached();
   ```

2. **Cost Calculation / 成本计算:**
   ```solidity
   uint256 totalCost = mintPrice * amount;
   uint256 protocolFee = (totalCost * protocolFeeBps) / 10000;
   uint256 netRevenue = totalCost - protocolFee;
   ```

3. **Payment Handling / 支付处理:**

   **For ETH Payments / ETH 支付:**
   ```solidity
   if (paymentToken == ETH_ADDRESS) {
       if (msg.value < totalCost) revert NFTCollection__InsufficientPayment();
       
       // Pay protocol fee
       if (protocolFee > 0) {
           (bool success, ) = protocolFeeRecipient.call{value: protocolFee}("");
           require(success, "Protocol fee transfer failed");
       }
       
       // Refund excess ETH
       if (msg.value > totalCost) {
           (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
           require(success, "Refund failed");
       }
   }
   ```

   **For ERC20 Payments / ERC20 支付:**
   ```solidity
   else {
       IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), totalCost);
       
       // Pay protocol fee
       if (protocolFee > 0) {
           IERC20(paymentToken).safeTransfer(protocolFeeRecipient, protocolFee);
       }
   }
   ```

4. **Revenue Tracking / 收入跟踪:**
   ```solidity
   totalRevenue += netRevenue;
   ```

5. **NFT Minting / NFT 铸造:**
   ```solidity
   for (uint256 i = 0; i < amount; i++) {
       uint256 tokenId = totalSupply + 1;
       totalSupply++;
       _mint(to, tokenId);
       emit Minted(to, tokenId, mintPrice);
   }
   ```

6. **Revenue Distribution / 收入分发:**
   ```solidity
   if (stakingPool != address(0)) {
       _distributeRevenue();
   }
   ```

## Revenue Distribution System / 收入分发系统

### Mathematical Model / 数学模型

**Formula / 公式:**
```
Total Cost = Mint Price × Amount
总成本 = 铸造价格 × 数量

Protocol Fee = Total Cost × Protocol Fee BPS ÷ 10000
协议费用 = 总成本 × 协议费用基点 ÷ 10000

Net Revenue = Total Cost - Protocol Fee
净收入 = 总成本 - 协议费用

Pending Revenue = Total Revenue - Distributed Revenue
待分发收入 = 总收入 - 已分发收入
```

### setStakingPool()

**English:** Sets the staking pool address and distributes any accumulated revenue (creator only).

**中文：** 设置质押池地址并分发任何累积的收入（仅创建者）。

```solidity
function setStakingPool(address stakingPool_) external
```

**Access Control / 访问控制:**
```solidity
if (msg.sender != creator) revert NFTCollection__Unauthorized();
```

**Automatic Distribution / 自动分发:**
```solidity
stakingPool = stakingPool_;
emit StakingPoolSet(stakingPool_);

// Distribute any accumulated revenue
if (stakingPool_ != address(0) && totalRevenue > distributedRevenue) {
    _distributeRevenue();
}
```

### setStakingPoolByFactory()

**English:** Allows factory to set staking pool on behalf of creator.

**中文：** 允许工厂代表创建者设置质押池。

```solidity
function setStakingPoolByFactory(address creator_, address stakingPool_) external
```

### distributeRevenue()

**English:** Manually triggers revenue distribution to the staking pool.

**中文：** 手动触发向质押池分发收入。

```solidity
function distributeRevenue() external
```

### _distributeRevenue()

**English:** Internal function that handles the actual revenue distribution.

**中文：** 处理实际收入分发的内部函数。

```solidity
function _distributeRevenue() internal
```

**Process / 过程:**

1. **Calculate Pending Revenue / 计算待分发收入:**
   ```solidity
   uint256 pendingRevenueAmount = totalRevenue - distributedRevenue;
   if (pendingRevenueAmount == 0) return;
   ```

2. **Update Distributed Amount / 更新已分发金额:**
   ```solidity
   distributedRevenue = totalRevenue;
   ```

3. **Transfer to Staking Pool / 转账给质押池:**

   **For ETH / ETH:**
   ```solidity
   if (paymentToken == ETH_ADDRESS) {
       (bool success, ) = stakingPool.call{value: pendingRevenueAmount}("");
       require(success, "Revenue transfer failed");
   }
   ```

   **For ERC20 / ERC20:**
   ```solidity
   else {
       IERC20(paymentToken).safeTransfer(stakingPool, pendingRevenueAmount);
   }
   ```

4. **Notify Staking Pool / 通知质押池:**
   ```solidity
   IStakingPool(stakingPool).notifyRewardAmount(pendingRevenueAmount);
   emit RevenueDistributed(pendingRevenueAmount);
   ```

## Metadata Management / 元数据管理

### tokenURI()

**English:** Returns the metadata URI for a specific token ID.

**中文：** 返回特定代币 ID 的元数据 URI。

```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory)
```

**Implementation / 实现:**
```solidity
require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");

string memory baseURI = _baseURI();
return bytes(baseURI).length > 0 
    ? string(abi.encodePacked(baseURI, tokenId.toString()))
    : "";
```

### setBaseURI()

**English:** Updates the base URI for token metadata (creator only).

**中文：** 更新代币元数据的基础 URI（仅创建者）。

```solidity
function setBaseURI(string calldata newBaseURI) external
```

**Access Control / 访问控制:**
```solidity
if (msg.sender != creator) revert NFTCollection__Unauthorized();
```

## Emergency Functions / 紧急函数

### emergencyWithdraw()

**English:** Emergency withdrawal of revenue (creator only, only if no staking pool is set).

**中文：** 紧急提取收入（仅创建者，仅在未设置质押池时）。

```solidity
function emergencyWithdraw() external
```

**Restrictions / 限制:**
```solidity
if (msg.sender != creator) revert NFTCollection__Unauthorized();
if (stakingPool != address(0)) revert NFTCollection__Unauthorized();
```

**Withdrawal Process / 提取过程:**
```solidity
uint256 withdrawAmount = totalRevenue - distributedRevenue;
if (withdrawAmount == 0) return;

if (paymentToken == ETH_ADDRESS) {
    (bool success, ) = creator.call{value: withdrawAmount}("");
    require(success, "Withdrawal failed");
} else {
    IERC20(paymentToken).safeTransfer(creator, withdrawAmount);
}

distributedRevenue = totalRevenue;
```

## View Functions / 查询函数

### pendingRevenue()

**English:** Returns the amount of revenue pending distribution.

**中文：** 返回待分发的收入金额。

```solidity
function pendingRevenue() external view returns (uint256)
```

**Implementation / 实现:**
```solidity
return totalRevenue - distributedRevenue;
```

### getCollectionStats()

**English:** Returns comprehensive collection statistics for UI display.

**中文：** 返回用于 UI 显示的全面集合统计信息。

```solidity
function getCollectionStats() external view returns (
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
```

**Return Values / 返回值:**
```solidity
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
```

## Events / 事件

```solidity
event Minted(address indexed to, uint256 indexed tokenId, uint256 price);
event StakingPoolSet(address indexed stakingPool);
event RevenueDistributed(uint256 amount);
event ProtocolFeePaid(uint256 amount);
```

## Error Handling / 错误处理

### Custom Errors / 自定义错误

```solidity
error NFTCollection__AlreadyInitialized();        // Collection already initialized / 集合已初始化
error NFTCollection__InvalidCreator();            // Invalid creator address / 无效创建者地址
error NFTCollection__InvalidPaymentToken();       // Invalid payment token / 无效支付代币
error NFTCollection__InvalidPrice();              // Invalid price / 无效价格
error NFTCollection__InvalidMaxSupply();          // Invalid max supply / 无效最大供应量
error NFTCollection__MaxSupplyReached();          // Max supply reached / 达到最大供应量
error NFTCollection__InsufficientPayment();       // Insufficient payment / 支付不足
error NFTCollection__PaymentFailed();             // Payment failed / 支付失败
error NFTCollection__InvalidAmount();             // Invalid amount / 无效数量
error NFTCollection__InvalidReceiver();           // Invalid receiver / 无效接收者
error NFTCollection__Unauthorized();              // Unauthorized access / 未授权访问
error NFTCollection__NoStakingPool();             // No staking pool set / 未设置质押池
error NFTCollection__ProtocolFeeTransferFailed(); // Protocol fee transfer failed / 协议费用转账失败
```

## Security Features / 安全功能

### 1. Reentrancy Protection / 重入攻击保护

**English:** Uses ReentrancyGuard for the mint function to prevent reentrancy attacks.

**中文：** 为铸造函数使用 ReentrancyGuard 防止重入攻击。

### 2. Access Control / 访问控制

**English:** Only the creator can set staking pools and update metadata.

**中文：** 只有创建者才能设置质押池和更新元数据。

### 3. Payment Validation / 支付验证

**English:** Strict validation of payment amounts and automatic refunds for overpayment.

**中文：** 严格验证支付金额并为超额支付自动退款。

### 4. Supply Limits / 供应量限制

**English:** Enforces maximum supply limits to prevent over-minting.

**中文：** 强制执行最大供应量限制以防止过度铸造。

## Integration Examples / 集成示例

### Basic Minting / 基本铸造

```solidity
// English: Mint NFTs with ETH
// 中文: 使用 ETH 铸造 NFT
contract MintingExample {
    function mintWithETH(address nftCollection, uint256 amount) external payable {
        // Calculate total cost
        uint256 mintPrice = INFTCollection(nftCollection).mintPrice();
        uint256 totalCost = mintPrice * amount;
        
        // Mint NFTs
        INFTCollection(nftCollection).mint{value: totalCost}(msg.sender, amount);
    }
    
    function mintWithERC20(
        address nftCollection, 
        address paymentToken,
        uint256 amount
    ) external {
        // Calculate total cost
        uint256 mintPrice = INFTCollection(nftCollection).mintPrice();
        uint256 totalCost = mintPrice * amount;
        
        // Approve payment token
        IERC20(paymentToken).approve(nftCollection, totalCost);
        
        // Mint NFTs
        INFTCollection(nftCollection).mint(msg.sender, amount);
    }
}
```

### Revenue Sharing Integration / 收入分享集成

```solidity
// English: Integration with staking pool
// 中文: 与质押池集成
contract RevenueExample {
    function setupRevenueSharing(
        address nftCollection,
        address stakingPool
    ) external {
        // Only creator can set staking pool
        INFTCollection(nftCollection).setStakingPool(stakingPool);
    }
    
    function checkRevenue(address nftCollection) external view returns (
        uint256 totalRevenue,
        uint256 distributedRevenue,
        uint256 pendingRevenue
    ) {
        (
            ,,,
            totalRevenue,
            distributedRevenue,
            pendingRevenue,
            ,,,,
        ) = INFTCollection(nftCollection).getCollectionStats();
    }
}
```

## Usage Examples / 使用示例

### Collection Creation Workflow / 集合创建工作流

```solidity
// English: Complete collection setup workflow
// 中文: 完整集合设置工作流

// 1. Deploy collection via NFTFactory
address collection = nftFactory.createCollection{value: creationFee}(
    "My NFT Collection",
    "MNC",
    "https://api.example.com/metadata/",
    address(0), // Use ETH as payment
    0.1 ether,  // 0.1 ETH per NFT
    1000        // Max supply: 1000 NFTs
);

// 2. Create staking pool for bonding token
address stakingPool = stakingFactory.createPool{value: poolCreationFee}(
    bondingToken,
    address(0) // Use ETH as rewards
);

// 3. Link collection to staking pool
INFTCollection(collection).setStakingPool(stakingPool);

// 4. Collection is now ready for minting with revenue sharing
```

### Minting and Revenue Flow / 铸造和收入流程

```solidity
// English: Minting triggers automatic revenue distribution
// 中文: 铸造触发自动收入分发

// User mints 5 NFTs at 0.1 ETH each = 0.5 ETH total
INFTCollection(collection).mint{value: 0.5 ether}(msg.sender, 5);

// Automatic process:
// 1. Protocol fee deducted (e.g., 2.5% = 0.0125 ETH)
// 2. Net revenue (0.4875 ETH) added to totalRevenue
// 3. Revenue automatically distributed to staking pool
// 4. Staking pool notified of new rewards
// 5. Stakers can now claim proportional rewards
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:**
1. Check payment token type before showing payment UI
2. Display collection statistics using `getCollectionStats()`
3. Show pending revenue for transparency
4. Handle both ETH and ERC20 payment flows
5. Implement proper error handling for mint failures

**中文:**
1. 显示支付 UI 前检查支付代币类型
2. 使用 `getCollectionStats()` 显示集合统计信息
3. 显示待分发收入以保持透明度
4. 处理 ETH 和 ERC20 支付流程
5. 为铸造失败实现适当的错误处理

### For Smart Contract Integration / 智能合约集成

**English:**
1. Always check max supply before attempting to mint
2. Handle payment token approvals for ERC20 payments
3. Listen for `RevenueDistributed` events for analytics
4. Implement proper access control for admin functions

**中文:**
1. 尝试铸造前始终检查最大供应量
2. 处理 ERC20 支付的支付代币授权
3. 监听 `RevenueDistributed` 事件进行分析
4. 为管理函数实现适当的访问控制

## Gas Optimization Tips / Gas 优化建议

### 1. Batch Minting / 批量铸造

**English:** Mint multiple NFTs in a single transaction to reduce per-NFT gas costs.

**中文：** 在单个交易中铸造多个 NFT 以减少每个 NFT 的 gas 成本。

### 2. Revenue Distribution / 收入分发

**English:** Revenue distribution happens automatically during minting, no additional gas cost for users.

**中文：** 收入分发在铸造期间自动发生，用户无需额外 gas 成本。

### 3. Metadata Storage / 元数据存储

**English:** Uses efficient string concatenation for token URIs.

**中文：** 为代币 URI 使用高效的字符串连接。

## Best Practices / 最佳实践

### 1. Revenue Transparency / 收入透明度

**English:** Regularly check and display revenue statistics to maintain user trust.

**中文：** 定期检查和显示收入统计信息以维持用户信任。

### 2. Staking Pool Integration / 质押池集成

**English:** Set up staking pools early to maximize revenue sharing benefits.

**中文：** 尽早设置质押池以最大化收入分享收益。

### 3. Protocol Fee Management / 协议费用管理

**English:** Keep protocol fees reasonable to maintain collection attractiveness.

**中文：** 保持协议费用合理以维持集合吸引力。

### 4. Emergency Preparedness / 应急准备

**English:** Only use emergency withdraw as a last resort when staking pools are not functioning.

**中文：** 只有在质押池不工作时才将紧急提取作为最后手段。 