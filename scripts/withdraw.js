const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing From Contract...");
    const fundingTxResponse = await fundMe.withdraw();
    await fundingTxResponse.wait(1);

    console.log("Successfully Withdrawn!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
