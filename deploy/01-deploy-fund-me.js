const { network } = require("hardhat");
const {
    netwrokConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        // if it is development network - work with mocks
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        console.log("netwrokConfig[chainId] ", chainId, netwrokConfig[chainId]);
        ethUsdPriceFeedAddress = netwrokConfig[chainId].ethUsdPriceFeedAddress;
    }

    const args = [ethUsdPriceFeedAddress];
    // when on localhost network or hardhat network use a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args, // pass price feed address for ETH/USD for example for Sepolia network the contract address is: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        log: true,
        waitConfirmations: network.config.blockConfiramtions || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // Verify contract on etherscan programmatically
        await verify(fundMe.address, args);
    }
    log("-----------------------------------");
};

module.exports.tags = ["all", "fundme"];
