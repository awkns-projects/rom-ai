# BondingTokenETH Smart Contract Documentation
# BondingTokenETH 智能合约文档

## Overview / 概述

**English:** The BondingTokenETH is an enhanced bonding token that supports both ETH and ERC20 tokens as reserve currencies. It implements the same step-based bonding curve mechanism but with flexible payment options.

**中文：** BondingTokenETH 是一个增强的联合代币，支持 ETH 和 ERC20 代币作为储备货币。它实现了相同的阶梯式联合曲线机制，但具有灵活的支付选项。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** ERC20Initializable, ReentrancyGuard
- **Library Dependencies:** BondingCurveMath, SafeERC20

## Key Differences from BondingToken / 与 BondingToken 的主要区别

### 1. Multi-Currency Support / 多货币支持

**English:** Supports both ETH (address(0)) and ERC20 tokens as reserve currencies, unlike the standard BondingToken which only supports ERC20.

**中文：** 支持 ETH（address(0)）和 ERC20 代币作为储备货币，不像标准的 BondingToken 只支持 ERC20。

### 2. Enhanced Payment Handling / 增强的支付处理

**English:** Automatically detects payment method based on reserve token address and handles ETH transfers accordingly.

**中文：** 根据储备代币地址自动检测支付方式并相应地处理 ETH 转账。

### 3. Gas Optimization / Gas 优化

**English:** Uses custom ERC20Initializable for better gas efficiency in initialization.

**中文：** 使用自定义的 ERC20Initializable 在初始化时获得更好的 gas 效率。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `creator` | address | Token creator / 代币创建者 |
| `nftCollection` | address | Associated NFT collection / 关联的 NFT 集合 |
| `reserveToken` | address | Reserve token (address(0) for ETH) / 储备代币（ETH 为 address(0)） |
| `steps` | BondStep[] | Bonding curve steps / 联合曲线阶梯 |
| `reserveBalance` | uint256 | Current reserve balance / 当前储备余额 |
| `mintRoyalty` | uint16 | Mint royalty in basis points / 铸造版税（基点） |
| `burnRoyalty` | uint16 | Burn royalty in basis points / 销毁版税（基点） |
| `royaltyRecipient` | address | Royalty recipient / 版税接收者 |

## Constants / 常量

```solidity
address public constant ETH_ADDRESS = address(0);
uint256 public constant MAX_PRICE_HISTORY = 1000;
```

## Core Functions / 核心函数

### initialize()

**English:** Initializes the bonding token with enhanced validation for royalty rates.

**中文：** 初始化联合代币，对版税率进行增强验证。

```solidity
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
) external
```

**Enhanced Validation / 增强验证:**
- Maximum royalty: 10% (1000 basis points) / 最大版税：10%（1000 基点）
- Validates bonding curve steps / 验证联合曲线阶梯
- Supports ETH as reserve token / 支持 ETH 作为储备代币

### mint()

**English:** Mints tokens with automatic payment method detection based on reserve token type.

**中文：** 根据储备代币类型自动检测支付方式来铸造代币。

```solidity
function mint(
    uint256 tokensToMint,
    uint256 maxReserveAmount,
    address receiver
) external payable nonReentrant returns (uint256 reserveAmount)
```

**Payment Logic / 支付逻辑:**

**For ETH Payments / ETH 支付:**
```solidity
if (reserveToken == ETH_ADDRESS) {
    if (msg.value != reserveAmount) revert BondingTokenETH__InsufficientETH();
    // Handle ETH transfer and royalty payment
}
```

**For ERC20 Payments / ERC20 支付:**
```solidity
else {
    if (msg.value != 0) revert BondingTokenETH__UnexpectedETH();
    IERC20(reserveToken).safeTransferFrom(msg.sender, address(this), reserveAmount);
}
```

**Mathematical Formula / 数学公式:**
```
Total Cost = Bonding Curve Cost + Royalty
总成本 = 联合曲线成本 + 版税

Royalty = (Bonding Curve Cost × mintRoyalty) ÷ 10000
版税 = (联合曲线成本 × 铸造版税) ÷ 10000

Reserve Balance Update = Reserve Balance + Bonding Curve Cost
储备余额更新 = 储备余额 + 联合曲线成本
```

### burn()

**English:** Burns tokens with automatic refund method detection based on reserve token type.

**中文：** 根据储备代币类型自动检测退款方式来销毁代币。

```solidity
function burn(
    uint256 tokensToBurn,
    uint256 minRefund,
    address receiver
) external nonReentrant returns (uint256 refundAmount)
```

**Refund Logic / 退款逻辑:**

**For ETH Refunds / ETH 退款:**
```solidity
if (reserveToken == ETH_ADDRESS) {
    (bool success, ) = receiver.call{value: refundAmount}("");
    if (!success) revert BondingTokenETH__TransferFailed();
}
```

**For ERC20 Refunds / ERC20 退款:**
```solidity
else {
    IERC20(reserveToken).safeTransfer(receiver, refundAmount);
}
```

**Mathematical Formula / 数学公式:**
```
Net Refund = Bonding Curve Refund - Royalty
净退款 = 联合曲线退款 - 版税

Royalty = (Bonding Curve Refund × burnRoyalty) ÷ 10000
版税 = (联合曲线退款 × 销毁版税) ÷ 10000

Reserve Balance Update = Reserve Balance - Bonding Curve Refund
储备余额更新 = 储备余额 - 联合曲线退款
```

## View Functions / 查询函数

### getCurrentPrice()

**English:** Returns the current price per token based on total supply.

**中文：** 根据总供应量返回当前每个代币的价格。

```solidity
function getCurrentPrice() public view returns (uint256)
```

### getReserveForTokens()

**English:** Calculates the total reserve amount needed including royalty.

**中文：** 计算包括版税在内的所需总储备金额。

```solidity
function getReserveForTokens(uint256 tokensToMint) 
    external view returns (uint256 reserveAmount, uint256 royalty)
```

### getRefundForTokens()

**English:** Calculates the net refund amount after royalty deduction.

**中文：** 计算扣除版税后的净退款金额。

```solidity
function getRefundForTokens(uint256 tokensToBurn) 
    external view returns (uint256 refundAmount, uint256 royalty)
```

### getBondingCurveInfo()

**English:** Returns comprehensive bonding curve and reserve information.

**中文：** 返回全面的联合曲线和储备信息。

```solidity
function getBondingCurveInfo() external view returns (
    address nftCollection_,
    address reserveToken_,
    uint256 reserveBalance_,
    uint256 currentSupply,
    uint256 currentPrice,
    uint256 maxSupply_,
    uint16 mintRoyalty_,
    uint16 burnRoyalty_
)
```

## UI Support Features / UI 支持功能

### Token Holder Management / 代币持有者管理

**English:** Maintains an efficient list of active token holders with automatic cleanup.

**中文：** 维护活跃代币持有者的高效列表，具有自动清理功能。

```solidity
function getHolders(uint256 offset, uint256 limit) external view returns (address[] memory);
function getHolderCount() external view returns (uint256);
```

### Price History Tracking / 价格历史跟踪

**English:** Records price changes with circular buffer for memory efficiency.

**中文：** 使用循环缓冲区记录价格变化以提高内存效率。

```solidity
function getPriceHistory(uint256 offset, uint256 limit) external view returns (
    uint256[] memory timestamps,
    uint256[] memory prices,
    uint256[] memory supplies
);
function getPriceHistoryLength() external view returns (uint256);
```

## Enhanced Security Features / 增强安全功能

### 1. Payment Method Validation / 支付方式验证

**English:** Strict validation prevents mismatched payment methods.

**中文：** 严格验证防止支付方式不匹配。

```solidity
// For ETH payments
if (reserveToken == ETH_ADDRESS) {
    if (msg.value != reserveAmount) revert BondingTokenETH__InsufficientETH();
} else {
    // For ERC20 payments
    if (msg.value != 0) revert BondingTokenETH__UnexpectedETH();
}
```

### 2. Enhanced Transfer Safety / 增强转账安全

**English:** Uses low-level calls for ETH transfers with proper error handling.

**中文：** 使用低级调用进行 ETH 转账并进行适当的错误处理。

```solidity
(bool success, ) = recipient.call{value: amount}("");
if (!success) revert BondingTokenETH__TransferFailed();
```

### 3. Royalty Rate Limits / 版税率限制

**English:** Maximum royalty rate capped at 10% for both mint and burn operations.

**中文：** 铸造和销毁操作的最大版税率限制为 10%。

```solidity
if (mintRoyalty_ > 1000) revert BondingTokenETH__InvalidRoyalty();
if (burnRoyalty_ > 1000) revert BondingTokenETH__InvalidRoyalty();
```

## Events / 事件

```solidity
event Mint(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 reserveAmount);
event Burn(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 refundAmount);
event RoyaltyPaid(address indexed recipient, uint256 amount);
```

## Custom Errors / 自定义错误

**English:** Enhanced error handling for better debugging and gas efficiency.

**中文：** 增强错误处理以改善调试和 gas 效率。

- `BondingTokenETH__InsufficientETH`: Insufficient ETH sent / ETH 发送不足
- `BondingTokenETH__UnexpectedETH`: ETH sent when ERC20 expected / 期望 ERC20 时发送了 ETH
- `BondingTokenETH__TransferFailed`: ETH transfer failed / ETH 转账失败
- `BondingTokenETH__InvalidRoyalty`: Royalty rate too high / 版税率过高

## Usage Examples / 使用示例

### Minting with ETH / 使用 ETH 铸造

```solidity
// English: Mint 100 tokens using ETH
// 中文: 使用 ETH 铸造 100 个代币
uint256 tokensToMint = 100 * 10**18;
(uint256 totalCost, uint256 royalty) = bondingToken.getReserveForTokens(tokensToMint);

// Send ETH with the transaction
uint256 actualCost = bondingToken.mint{value: totalCost}(
    tokensToMint,
    totalCost,
    msg.sender
);
```

### Minting with ERC20 / 使用 ERC20 铸造

```solidity
// English: Mint 100 tokens using USDC
// 中文: 使用 USDC 铸造 100 个代币
uint256 tokensToMint = 100 * 10**18;
(uint256 totalCost, uint256 royalty) = bondingToken.getReserveForTokens(tokensToMint);

// Approve USDC first
IERC20(usdcAddress).approve(address(bondingToken), totalCost);

// Mint without sending ETH
uint256 actualCost = bondingToken.mint(
    tokensToMint,
    totalCost,
    msg.sender
);
```

### Burning Tokens / 销毁代币

```solidity
// English: Burn 50 tokens and receive refund in reserve currency
// 中文: 销毁 50 个代币并以储备货币接收退款
uint256 tokensToBurn = 50 * 10**18;
(uint256 expectedRefund, uint256 royalty) = bondingToken.getRefundForTokens(tokensToBurn);

uint256 actualRefund = bondingToken.burn(
    tokensToBurn,
    expectedRefund * 95 / 100, // 5% slippage tolerance
    msg.sender
);
```

## Integration Guidelines / 集成指南

### Frontend Integration / 前端集成

**English:**
1. Detect reserve token type before transactions
2. Handle ETH and ERC20 payments differently
3. Implement proper slippage protection
4. Display price history charts using UI functions

**中文:**
1. 交易前检测储备代币类型
2. 不同处理 ETH 和 ERC20 支付
3. 实现适当的滑点保护
4. 使用 UI 函数显示价格历史图表

### Smart Contract Integration / 智能合约集成

**English:**
1. Check `reserveToken` address to determine payment method
2. Handle both ETH and ERC20 approvals appropriately
3. Listen for specific events based on reserve token type
4. Implement proper error handling for enhanced errors

**中文:**
1. 检查 `reserveToken` 地址以确定支付方式
2. 适当处理 ETH 和 ERC20 授权
3. 根据储备代币类型监听特定事件
4. 为增强错误实现适当的错误处理

## Gas Optimization Features / Gas 优化功能

### 1. Efficient Holder Tracking / 高效持有者跟踪

**English:** Uses packed storage and efficient array management for holder tracking.

**中文：** 使用打包存储和高效数组管理进行持有者跟踪。

### 2. Circular Price History / 循环价格历史

**English:** Implements circular buffer to limit memory usage while maintaining history.

**中文：** 实现循环缓冲区以限制内存使用同时保持历史记录。

### 3. Optimized Calculations / 优化计算

**English:** Uses efficient math operations and minimal storage reads/writes.

**中文：** 使用高效的数学运算和最少的存储读写操作。

## Receive Function / 接收函数

```solidity
receive() external payable {
    // Only accept ETH if it's the reserve token
    if (reserveToken != ETH_ADDRESS) {
        revert BondingTokenETH__UnexpectedETH();
    }
}
```

**English:** The contract includes a receive function that only accepts ETH when ETH is the designated reserve token.

**中文：** 合约包含一个接收函数，只有在 ETH 是指定储备代币时才接受 ETH。 