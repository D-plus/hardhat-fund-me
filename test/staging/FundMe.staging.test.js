// tests on testnet

const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { expect } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.utils.parseEther("0.1"); // ETH

          beforeEach(async () => {
              // Deploy FunMe contract
              deployer = (await getNamedAccounts()).deployer;

              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("allows to fund and withdraw", async function () {
              const fundTxResponse = await fundMe.fund({ value: sendValue });
              await fundTxResponse.wait(1);
              const withdrawTxResponse = await fundMe.withdraw();
              await withdrawTxResponse.wait(1);
              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );

              expect(endingFundMeBalance.toString()).to.equal("0");
          });
      });
