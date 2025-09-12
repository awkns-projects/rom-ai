# StakingPool Smart Contract Documentation
# StakingPool 智能合约文档

## Overview / 概述

**English:** The StakingPool contract distributes NFT mint revenue to stakers based on their stake ratio. It implements a reward distribution mechanism where users stake bonding tokens and earn rewards proportional to their stake and staking duration.

**中文：** StakingPool 合约根据质押者的质押比例向他们分发 NFT 铸造收入。它实现了一个奖励分发机制，用户质押联合代币并根据其质押量和质押持续时间按比例获得奖励。

## Contract Details / 合约详情

- **License:** BUSL-1.1
- **Solidity Version:** 0.8.20
- **Inheritance:** ReentrancyGuard
- **Dependencies:** SafeERC20, OpenZeppelin Math

## Key Features / 主要功能

### 1. Proportional Reward Distribution / 按比例奖励分发

**English:** Rewards are distributed proportionally based on each user's stake relative to the total staked amount.

**中文：** 奖励根据每个用户相对于总质押金额的质押比例按比例分发。

### 2. Minimum Staking Duration / 最小质押持续时间

**English:** Users must stake for at least 1 hour before being eligible to claim rewards.

**中文：** 用户必须质押至少 1 小时才有资格领取奖励。

### 3. Protocol Fee System / 协议费用系统

**English:** A configurable protocol fee is deducted from rewards before distribution to users.

**中文：** 在向用户分发奖励之前，会从奖励中扣除可配置的协议费用。

## Mathematical Model / 数学模型

### Reward Calculation Formula / 奖励计算公式

**English:** The contract uses a reward-per-token model similar to Synthetix staking contracts.

**中文：** 合约使用类似于 Synthetix 质押合约的每代币奖励模型。

**Core Formula / 核心公式:**

```
Reward Per Token = Total Pending Rewards × PRECISION ÷ Total Staked
每代币奖励 = 总待分发奖励 × 精度 ÷ 总质押量

User Earned = (User Staked × (Current Reward Per Token - User's Last Reward Per Token)) ÷ PRECISION + Pending Rewards
用户收益 = (用户质押量 × (当前每代币奖励 - 用户上次每代币奖励)) ÷ 精度 + 待领取奖励

Net Reward = Gross Reward - Protocol Fee
净奖励 = 总奖励 - 协议费用

Protocol Fee = Gross Reward × Protocol Fee BPS ÷ 10000
协议费用 = 总奖励 × 协议费用基点 ÷ 10000
```

Where:
- `PRECISION = 1e18` (for calculation accuracy)
- `Protocol Fee BPS` is in basis points (10000 = 100%)

其中：
- `精度 = 1e18`（用于计算精度）
- `协议费用基点` 以基点为单位（10000 = 100%）

## State Variables / 状态变量

| Variable / 变量 | Type / 类型 | Description / 描述 |
|---|---|---|
| `creator` | address | Pool creator / 池创建者 |
| `stakingToken` | address | Token being staked / 被质押的代币 |
| `nftCollection` | address | NFT collection providing rewards / 提供奖励的 NFT 集合 |
| `rewardToken` | address | Reward token (address(0) for ETH) / 奖励代币（ETH 为 address(0)） |
| `protocolFeeRecipient` | address | Protocol fee recipient / 协议费用接收者 |
| `protocolFeeBps` | uint256 | Protocol fee in basis points / 协议费用（基点） |
| `totalStaked` | uint256 | Total amount staked / 总质押量 |
| `rewardPerTokenStored` | uint256 | Stored reward per token / 存储的每代币奖励 |
| `totalRewards` | uint256 | Total rewards added / 已添加的总奖励 |
| `distributedRewards` | uint256 | Total rewards distributed / 已分发的总奖励 |

### User-Specific Mappings / 用户特定映射

| Mapping / 映射 | Description / 描述 |
|---|---|
| `stakedBalance[user]` | User's staked balance / 用户的质押余额 |
| `userRewardPerTokenPaid[user]` | User's last reward per token / 用户上次的每代币奖励 |
| `pendingRewards[user]` | User's pending rewards / 用户的待领取奖励 |
| `stakingStartTime[user]` | User's staking start time / 用户的质押开始时间 |

## Constants / 常量

```solidity
address public constant ETH_ADDRESS = address(0);
uint256 public constant MINIMUM_STAKE_DURATION = 1 hours;
uint256 private constant PRECISION = 1e18;
```

## Core Functions / 核心函数

### initialize()

**English:** Initializes the staking pool with configuration parameters.

**中文：** 使用配置参数初始化质押池。

```solidity
function initialize(
    address creator_,
    address stakingToken_,
    address nftCollection_,
    address rewardToken_,
    address protocolFeeRecipient_,
    uint256 protocolFeeBps_
) external
```

**Parameters / 参数:**
- `creator_`: Pool creator / 池创建者
- `stakingToken_`: Token to stake / 要质押的代币
- `nftCollection_`: NFT collection providing rewards / 提供奖励的 NFT 集合
- `rewardToken_`: Reward token / 奖励代币
- `protocolFeeRecipient_`: Protocol fee recipient / 协议费用接收者
- `protocolFeeBps_`: Protocol fee in basis points / 协议费用（基点）

### stake()

**English:** Stakes tokens into the pool and updates reward calculations.

**中文：** 将代币质押到池中并更新奖励计算。

```solidity
function stake(uint256 amount) external nonReentrant
```

**Process Flow / 流程:**

1. **Reward Update / 奖励更新:**
   ```solidity
   _updateReward(msg.sender);
   ```

2. **Token Transfer / 代币转账:**
   ```solidity
   IERC20(stakingToken).safeTransferFrom(msg.sender, address(this), amount);
   ```

3. **Balance Update / 余额更新:**
   ```solidity
   stakedBalance[msg.sender] += amount;
   totalStaked += amount;
   ```

4. **Staker Management / 质押者管理:**
   ```solidity
   if (!isStaker[msg.sender]) {
       isStaker[msg.sender] = true;
       stakerIndex[msg.sender] = stakers.length;
       stakers.push(msg.sender);
       stakingStartTime[msg.sender] = block.timestamp;
   }
   ```

### unstake()

**English:** Unstakes tokens from the pool and updates reward calculations.

**中文：** 从池中取消质押代币并更新奖励计算。

```solidity
function unstake(uint256 amount) external nonReentrant
```

**Process Flow / 流程:**

1. **Validation / 验证:**
   ```solidity
   if (amount == 0) revert StakingPool__InvalidAmount();
   if (stakedBalance[msg.sender] < amount) revert StakingPool__InsufficientStake();
   ```

2. **Reward Update / 奖励更新:**
   ```solidity
   _updateReward(msg.sender);
   ```

3. **Balance Update / 余额更新:**
   ```solidity
   stakedBalance[msg.sender] -= amount;
   totalStaked -= amount;
   ```

4. **Cleanup / 清理:**
   ```solidity
   if (stakedBalance[msg.sender] == 0 && isStaker[msg.sender]) {
       _removeStaker(msg.sender);
       stakingStartTime[msg.sender] = 0;
   }
   ```

5. **Token Transfer / 代币转账:**
   ```solidity
   IERC20(stakingToken).safeTransfer(msg.sender, amount);
   ```

### claimRewards()

**English:** Claims pending rewards with protocol fee deduction.

**中文：** 领取待领取奖励并扣除协议费用。

```solidity
function claimRewards() external nonReentrant
```

**Eligibility Check / 资格检查:**
```solidity
if (stakingStartTime[msg.sender] == 0 || 
    block.timestamp < stakingStartTime[msg.sender] + MINIMUM_STAKE_DURATION) {
    revert StakingPool__InsufficientStakingDuration();
}
```

**Reward Calculation / 奖励计算:**
```solidity
uint256 reward = pendingRewards[msg.sender];
uint256 protocolFee = (reward * protocolFeeBps) / 10000;
uint256 netReward = reward - protocolFee;
```

**Payment Distribution / 支付分发:**

**For ETH Rewards / ETH 奖励:**
```solidity
if (rewardToken == ETH_ADDRESS) {
    // Pay protocol fee
    (bool success, ) = protocolFeeRecipient.call{value: protocolFee}("");
    
    // Pay net reward to user
    (bool success, ) = msg.sender.call{value: netReward}("");
}
```

**For ERC20 Rewards / ERC20 奖励:**
```solidity
else {
    IERC20(rewardToken).safeTransfer(protocolFeeRecipient, protocolFee);
    IERC20(rewardToken).safeTransfer(msg.sender, netReward);
}
```

### exit()

**English:** Convenience function to unstake all tokens and claim rewards.

**中文：** 便利函数，用于取消所有代币质押并领取奖励。

```solidity
function exit() external
```

**Implementation / 实现:**
```solidity
uint256 balance = stakedBalance[msg.sender];
if (balance > 0) {
    this.unstake(balance);
}
this.claimRewards();
```

### notifyRewardAmount()

**English:** Called by NFT collection to add new rewards to the pool.

**中文：** 由 NFT 集合调用以向池中添加新奖励。

```solidity
function notifyRewardAmount(uint256 reward) external
```

**Access Control / 访问控制:**
```solidity
if (msg.sender != nftCollection) revert StakingPool__Unauthorized();
```

**Reward Addition / 奖励添加:**
```solidity
_updateRewardPerToken();
totalRewards += reward;
```

## Internal Functions / 内部函数

### _updateReward()

**English:** Updates reward calculations for a specific user.

**中文：** 更新特定用户的奖励计算。

```solidity
function _updateReward(address user) internal
```

**Process / 过程:**
1. Update global reward per token / 更新全局每代币奖励
2. Calculate user's earned rewards / 计算用户获得的奖励
3. Update user's reward per token paid / 更新用户已支付的每代币奖励

### _updateRewardPerToken()

**English:** Updates the global reward per token stored value.

**中文：** 更新全局存储的每代币奖励值。

```solidity
function _updateRewardPerToken() internal
```

**Calculation / 计算:**
```solidity
if (totalStaked == 0) {
    lastUpdateTime = block.timestamp;
    return;
}

uint256 pendingRewardAmount = totalRewards - distributedRewards;
if (pendingRewardAmount > 0) {
    rewardPerTokenStored += (pendingRewardAmount * PRECISION) / totalStaked;
}
```

### _earned()

**English:** Calculates the total rewards earned by a user.

**中文：** 计算用户获得的总奖励。

```solidity
function _earned(address user) internal view returns (uint256)
```

**Formula Implementation / 公式实现:**
```solidity
return ((stakedBalance[user] * 
         (rewardPerTokenStored - userRewardPerTokenPaid[user])) / 
         PRECISION) + pendingRewards[user];
```

## View Functions / 查询函数

### earned()

**English:** Returns the total rewards earned by a user (including pending distribution).

**中文：** 返回用户获得的总奖励（包括待分发）。

```solidity
function earned(address user) external view returns (uint256)
```

### rewardPerToken()

**English:** Returns the current reward per token (including pending rewards).

**中文：** 返回当前每代币奖励（包括待发奖励）。

```solidity
function rewardPerToken() external view returns (uint256)
```

### getPoolInfo()

**English:** Returns comprehensive pool information.

**中文：** 返回全面的池信息。

```solidity
function getPoolInfo() external view returns (
    address creator_,
    address stakingToken_,
    address nftCollection_,
    address rewardToken_,
    uint256 totalStaked_,
    uint256 totalRewards_,
    uint256 distributedRewards_,
    uint256 stakerCount_
)
```

### getUserInfo()

**English:** Returns user-specific staking information.

**中文：** 返回用户特定的质押信息。

```solidity
function getUserInfo(address user) external view returns (
    uint256 stakedAmount,
    uint256 earnedAmount,
    bool isActiveStaker
)
```

### isEligibleForRewards()

**English:** Checks if a user is eligible to claim rewards based on staking duration.

**中文：** 根据质押持续时间检查用户是否有资格领取奖励。

```solidity
function isEligibleForRewards(address user) external view returns (
    bool eligible,
    uint256 timeRemaining
)
```

**Logic / 逻辑:**
```solidity
if (stakingStartTime[user] == 0) {
    return (false, 0); // Never staked
}

uint256 stakingDuration = block.timestamp - stakingStartTime[user];
if (stakingDuration >= MINIMUM_STAKE_DURATION) {
    return (true, 0);
} else {
    return (false, MINIMUM_STAKE_DURATION - stakingDuration);
}
```

## Staker Management / 质押者管理

### Efficient Array Management / 高效数组管理

**English:** The contract maintains an efficient array of active stakers for gas-optimized operations.

**中文：** 合约维护活跃质押者的高效数组以进行 gas 优化操作。

### _removeStaker()

**English:** Removes a staker from the active stakers array using swap-and-pop technique.

**中文：** 使用交换和弹出技术从活跃质押者数组中移除质押者。

```solidity
function _removeStaker(address staker) internal
```

**Swap-and-Pop Implementation / 交换和弹出实现:**
```solidity
uint256 index = stakerIndex[staker];
uint256 lastIndex = stakers.length - 1;

if (index != lastIndex) {
    address lastStaker = stakers[lastIndex];
    stakers[index] = lastStaker;
    stakerIndex[lastStaker] = index;
}

stakers.pop();
delete isStaker[staker];
delete stakerIndex[staker];
```

### getStakers()

**English:** Returns stakers with pagination support.

**中文：** 返回具有分页支持的质押者。

```solidity
function getStakers(
    uint256 offset,
    uint256 limit
) external view returns (address[] memory result)
```

## Events / 事件

```solidity
event Staked(address indexed user, uint256 amount);
event Unstaked(address indexed user, uint256 amount);
event RewardsClaimed(address indexed user, uint256 amount);
event RewardsAdded(uint256 amount);
event ProtocolFeePaid(uint256 amount);
```

## Error Handling / 错误处理

### Custom Errors / 自定义错误

```solidity
error StakingPool__AlreadyInitialized();              // Pool already initialized / 池已初始化
error StakingPool__InvalidCreator();                  // Invalid creator address / 无效创建者地址
error StakingPool__InvalidStakingToken();             // Invalid staking token / 无效质押代币
error StakingPool__InvalidNFTCollection();            // Invalid NFT collection / 无效 NFT 集合
error StakingPool__InvalidAmount();                   // Invalid amount / 无效金额
error StakingPool__InsufficientBalance();             // Insufficient balance / 余额不足
error StakingPool__InsufficientStake();               // Insufficient stake / 质押不足
error StakingPool__Unauthorized();                    // Unauthorized access / 未授权访问
error StakingPool__TransferFailed();                  // Transfer failed / 转账失败
error StakingPool__ProtocolFeeTransferFailed();       // Protocol fee transfer failed / 协议费用转账失败
error StakingPool__InsufficientStakingDuration();     // Insufficient staking duration / 质押持续时间不足
```

## Security Features / 安全功能

### 1. Reentrancy Protection / 重入攻击保护

**English:** All external functions that modify state use the `nonReentrant` modifier.

**中文：** 所有修改状态的外部函数都使用 `nonReentrant` 修饰符。

### 2. Access Control / 访问控制

**English:** Only the associated NFT collection can notify new rewards.

**中文：** 只有关联的 NFT 集合才能通知新奖励。

### 3. Minimum Staking Duration / 最小质押持续时间

**English:** Prevents immediate reward claiming to encourage longer-term staking.

**中文：** 防止立即领取奖励以鼓励长期质押。

### 4. Safe Math Operations / 安全数学操作

**English:** Uses SafeERC20 for all token transfers and prevents overflow/underflow.

**中文：** 对所有代币转账使用 SafeERC20 并防止溢出/下溢。

## Usage Examples / 使用示例

### Basic Staking Flow / 基本质押流程

```solidity
// English: Complete staking workflow
// 中文: 完整质押工作流程

// 1. Approve staking pool to spend tokens
IERC20(stakingToken).approve(address(stakingPool), stakeAmount);

// 2. Stake tokens
stakingPool.stake(stakeAmount);

// 3. Wait for minimum staking duration (1 hour)
// 等待最小质押持续时间（1小时）

// 4. Check earned rewards
uint256 earned = stakingPool.earned(msg.sender);

// 5. Claim rewards
stakingPool.claimRewards();

// 6. Unstake tokens (optional)
stakingPool.unstake(stakeAmount);
```

### Reward Calculation Example / 奖励计算示例

```solidity
// English: Example reward calculation
// 中文: 奖励计算示例

// Scenario: 
// - Total staked: 1000 tokens
// - User staked: 100 tokens (10% of total)
// - New rewards: 50 tokens
// - Protocol fee: 5% (500 basis points)

// Step 1: Calculate reward per token
uint256 rewardPerToken = (50 * 1e18) / 1000; // 0.05 * 1e18

// Step 2: Calculate user's gross reward
uint256 userGrossReward = (100 * rewardPerToken) / 1e18; // 5 tokens

// Step 3: Calculate protocol fee
uint256 protocolFee = (5 * 500) / 10000; // 0.25 tokens

// Step 4: Calculate net reward
uint256 netReward = 5 - 0.25; // 4.75 tokens
```

### Integration with NFT Collection / 与 NFT 集合集成

```solidity
// English: NFT collection notifies staking pool of new rewards
// 中文: NFT 集合通知质押池新奖励

contract NFTCollection {
    address public stakingPool;
    
    function mint(address to, uint256 amount) external payable {
        // ... minting logic
        
        uint256 revenue = msg.value;
        uint256 stakingReward = revenue * 80 / 100; // 80% to staking
        
        // Send rewards to staking pool
        if (stakingPool != address(0)) {
            (bool success, ) = stakingPool.call{value: stakingReward}("");
            require(success, "Reward transfer failed");
            
            // Notify staking pool
            IStakingPool(stakingPool).notifyRewardAmount(stakingReward);
        }
    }
}
```

## Integration Guidelines / 集成指南

### For Frontend Developers / 前端开发者

**English:**
1. Check minimum staking duration before showing claim button
2. Display real-time earned rewards using `earned()` function
3. Show staking eligibility status with time remaining
4. Implement proper loading states for async operations
5. Handle both ETH and ERC20 reward tokens appropriately

**中文:**
1. 显示领取按钮前检查最小质押持续时间
2. 使用 `earned()` 函数显示实时获得的奖励
3. 显示质押资格状态和剩余时间
4. 为异步操作实现适当的加载状态
5. 适当处理 ETH 和 ERC20 奖励代币

### For Smart Contract Integration / 智能合约集成

**English:**
1. Always call `notifyRewardAmount()` after sending rewards to the pool
2. Handle both ETH and ERC20 reward distributions
3. Implement proper access control for reward notifications
4. Monitor events for reward tracking and analytics

**中文:**
1. 向池发送奖励后始终调用 `notifyRewardAmount()`
2. 处理 ETH 和 ERC20 奖励分发
3. 为奖励通知实现适当的访问控制
4. 监控事件进行奖励跟踪和分析

## Gas Optimization Tips / Gas 优化建议

### 1. Batch Operations / 批量操作

**English:** Consider batching multiple stakes/unstakes to reduce gas costs.

**中文：** 考虑批量处理多个质押/取消质押以减少 gas 成本。

### 2. Reward Claiming Strategy / 奖励领取策略

**English:** Claim rewards less frequently to reduce gas costs, but consider reward accumulation.

**中文：** 减少奖励领取频率以降低 gas 成本，但要考虑奖励累积。

### 3. Exit Function / 退出函数

**English:** Use `exit()` function to unstake and claim in a single transaction.

**中文：** 使用 `exit()` 函数在单个交易中取消质押和领取。

## Best Practices / 最佳实践

### 1. Reward Distribution / 奖励分发

**English:** Distribute rewards regularly to maintain user engagement and fair distribution.

**中文：** 定期分发奖励以保持用户参与度和公平分发。

### 2. Protocol Fee Management / 协议费用管理

**English:** Keep protocol fees reasonable (< 10%) to maintain user satisfaction.

**中文：** 保持协议费用合理（< 10%）以维持用户满意度。

### 3. Staking Duration / 质押持续时间

**English:** The 1-hour minimum helps prevent flash loan attacks and encourages genuine staking.

**中文：** 1 小时最小值有助于防止闪电贷攻击并鼓励真正的质押。 