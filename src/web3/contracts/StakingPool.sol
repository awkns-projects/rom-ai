// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title StakingPool
 * @dev Staking pool that distributes NFT mint revenue to stakers based on their stake ratio
 */
contract StakingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Error messages
    error StakingPool__AlreadyInitialized();
    error StakingPool__InvalidCreator();
    error StakingPool__InvalidStakingToken();
    error StakingPool__InvalidNFTCollection();
    error StakingPool__InvalidAmount();
    error StakingPool__InsufficientBalance();
    error StakingPool__InsufficientStake();
    error StakingPool__Unauthorized();
    error StakingPool__TransferFailed();
    error StakingPool__ProtocolFeeTransferFailed();
    error StakingPool__InsufficientStakingDuration();

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event ProtocolFeePaid(uint256 amount);

    // Constants
    address public constant ETH_ADDRESS = address(0);
    uint256 public constant MINIMUM_STAKE_DURATION = 1 hours;
    uint256 private constant PRECISION = 1e18;

    // State variables
    bool private _initialized;
    address public creator;
    address public stakingToken;
    address public nftCollection;
    address public rewardToken;

    // Protocol fee settings
    address public protocolFeeRecipient;
    uint256 public protocolFeeBps; // Basis points (10000 = 100%)

    // Staking state
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;

    // Reward distribution
    uint256 public totalRewards;
    uint256 public distributedRewards;

    // User mappings
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public stakingStartTime;

    // Active stakers for gas-efficient reward distribution
    address[] public stakers;
    mapping(address => bool) public isStaker;
    mapping(address => uint256) public stakerIndex;

    /**
     * @dev Constructor - creates an uninitialized implementation
     */
    constructor() {
        // Implementation contract - will be cloned
    }

    /**
     * @dev Initializes the staking pool
     * @param creator_ The creator of the pool
     * @param stakingToken_ The token to stake
     * @param nftCollection_ The NFT collection providing rewards
     * @param rewardToken_ The reward token (address(0) for ETH)
     * @param protocolFeeRecipient_ The address to receive protocol fees
     * @param protocolFeeBps_ The protocol fee in basis points
     */
    function initialize(
        address creator_,
        address stakingToken_,
        address nftCollection_,
        address rewardToken_,
        address protocolFeeRecipient_,
        uint256 protocolFeeBps_
    ) external {
        if (_initialized) revert StakingPool__AlreadyInitialized();
        if (creator_ == address(0)) revert StakingPool__InvalidCreator();
        if (stakingToken_ == address(0))
            revert StakingPool__InvalidStakingToken();
        if (nftCollection_ == address(0))
            revert StakingPool__InvalidNFTCollection();

        _initialized = true;
        creator = creator_;
        stakingToken = stakingToken_;
        nftCollection = nftCollection_;
        rewardToken = rewardToken_;
        protocolFeeRecipient = protocolFeeRecipient_;
        protocolFeeBps = protocolFeeBps_;
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Stakes tokens into the pool
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert StakingPool__InvalidAmount();

        _updateReward(msg.sender);

        // Transfer tokens from user
        IERC20(stakingToken).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Update user's staked balance
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        // Add to stakers list if first time staking
        if (!isStaker[msg.sender]) {
            isStaker[msg.sender] = true;
            stakerIndex[msg.sender] = stakers.length;
            stakers.push(msg.sender);
            // Set staking start time for new stakers
            stakingStartTime[msg.sender] = block.timestamp;
        }

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstakes tokens from the pool
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert StakingPool__InvalidAmount();
        if (stakedBalance[msg.sender] < amount)
            revert StakingPool__InsufficientStake();

        _updateReward(msg.sender);

        // Update user's staked balance
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // Remove from stakers list if no more stake
        if (stakedBalance[msg.sender] == 0 && isStaker[msg.sender]) {
            _removeStaker(msg.sender);
            // Reset staking start time when fully unstaked
            stakingStartTime[msg.sender] = 0;
        }

        // Transfer tokens to user
        IERC20(stakingToken).safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claims pending rewards
     */
    function claimRewards() external nonReentrant {
        // Check minimum staking duration
        if (
            stakingStartTime[msg.sender] == 0 ||
            block.timestamp <
            stakingStartTime[msg.sender] + MINIMUM_STAKE_DURATION
        ) {
            revert StakingPool__InsufficientStakingDuration();
        }

        _updateReward(msg.sender);

        uint256 reward = pendingRewards[msg.sender];
        if (reward == 0) return;

        uint256 protocolFee = (reward * protocolFeeBps) / 10000;
        uint256 netReward = reward - protocolFee;

        pendingRewards[msg.sender] = 0;
        distributedRewards += reward;

        // Pay protocol fee
        if (protocolFee > 0 && protocolFeeRecipient != address(0)) {
            if (rewardToken == ETH_ADDRESS) {
                (bool success, ) = protocolFeeRecipient.call{
                    value: protocolFee
                }("");
                if (!success) revert StakingPool__ProtocolFeeTransferFailed();
            } else {
                IERC20(rewardToken).safeTransfer(
                    protocolFeeRecipient,
                    protocolFee
                );
            }
            emit ProtocolFeePaid(protocolFee);
        }

        // Transfer net rewards to user
        if (rewardToken == ETH_ADDRESS) {
            (bool success, ) = msg.sender.call{value: netReward}("");
            if (!success) revert StakingPool__TransferFailed();
        } else {
            IERC20(rewardToken).safeTransfer(msg.sender, netReward);
        }

        emit RewardsClaimed(msg.sender, netReward);
    }

    /**
     * @dev Exits the pool (unstake all and claim rewards)
     */
    function exit() external {
        uint256 balance = stakedBalance[msg.sender];
        if (balance > 0) {
            this.unstake(balance);
        }
        this.claimRewards();
    }

    /**
     * @dev Notifies the pool of new rewards (called by NFT collection)
     * @param reward Amount of new rewards
     */
    function notifyRewardAmount(uint256 reward) external {
        if (msg.sender != nftCollection) revert StakingPool__Unauthorized();
        if (reward == 0) return;

        _updateRewardPerToken();

        totalRewards += reward;

        emit RewardsAdded(reward);
    }

    /**
     * @dev Updates reward calculations for a user
     * @param user The user to update
     */
    function _updateReward(address user) internal {
        _updateRewardPerToken();

        if (user != address(0)) {
            pendingRewards[user] = _earned(user);
            userRewardPerTokenPaid[user] = rewardPerTokenStored;
        }
    }

    /**
     * @dev Updates the reward per token stored
     */
    function _updateRewardPerToken() internal {
        if (totalStaked == 0) {
            lastUpdateTime = block.timestamp;
            return;
        }

        uint256 pendingRewardAmount = totalRewards - distributedRewards;
        if (pendingRewardAmount > 0) {
            rewardPerTokenStored +=
                (pendingRewardAmount * PRECISION) /
                totalStaked;
        }

        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Calculates earned rewards for a user
     * @param user The user to calculate for
     * @return The amount of rewards earned
     */
    function _earned(address user) internal view returns (uint256) {
        return
            ((stakedBalance[user] *
                (rewardPerTokenStored - userRewardPerTokenPaid[user])) /
                PRECISION) + pendingRewards[user];
    }

    /**
     * @dev Removes a staker from the stakers array
     * @param staker The staker to remove
     */
    function _removeStaker(address staker) internal {
        if (!isStaker[staker]) return;

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
    }

    /**
     * @dev Gets earned rewards for a user
     * @param user The user to check
     * @return The amount of rewards earned
     */
    function earned(address user) external view returns (uint256) {
        if (totalStaked == 0) {
            return pendingRewards[user];
        }

        uint256 pendingRewardAmount = totalRewards - distributedRewards;
        uint256 currentRewardPerToken = rewardPerTokenStored;

        if (pendingRewardAmount > 0) {
            currentRewardPerToken +=
                (pendingRewardAmount * PRECISION) /
                totalStaked;
        }

        return
            ((stakedBalance[user] *
                (currentRewardPerToken - userRewardPerTokenPaid[user])) /
                PRECISION) + pendingRewards[user];
    }

    /**
     * @dev Gets the current reward per token
     * @return The current reward per token
     */
    function rewardPerToken() external view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        uint256 pendingRewardAmount = totalRewards - distributedRewards;
        if (pendingRewardAmount == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (pendingRewardAmount * PRECISION) /
            totalStaked;
    }

    /**
     * @dev Gets the total number of stakers
     * @return The number of active stakers
     */
    function getStakerCount() external view returns (uint256) {
        return stakers.length;
    }

    /**
     * @dev Gets stakers with pagination
     * @param offset Starting index
     * @param limit Number of stakers to return
     * @return result Array of staker addresses
     */
    function getStakers(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory result) {
        uint256 total = stakers.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = stakers[i];
        }
    }

    /**
     * @dev Gets pool information
     * @return creator_ The pool creator
     * @return stakingToken_ The staking token
     * @return nftCollection_ The NFT collection
     * @return rewardToken_ The reward token
     * @return totalStaked_ Total amount staked
     * @return totalRewards_ Total rewards added
     * @return distributedRewards_ Total rewards distributed
     * @return stakerCount_ Number of active stakers
     */
    function getPoolInfo()
        external
        view
        returns (
            address creator_,
            address stakingToken_,
            address nftCollection_,
            address rewardToken_,
            uint256 totalStaked_,
            uint256 totalRewards_,
            uint256 distributedRewards_,
            uint256 stakerCount_
        )
    {
        return (
            creator,
            stakingToken,
            nftCollection,
            rewardToken,
            totalStaked,
            totalRewards,
            distributedRewards,
            stakers.length
        );
    }

    /**
     * @dev Gets user staking information
     * @param user The user to check
     * @return stakedAmount Amount staked by user
     * @return earnedAmount Rewards earned by user
     * @return isActiveStaker Whether user is an active staker
     */
    function getUserInfo(
        address user
    )
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 earnedAmount,
            bool isActiveStaker
        )
    {
        return (stakedBalance[user], this.earned(user), isStaker[user]);
    }

    /**
     * @dev Checks if user is eligible to claim rewards
     * @param user The user address to check
     * @return eligible Whether the user can claim rewards
     * @return timeRemaining Seconds remaining until eligible (0 if eligible)
     */
    function isEligibleForRewards(
        address user
    ) external view returns (bool eligible, uint256 timeRemaining) {
        if (stakingStartTime[user] == 0) {
            return (false, 0); // Never staked
        }

        uint256 stakingDuration = block.timestamp - stakingStartTime[user];
        if (stakingDuration >= MINIMUM_STAKE_DURATION) {
            return (true, 0);
        } else {
            return (false, MINIMUM_STAKE_DURATION - stakingDuration);
        }
    }

    /**
     * @dev Gets the remaining time until reward eligibility
     * @param user The user address to check
     * @return timeRemaining Seconds remaining (0 if eligible)
     */
    function getTimeUntilEligible(
        address user
    ) external view returns (uint256 timeRemaining) {
        (, timeRemaining) = this.isEligibleForRewards(user);
        return timeRemaining;
    }

    /**
     * @dev Receive function to accept ETH rewards
     */
    receive() external payable {
        // Allow contract to receive ETH rewards
    }
}
