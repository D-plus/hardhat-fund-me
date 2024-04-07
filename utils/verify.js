const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
    console.log("Verifying the contract:)");

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verifyed")) {
            console.log("Already verifyed");
        } else {
            console.log(e);
        }
    }
};

module.exports = {
    verify,
};
