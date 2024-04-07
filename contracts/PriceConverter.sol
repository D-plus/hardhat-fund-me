// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Libraries can not have state and can not send ether
// All the function in a library are going to be internal
library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // price of ETH/USD
        // 3000.00000000  price has 11 (zeros)

        return uint256(price * 1e10); // 1**10 == 10000000000
        // uint256(<int256 value>) it is type casting, unit256 can be typecasted into int256 and viseversa
    }

    function getVersion() public view returns (uint256) {
        return
            AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306)
                .version();
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // Returns value with 18 decimal places
        uint256 ethPrice = getPrice(priceFeed);
        uint256 totalPriceOfEthInUSD = (ethPrice * ethAmount) / 1e18; // 1e18 to remove 18 zeros since there will be 36 zeros after multiplication (ethPrice * ethAmount)

        return totalPriceOfEthInUSD;
    }
}
