# BondingToken Smart Contract Documentation
# BondingToken 智能合约文档

## Overview / 概述

**English:** The BondingToken is an ERC20 token with step-based bonding curve pricing that follows the MCV2 pattern. It only supports ERC20 reserve tokens and implements a bonding curve where token prices increase in discrete steps as supply grows.

**中文：** BondingToken 是一个具有阶梯式联合曲线定价的 ERC20 代币，遵循 MCV2 模式。它仅支持 ERC20 储备代币，并实现了一个随着供应量增长而价格阶梯式上涨的联合曲线。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** ERC20, ReentrancyGuard
- **Library Dependencies:** BondingCurveMath, SafeERC20

## Key Features / 主要功能

### 1. Step-Based Bonding Curve / 阶梯式联合曲线

**English:** The contract uses discrete price steps instead of continuous curves for better price stability and predictability.

**中文：** 合约使用离散的价格阶梯而非连续曲线，以获得更好的价格稳定性和可预测性。

### 2. MCV2 Compatibility / MCV2 兼容性

**English:** Follows MCV2 pattern supporting only ERC20 reserve tokens (ETH requires a Zap contract).

**中文：** 遵循 MCV2 模式，仅支持 ERC20 储备代币（ETH 需要通过 Zap 合约）。

### 3. Royalty System / 版税系统

**English:** Implements configurable royalties on both minting and burning operations.

**中文：** 在铸造和销毁操作中实现可配置的版税系统。

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `creator` | address | Token creator / 代币创建者 |
| `nftCollection` | address | Associated NFT collection / 关联的 NFT 集合 |
| `reserveToken` | address | ERC20 reserve token / ERC20 储备代币 |
| `steps` | BondStep[] | Bonding curve steps / 联合曲线阶梯 |
| `reserveBalance` | uint256 | Current reserve balance / 当前储备余额 |
| `mintRoyalty` | uint16 | Mint royalty in basis points / 铸造版税（基点） |
| `burnRoyalty` | uint16 | Burn royalty in basis points / 销毁版税（基点） |
| `royaltyRecipient` | address | Royalty recipient / 版税接收者 |

## Core Functions / 核心函数

### initialize()

**English:** Initializes the bonding token with curve parameters, royalty settings, and metadata.

**中文：** 使用曲线参数、版税设置和元数据初始化联合代币。

```solidity
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
) external
```

**Parameters / 参数:**
- `name_`: Token name / 代币名称
- `symbol_`: Token symbol / 代币符号
- `creator_`: Token creator address / 代币创建者地址
- `nftCollection_`: Associated NFT collection / 关联 NFT 集合
- `reserveToken_`: ERC20 reserve token / ERC20 储备代币
- `steps_`: Bonding curve steps / 联合曲线阶梯
- `mintRoyalty_`: Mint royalty (basis points) / 铸造版税（基点）
- `burnRoyalty_`: Burn royalty (basis points) / 销毁版税（基点）
- `royaltyRecipient_`: Royalty recipient / 版税接收者

### mint()

**English:** Mints tokens by depositing reserve tokens according to the bonding curve pricing.

**中文：** 通过按联合曲线定价存入储备代币来铸造代币。

```solidity
function mint(
    uint256 tokensToMint,
    uint256 maxReserveAmount,
    address receiver
) external nonReentrant returns (uint256 reserveAmount)
```

**Mathematical Formula / 数学公式:**
```
Total Cost = Bonding Curve Cost + Royalty
总成本 = 联合曲线成本 + 版税

Royalty = (Bonding Curve Cost × mintRoyalty) ÷ 10000
版税 = (联合曲线成本 × 铸造版税) ÷ 10000
```

**Parameters / 参数:**
- `tokensToMint`: Amount of tokens to mint / 要铸造的代币数量
- `maxReserveAmount`: Maximum reserve to spend (slippage protection) / 最大储备支出（滑点保护）
- `receiver`: Token recipient address / 代币接收者地址

**Returns / 返回:**
- `reserveAmount`: Total reserve amount spent / 总储备支出

### burn()

**English:** Burns tokens and refunds reserve tokens according to the bonding curve.

**中文：** 销毁代币并根据联合曲线退还储备代币。

```solidity
function burn(
    uint256 tokensToBurn,
    uint256 minRefund,
    address receiver
) external nonReentrant returns (uint256 refundAmount)
```

**Mathematical Formula / 数学公式:**
```
Net Refund = Bonding Curve Refund - Royalty
净退款 = 联合曲线退款 - 版税

Royalty = (Bonding Curve Refund × burnRoyalty) ÷ 10000
版税 = (联合曲线退款 × 销毁版税) ÷ 10000
```

**Parameters / 参数:**
- `tokensToBurn`: Amount of tokens to burn / 要销毁的代币数量
- `minRefund`: Minimum refund expected (slippage protection) / 预期最小退款（滑点保护）
- `receiver`: Refund recipient address / 退款接收者地址

**Returns / 返回:**
- `refundAmount`: Net refund amount / 净退款金额

## View Functions / 查询函数

### getCurrentPrice()

**English:** Returns the current price per token based on total supply.

**中文：** 根据总供应量返回当前每个代币的价格。

```solidity
function getCurrentPrice() public view returns (uint256)
```

### getReserveForTokens()

**English:** Calculates the reserve amount needed to mint a specific number of tokens.

**中文：** 计算铸造特定数量代币所需的储备金额。

```solidity
function getReserveForTokens(uint256 tokensToMint) 
    external view returns (uint256 reserveAmount, uint256 royalty)
```

### getRefundForTokens()

**English:** Calculates the refund amount for burning a specific number of tokens.

**中文：** 计算销毁特定数量代币的退款金额。

```solidity
function getRefundForTokens(uint256 tokensToBurn) 
    external view returns (uint256 refundAmount, uint256 royalty)
```

### getBondingCurveInfo()

**English:** Returns comprehensive bonding curve information.

**中文：** 返回全面的联合曲线信息。

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

### Token Holder Tracking / 代币持有者跟踪

**English:** The contract maintains a list of token holders for UI purposes.

**中文：** 合约维护代币持有者列表以供 UI 使用。

- `getHolders(offset, limit)`: Get paginated holder list / 获取分页持有者列表
- `getHolderCount()`: Get total holder count / 获取总持有者数量

### Price History / 价格历史

**English:** Records price changes over time with a maximum history of 1000 entries.

**中文：** 记录价格变化历史，最多保存 1000 条记录。

- `getPriceHistory(offset, limit)`: Get paginated price history / 获取分页价格历史
- `getPriceHistoryLength()`: Get price history length / 获取价格历史长度

## Security Features / 安全功能

### 1. Reentrancy Protection / 重入攻击保护

**English:** Uses OpenZeppelin's ReentrancyGuard to prevent reentrancy attacks.

**中文：** 使用 OpenZeppelin 的 ReentrancyGuard 防止重入攻击。

### 2. Slippage Protection / 滑点保护

**English:** Both mint and burn functions include slippage protection parameters.

**中文：** 铸造和销毁函数都包含滑点保护参数。

### 3. Input Validation / 输入验证

**English:** Comprehensive input validation prevents invalid operations.

**中文：** 全面的输入验证防止无效操作。

## Events / 事件

```solidity
event Mint(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 reserveAmount);
event Burn(address indexed user, address indexed receiver, uint256 tokenAmount, uint256 refundAmount);
event RoyaltyPaid(address indexed recipient, uint256 amount);
```

## Error Handling / 错误处理

The contract defines custom errors for better gas efficiency and debugging:
合约定义了自定义错误以提高 gas 效率和调试能力：

- `BondingToken__AlreadyInitialized`: Contract already initialized / 合约已初始化
- `BondingToken__InvalidAmount`: Invalid amount provided / 提供的金额无效
- `BondingToken__SlippageExceeded`: Slippage tolerance exceeded / 超过滑点容忍度
- `BondingToken__MaxSupplyReached`: Maximum supply reached / 达到最大供应量
- `BondingToken__InsufficientTokens`: Insufficient token balance / 代币余额不足

## Usage Examples / 使用示例

### Minting Tokens / 铸造代币

```solidity
// English: Mint 100 tokens with maximum 1000 USDC cost
// 中文: 铸造 100 个代币，最大成本 1000 USDC
uint256 tokensToMint = 100 * 10**18;
uint256 maxCost = 1000 * 10**6; // USDC has 6 decimals
address receiver = msg.sender;

uint256 actualCost = bondingToken.mint(tokensToMint, maxCost, receiver);
```

### Burning Tokens / 销毁代币

```solidity
// English: Burn 50 tokens with minimum 400 USDC refund
// 中文: 销毁 50 个代币，最小退款 400 USDC
uint256 tokensToBurn = 50 * 10**18;
uint256 minRefund = 400 * 10**6;
address receiver = msg.sender;

uint256 actualRefund = bondingToken.burn(tokensToBurn, minRefund, receiver);
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:** 
1. Always check current price before transactions
2. Implement slippage tolerance settings
3. Use UI support functions for displaying holder information
4. Monitor price history for charts and analytics

**中文：**
1. 交易前始终检查当前价格
2. 实现滑点容忍度设置
3. 使用 UI 支持函数显示持有者信息
4. 监控价格历史用于图表和分析

### For Backend Integration / 后端集成

**English:**
1. Listen to Mint/Burn events for transaction tracking
2. Use view functions to calculate costs before transactions
3. Implement proper error handling for custom errors
4. Monitor royalty payments for accounting

**中文：**
1. 监听铸造/销毁事件进行交易跟踪
2. 使用查询函数在交易前计算成本
3. 为自定义错误实现适当的错误处理
4. 监控版税支付进行会计处理 