# BondingCurveMath Library Documentation
# BondingCurveMath 库文档

## Overview / 概述

**English:** The BondingCurveMath library implements step-based bonding curve calculations that are MCV2 compatible. It provides mathematical functions for calculating buy costs, sell refunds, and price determinations using discrete price steps instead of continuous curves for better stability and predictability.

**中文：** BondingCurveMath 库实现了与 MCV2 兼容的阶梯式联合曲线计算。它提供数学函数来计算购买成本、销售退款和价格确定，使用离散价格阶梯而非连续曲线以获得更好的稳定性和可预测性。

## Library Details / 库详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Dependencies:** OpenZeppelin Math library
- **Type:** Pure mathematical library (no state)

## Core Data Structure / 核心数据结构

### BondStep Struct / BondStep 结构体

```solidity
struct BondStep {
    uint128 rangeTo;    // Maximum supply for this price step / 此价格阶梯的最大供应量
    uint128 price;      // Price multiplied by 10^18 for decimals / 价格乘以 10^18 用于小数位
}
```

**English:** Each BondStep defines a price range where tokens are sold at a fixed price until the `rangeTo` supply is reached.

**中文：** 每个 BondStep 定义一个价格范围，在该范围内代币以固定价格销售，直到达到 `rangeTo` 供应量。

**Storage Optimization / 存储优化:**
- Uses `uint128` to save gas and prevent overflow in calculations
- 使用 `uint128` 节省 gas 并防止计算中的溢出
- Maximum safe value: `2^128 - 1 ≈ 3.4 × 10^38`

## Mathematical Formulas / 数学公式

### 1. Buy Cost Calculation / 购买成本计算

**English:** Calculates the total reserve cost to purchase a specific amount of tokens.

**中文：** 计算购买特定数量代币的总储备成本。

**Formula / 公式:**

For each step `i` from current step to final step:
对于从当前阶梯到最终阶梯的每个阶梯 `i`：

```
If tokens_needed ≤ tokens_available_in_step:
    cost = ⌈(tokens_needed × step_price) ÷ 10^decimals⌉
    break

Else:
    cost += ⌈(tokens_available_in_step × step_price) ÷ 10^decimals⌉
    tokens_needed -= tokens_available_in_step
    continue to next step

Where:
- tokens_available_in_step = step.rangeTo - current_supply
- step_price = step.price
- ⌈⌉ represents ceiling division (Math.ceilDiv)
```

**Implementation:**

```solidity
function calculateBuyCost(
    uint256 currentSupply,
    uint256 tokensToMint,
    BondStep[] memory steps,
    uint256 decimals
) internal pure returns (uint256 reserveAmount)
```

### 2. Sell Refund Calculation / 销售退款计算

**English:** Calculates the reserve refund when burning/selling tokens.

**中文：** 计算销毁/出售代币时的储备退款。

**Formula / 公式:**

For each step `i` from current step backwards:
对于从当前阶梯向后的每个阶梯 `i`：

```
tokens_in_current_step = current_supply - previous_step.rangeTo
tokens_to_process = min(tokens_to_burn, tokens_in_current_step)

refund += (tokens_to_process × step.price) ÷ 10^decimals

tokens_to_burn -= tokens_to_process
current_supply -= tokens_to_process

If tokens_to_burn > 0:
    move to previous step
```

**Implementation:**

```solidity
function calculateSellRefund(
    uint256 currentSupply,
    uint256 tokensToBurn,
    BondStep[] memory steps,
    uint256 decimals
) internal pure returns (uint256 refundAmount)
```

### 3. Current Price Calculation / 当前价格计算

**English:** Determines the current price per token based on total supply.

**中文：** 根据总供应量确定每个代币的当前价格。

**Formula / 公式:**

```
current_step_index = getCurrentStep(supply, steps)
current_price = steps[current_step_index].price
```

**Implementation:**

```solidity
function getCurrentPrice(
    uint256 supply,
    BondStep[] memory steps
) internal pure returns (uint256 price)
```

### 4. Step Index Calculation / 阶梯索引计算

**English:** Finds which price step the current supply falls into.

**中文：** 找出当前供应量属于哪个价格阶梯。

**Algorithm / 算法:**

```
For i = 0 to steps.length - 1:
    If current_supply ≤ steps[i].rangeTo:
        return i
```

**Implementation:**

```solidity
function getCurrentStep(
    uint256 currentSupply,
    BondStep[] memory steps
) internal pure returns (uint256 stepIndex)
```

## Core Functions / 核心函数

### calculateBuyCost()

**English:** Calculates the exact reserve amount needed to mint a specific number of tokens.

**中文：** 计算铸造特定数量代币所需的确切储备金额。

```solidity
function calculateBuyCost(
    uint256 currentSupply,
    uint256 tokensToMint,
    BondStep[] memory steps,
    uint256 decimals
) internal pure returns (uint256 reserveAmount)
```

**Parameters / 参数:**
- `currentSupply`: Current token supply / 当前代币供应量
- `tokensToMint`: Amount of tokens to mint / 要铸造的代币数量
- `steps`: Array of bonding curve steps / 联合曲线阶梯数组
- `decimals`: Token decimal places / 代币小数位数

**Mathematical Process / 数学过程:**

1. **Step Iteration / 阶梯迭代:**
   - Start from current step / 从当前阶梯开始
   - Process tokens in each step until requirement is met / 在每个阶梯中处理代币直到满足要求

2. **Cost Accumulation / 成本累积:**
   - Use ceiling division for precise calculations / 使用向上取整除法进行精确计算
   - Prevent rounding errors that could shortchange the protocol / 防止可能损害协议的舍入错误

3. **Validation / 验证:**
   - Ensure all tokens can be minted within available steps / 确保所有代币都能在可用阶梯内铸造
   - Revert if insufficient capacity / 如果容量不足则回滚

### calculateSellRefund()

**English:** Calculates the reserve refund when burning tokens.

**中文：** 计算销毁代币时的储备退款。

```solidity
function calculateSellRefund(
    uint256 currentSupply,
    uint256 tokensToBurn,
    BondStep[] memory steps,
    uint256 decimals
) internal pure returns (uint256 refundAmount)
```

**Mathematical Process / 数学过程:**

1. **Reverse Step Processing / 反向阶梯处理:**
   - Start from current step and work backwards / 从当前阶梯开始向后处理
   - Calculate refund for tokens in each step / 计算每个阶梯中代币的退款

2. **Precise Calculations / 精确计算:**
   - Use exact division (no ceiling) for refunds / 退款使用精确除法（无向上取整）
   - Maintain mathematical consistency with buy calculations / 与购买计算保持数学一致性

### calculateTokensForReserve()

**English:** Calculates how many tokens can be purchased with a given reserve amount.

**中文：** 计算给定储备金额可以购买多少代币。

```solidity
function calculateTokensForReserve(
    uint256 currentSupply,
    uint256 reserveAmount,
    BondStep[] memory steps,
    uint256 decimals
) internal pure returns (uint256 tokenAmount)
```

**Mathematical Process / 数学过程:**

1. **Step-by-Step Allocation / 逐步分配:**
   - Calculate cost for entire step / 计算整个阶梯的成本
   - If affordable, buy all tokens in step / 如果负担得起，购买阶梯中的所有代币
   - Otherwise, calculate partial tokens affordable / 否则，计算可负担的部分代币

2. **Precision Handling / 精度处理:**
   - Use ceiling division for step costs / 阶梯成本使用向上取整除法
   - Use floor division for partial token calculations / 部分代币计算使用向下取整除法

### validateSteps()

**English:** Validates that bonding curve steps are properly configured.

**中文：** 验证联合曲线阶梯是否正确配置。

```solidity
function validateSteps(BondStep[] memory steps) internal pure
```

**Validation Rules / 验证规则:**

1. **Non-empty Array / 非空数组:**
   ```
   steps.length > 0
   ```

2. **Ascending Range Values / 递增范围值:**
   ```
   For i = 1 to steps.length - 1:
       steps[i].rangeTo > steps[i-1].rangeTo
   ```

3. **Positive Prices / 正价格:**
   ```
   For all steps: step.price > 0
   ```

### getMaxSupply()

**English:** Returns the maximum possible token supply from the bonding curve.

**中文：** 返回联合曲线的最大可能代币供应量。

```solidity
function getMaxSupply(BondStep[] memory steps) internal pure returns (uint256 maxSupply)
```

**Formula / 公式:**
```
max_supply = steps[steps.length - 1].rangeTo
```

## Advanced Mathematical Concepts / 高级数学概念

### 1. Ceiling Division / 向上取整除法

**English:** Used in buy calculations to ensure the protocol receives sufficient payment.

**中文：** 在购买计算中使用，确保协议收到足够的付款。

**Implementation:**
```solidity
Math.ceilDiv(a, b) = (a + b - 1) / b
```

**Example / 示例:**
- `ceilDiv(10, 3) = 4` (instead of 3.33...)
- `ceilDiv(9, 3) = 3` (exact division)

### 2. Floor Division / 向下取整除法

**English:** Used in sell calculations and partial token purchases.

**中文：** 在销售计算和部分代币购买中使用。

**Implementation:**
```solidity
a / b  // Standard Solidity division (floor)
```

### 3. Step-Based Pricing Model / 阶梯式定价模型

**English:** Unlike continuous bonding curves, step-based curves provide predictable pricing within ranges.

**中文：** 与连续联合曲线不同，阶梯式曲线在范围内提供可预测的定价。

**Advantages / 优势:**
- **Predictability / 可预测性:** Fixed prices within steps
- **Gas Efficiency / Gas 效率:** Simpler calculations
- **User Experience / 用户体验:** Clear price tiers
- **MEV Resistance / MEV 抗性:** Reduced arbitrage opportunities

## Error Handling / 错误处理

### Custom Errors / 自定义错误

```solidity
error BondingCurveMath__InvalidParameters();      // Invalid input parameters / 无效输入参数
error BondingCurveMath__SupplyTooLarge();         // Supply exceeds maximum / 供应量超过最大值
error BondingCurveMath__AmountTooLarge();         // Amount too large for calculation / 金额过大无法计算
error BondingCurveMath__InsufficientSupply();     // Not enough supply to burn / 没有足够的供应量可销毁
error BondingCurveMath__InvalidCurrentSupply();   // Current supply invalid for steps / 当前供应量对阶梯无效
```

## Usage Examples / 使用示例

### Example 1: Basic Buy Calculation / 基本购买计算

```solidity
// English: Define bonding curve steps
// 中文: 定义联合曲线阶梯
BondingCurveMath.BondStep[] memory steps = new BondingCurveMath.BondStep[](3);
steps[0] = BondingCurveMath.BondStep(1000 * 10**18, 1 * 10**18);    // 0-1000: 1 token
steps[1] = BondingCurveMath.BondStep(5000 * 10**18, 2 * 10**18);    // 1001-5000: 2 tokens
steps[2] = BondingCurveMath.BondStep(10000 * 10**18, 5 * 10**18);   // 5001-10000: 5 tokens

// Calculate cost to mint 500 tokens when supply is 0
uint256 cost = BondingCurveMath.calculateBuyCost(0, 500 * 10**18, steps, 18);
// Result: 500 tokens * 1 token = 500 tokens worth of reserve
```

### Example 2: Cross-Step Purchase / 跨阶梯购买

```solidity
// English: Calculate cost for purchase spanning multiple steps
// 中文: 计算跨多个阶梯的购买成本
uint256 currentSupply = 800 * 10**18;  // Currently at 800 tokens
uint256 tokensToBuy = 300 * 10**18;    // Want to buy 300 more

// This purchase will span steps:
// - 200 tokens at step 0 price (1 token each) = 200 tokens
// - 100 tokens at step 1 price (2 tokens each) = 200 tokens
// Total cost = 400 tokens worth of reserve

uint256 cost = BondingCurveMath.calculateBuyCost(currentSupply, tokensToBuy, steps, 18);
```

### Example 3: Sell Refund Calculation / 销售退款计算

```solidity
// English: Calculate refund for selling tokens
// 中文: 计算销售代币的退款
uint256 currentSupply = 1200 * 10**18;  // Currently at 1200 tokens
uint256 tokensToSell = 300 * 10**18;    // Want to sell 300 tokens

// This sale will process:
// - 200 tokens from step 1 (2 tokens each) = 400 tokens refund
// - 100 tokens from step 0 (1 token each) = 100 tokens refund
// Total refund = 500 tokens worth of reserve

uint256 refund = BondingCurveMath.calculateSellRefund(currentSupply, tokensToSell, steps, 18);
```

## Integration Guidelines / 集成指南

### For Smart Contract Developers / 智能合约开发者

**English:**
1. Always validate steps before using them in calculations
2. Handle potential reverts from calculation functions
3. Use appropriate decimal precision for your token
4. Consider gas costs for complex step arrays

**中文:**
1. 在计算中使用阶梯之前始终验证它们
2. 处理计算函数可能的回滚
3. 为你的代币使用适当的小数精度
4. 考虑复杂阶梯数组的 gas 成本

### For Frontend Integration / 前端集成

**English:**
1. Pre-calculate costs and refunds for UI display
2. Handle precision carefully when displaying prices
3. Implement proper error handling for edge cases
4. Show users which price step they're purchasing in

**中文:**
1. 为 UI 显示预先计算成本和退款
2. 显示价格时仔细处理精度
3. 为边界情况实现适当的错误处理
4. 向用户显示他们购买的价格阶梯

## Gas Optimization Tips / Gas 优化建议

### 1. Step Array Size / 阶梯数组大小

**English:** Limit the number of steps to reduce gas costs. Each additional step increases calculation complexity.

**中文：** 限制阶梯数量以减少 gas 成本。每个额外的阶梯都会增加计算复杂性。

**Recommended / 推荐:** 3-10 steps for optimal balance

### 2. Memory vs Storage / 内存 vs 存储

**English:** The library uses memory arrays for calculations, which is gas-efficient for read operations.

**中文：** 库使用内存数组进行计算，这对读操作来说是 gas 高效的。

### 3. Precision Considerations / 精度考虑

**English:** Higher decimal precision increases calculation costs. Use 18 decimals only when necessary.

**中文：** 更高的小数精度增加计算成本。只有在必要时才使用 18 位小数。

## Security Considerations / 安全考虑

### 1. Integer Overflow Protection / 整数溢出保护

**English:** Uses uint128 for steps to prevent overflow in multiplication operations.

**中文：** 对阶梯使用 uint128 以防止乘法运算中的溢出。

### 2. Division by Zero Protection / 除零保护

**English:** Validates inputs to prevent division by zero errors.

**中文：** 验证输入以防止除零错误。

### 3. Range Validation / 范围验证

**English:** Ensures all operations stay within valid supply ranges.

**中文：** 确保所有操作都在有效供应范围内。

## Testing Recommendations / 测试建议

### 1. Edge Cases / 边界情况

- Zero token purchases / 零代币购买
- Maximum supply purchases / 最大供应量购买
- Cross-step transactions / 跨阶梯交易
- Single token operations / 单代币操作

### 2. Mathematical Accuracy / 数学准确性

- Verify ceiling division results / 验证向上取整除法结果
- Test precision with various decimal values / 使用各种小数值测试精度
- Ensure buy/sell symmetry / 确保买卖对称性

### 3. Gas Usage / Gas 使用

- Benchmark different step array sizes / 基准测试不同的阶梯数组大小
- Optimize for common use cases / 针对常见用例进行优化 