// SPDX-License-Identifier: BUSL-1.1

pragma solidity =0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title BondingCurveMath
 * @dev Library for step-based bonding curve calculations (MCV2 compatible)
 * Uses discrete price steps instead of linear curves for better stability
 */
library BondingCurveMath {
    // Error messages
    error BondingCurveMath__InvalidParameters();
    error BondingCurveMath__SupplyTooLarge();
    error BondingCurveMath__AmountTooLarge();
    error BondingCurveMath__InsufficientSupply();
    error BondingCurveMath__InvalidCurrentSupply();

    // Use uint128 to save storage cost & prevent integer overflow when calculating range * price
    struct BondStep {
        uint128 rangeTo;
        uint128 price; // multiplied by 10**18 for decimals
    }

    /**
     * @dev Calculates the cost to buy tokens using step-based bonding curve
     * @param currentSupply Current token supply
     * @param tokensToMint Amount of tokens to buy
     * @param steps Array of bonding curve steps
     * @param decimals Token decimals (usually 18)
     * @return reserveAmount Total cost in reserve tokens
     */
    function calculateBuyCost(
        uint256 currentSupply,
        uint256 tokensToMint,
        BondStep[] memory steps,
        uint256 decimals
    ) internal pure returns (uint256 reserveAmount) {
        if (tokensToMint == 0) return 0;

        uint256 multiFactor = 10 ** decimals;
        uint256 tokensLeft = tokensToMint;
        uint256 reserveToBond = 0;
        uint256 supplyLeft;

        for (
            uint256 i = getCurrentStep(currentSupply, steps);
            i < steps.length;
            ++i
        ) {
            BondStep memory step = steps[i];
            supplyLeft = step.rangeTo - currentSupply;

            if (supplyLeft < tokensLeft) {
                if (supplyLeft == 0) continue;

                // Ensure reserve is calculated with ceiling
                reserveToBond += Math.ceilDiv(
                    supplyLeft * step.price,
                    multiFactor
                );
                currentSupply += supplyLeft;
                tokensLeft -= supplyLeft;
            } else {
                // Ensure reserve is calculated with ceiling
                reserveToBond += Math.ceilDiv(
                    tokensLeft * step.price,
                    multiFactor
                );
                tokensLeft = 0;
                break;
            }
        }

        if (reserveToBond == 0 || tokensLeft > 0)
            revert BondingCurveMath__InvalidParameters();

        reserveAmount = reserveToBond;
    }

    /**
     * @dev Calculates the refund for selling tokens using step-based bonding curve
     * @param currentSupply Current token supply (before selling)
     * @param tokensToBurn Amount of tokens to sell
     * @param steps Array of bonding curve steps
     * @param decimals Token decimals (usually 18)
     * @return refundAmount Total refund in reserve tokens
     */
    function calculateSellRefund(
        uint256 currentSupply,
        uint256 tokensToBurn,
        BondStep[] memory steps,
        uint256 decimals
    ) internal pure returns (uint256 refundAmount) {
        if (tokensToBurn == 0) return 0;
        if (tokensToBurn > currentSupply)
            revert BondingCurveMath__InsufficientSupply();

        uint256 multiFactor = 10 ** decimals;
        uint256 reserveFromBond;
        uint256 tokensLeft = tokensToBurn;
        uint256 i = getCurrentStep(currentSupply, steps);

        while (tokensLeft > 0) {
            uint256 supplyLeft = i == 0
                ? currentSupply
                : currentSupply - steps[i - 1].rangeTo;

            uint256 tokensToProcess = tokensLeft < supplyLeft
                ? tokensLeft
                : supplyLeft;
            reserveFromBond += ((tokensToProcess * steps[i].price) /
                multiFactor);

            tokensLeft -= tokensToProcess;
            currentSupply -= tokensToProcess;

            if (i > 0) --i;
        }

        if (tokensLeft > 0) revert BondingCurveMath__InvalidParameters();

        refundAmount = reserveFromBond;
    }

    /**
     * @dev Calculates the current price per token based on supply
     * @param supply Current token supply
     * @param steps Array of bonding curve steps
     * @return price Current price per token
     */
    function getCurrentPrice(
        uint256 supply,
        BondStep[] memory steps
    ) internal pure returns (uint256 price) {
        uint256 stepIndex = getCurrentStep(supply, steps);
        price = steps[stepIndex].price;
    }

    /**
     * @dev Gets the current step index for a given supply
     * @param currentSupply Current token supply
     * @param steps Array of bonding curve steps
     * @return stepIndex Current step index
     */
    function getCurrentStep(
        uint256 currentSupply,
        BondStep[] memory steps
    ) internal pure returns (uint256 stepIndex) {
        for (uint256 i = 0; i < steps.length; ++i) {
            if (currentSupply <= steps[i].rangeTo) {
                return i;
            }
        }
        revert BondingCurveMath__InvalidCurrentSupply();
    }

    /**
     * @dev Calculates maximum supply from steps
     * @param steps Array of bonding curve steps
     * @return maxSupply Maximum token supply
     */
    function getMaxSupply(
        BondStep[] memory steps
    ) internal pure returns (uint256 maxSupply) {
        if (steps.length == 0) return 0;
        maxSupply = steps[steps.length - 1].rangeTo;
    }

    /**
     * @dev Validates bonding curve steps
     * @param steps Array of bonding curve steps
     */
    function validateSteps(BondStep[] memory steps) internal pure {
        if (steps.length == 0) revert BondingCurveMath__InvalidParameters();

        uint256 lastRange = 0;
        for (uint256 i = 0; i < steps.length; i++) {
            if (steps[i].rangeTo <= lastRange)
                revert BondingCurveMath__InvalidParameters();
            lastRange = steps[i].rangeTo;
        }
    }

    /**
     * @dev Calculates how many tokens can be bought with a given amount of reserve tokens
     * @param currentSupply Current token supply
     * @param reserveAmount Amount of reserve tokens to spend
     * @param steps Array of bonding curve steps
     * @param decimals Token decimals
     * @return tokenAmount Number of tokens that can be bought
     */
    function calculateTokensForReserve(
        uint256 currentSupply,
        uint256 reserveAmount,
        BondStep[] memory steps,
        uint256 decimals
    ) internal pure returns (uint256 tokenAmount) {
        if (reserveAmount == 0) return 0;

        uint256 multiFactor = 10 ** decimals;
        uint256 remainingReserve = reserveAmount;
        uint256 totalTokens = 0;
        uint256 supply = currentSupply;

        for (
            uint256 i = getCurrentStep(supply, steps);
            i < steps.length && remainingReserve > 0;
            ++i
        ) {
            BondStep memory step = steps[i];
            uint256 tokensInStep = step.rangeTo - supply;

            if (tokensInStep == 0) {
                supply = step.rangeTo;
                continue;
            }

            uint256 costForStep = Math.ceilDiv(
                tokensInStep * step.price,
                multiFactor
            );

            if (remainingReserve >= costForStep) {
                // Can afford all tokens in this step
                totalTokens += tokensInStep;
                remainingReserve -= costForStep;
                supply = step.rangeTo;
            } else {
                // Can only afford partial tokens in this step
                uint256 affordableTokens = (remainingReserve * multiFactor) /
                    step.price;
                totalTokens += affordableTokens;
                remainingReserve = 0;
            }
        }

        tokenAmount = totalTokens;
    }
}
