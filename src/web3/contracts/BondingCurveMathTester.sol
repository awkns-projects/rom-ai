// SPDX-License-Identifier: BUSL-1.1
pragma solidity =0.8.20;

import "./libraries/BondingCurveMath.sol";

contract BondingCurveMathTester {
    function validateSteps(
        BondingCurveMath.BondStep[] calldata steps
    ) external pure {
        BondingCurveMath.validateSteps(steps);
    }

    function getCurrentPrice(
        uint256 supply,
        BondingCurveMath.BondStep[] calldata steps
    ) external pure returns (uint256) {
        return BondingCurveMath.getCurrentPrice(supply, steps);
    }

    function calculateBuyCost(
        uint256 currentSupply,
        uint256 tokensToMint,
        BondingCurveMath.BondStep[] calldata steps,
        uint256 decimals
    ) external pure returns (uint256) {
        return
            BondingCurveMath.calculateBuyCost(
                currentSupply,
                tokensToMint,
                steps,
                decimals
            );
    }

    function calculateSellRefund(
        uint256 currentSupply,
        uint256 tokensToBurn,
        BondingCurveMath.BondStep[] calldata steps,
        uint256 decimals
    ) external pure returns (uint256) {
        return
            BondingCurveMath.calculateSellRefund(
                currentSupply,
                tokensToBurn,
                steps,
                decimals
            );
    }

    function calculateTokensForReserve(
        uint256 currentSupply,
        uint256 reserveAmount,
        BondingCurveMath.BondStep[] calldata steps,
        uint256 decimals
    ) external pure returns (uint256) {
        return
            BondingCurveMath.calculateTokensForReserve(
                currentSupply,
                reserveAmount,
                steps,
                decimals
            );
    }

    function getCurrentStep(
        uint256 currentSupply,
        BondingCurveMath.BondStep[] calldata steps
    ) external pure returns (uint256) {
        return BondingCurveMath.getCurrentStep(currentSupply, steps);
    }

    function getMaxSupply(
        BondingCurveMath.BondStep[] calldata steps
    ) external pure returns (uint256) {
        return BondingCurveMath.getMaxSupply(steps);
    }
}
