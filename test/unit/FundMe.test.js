const { expect, assert } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe("FundME", async () => {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1"); // ETH

          beforeEach(async () => {
              // Deploy FunMe contract
              // const accounts = await ethers.getSigners();
              // const firstAccount = accounts[0];

              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", () => {
              it("sets the priceFeed aggregator address correctly", async function () {
                  const fundMeAggregator = await fundMe.getPriceFeed();
                  // console.log("fundMeAggregator ", fundMeAggregator);
                  // console.log("mockV3Aggregator ", mockV3Aggregator);

                  assert.equal(fundMeAggregator, mockV3Aggregator.address);
              });
          });

          describe("fund", () => {
              it("fails if you don't send enouth ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Did not send enough"
                  );
              });

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funderAmountFunded =
                      await fundMe.getAddressToAmountFunded(deployer);

                  expect(funderAmountFunded.toString()).to.equal(
                      sendValue.toString()
                  );
              });

              it("adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funderOnFundersArray = await fundMe.getFunder(0);

                  expect(funderOnFundersArray).to.equal(deployer);
              });
          });

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single funder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const withdrawTrasactionResponse = await fundMe.withdraw();
                  const withdrawTrasactionReceipt =
                      await withdrawTrasactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } =
                      withdrawTrasactionReceipt;
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  expect(endingFundMeBalance).to.equal(0);
                  expect(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ).to.equal(
                      endingDeployerBalance.add(totalGasUsed).toString() // add gas which spend during withdraw from startingFundMeBalance
                  );
              });

              it("allows withdraw ETH when there are multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const withdrawTrasactionResponse = await fundMe.withdraw();
                  const withdrawTrasactionReceipt =
                      await withdrawTrasactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } =
                      withdrawTrasactionReceipt;
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  expect(endingFundMeBalance).to.equal(0);
                  expect(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ).to.equal(
                      endingDeployerBalance.add(totalGasUsed).toString() // add gas which spend during withdraw from startingFundMeBalance
                  );

                  // Check on funders reset properly
                  expect(fundMe.getFunder(0)).to.be.reverted;
                  for (let i = 1; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      ).to.equal(0);
                  }
              });

              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attackerAccount = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attackerAccount
                  );

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner");
              });
          });

          describe("cheaperWithdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single funder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const withdrawTrasactionResponse =
                      await fundMe.cheaperWithdraw();
                  const withdrawTrasactionReceipt =
                      await withdrawTrasactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } =
                      withdrawTrasactionReceipt;
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  expect(endingFundMeBalance).to.equal(0);
                  expect(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ).to.equal(
                      endingDeployerBalance.add(totalGasUsed).toString() // add gas which spend during withdraw from startingFundMeBalance
                  );
              });

              it("allows withdraw ETH when there are multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  const withdrawTrasactionResponse =
                      await fundMe.cheaperWithdraw();
                  const withdrawTrasactionReceipt =
                      await withdrawTrasactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } =
                      withdrawTrasactionReceipt;
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  expect(endingFundMeBalance).to.equal(0);
                  expect(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ).to.equal(
                      endingDeployerBalance.add(totalGasUsed).toString() // add gas which spend during withdraw from startingFundMeBalance
                  );

                  // Check on funders reset properly
                  expect(fundMe.getFunder(0)).to.be.reverted;
                  for (let i = 1; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      ).to.equal(0);
                  }
              });

              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attackerAccount = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attackerAccount
                  );

                  await expect(
                      attackerConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__NotOwner");
              });
          });
      })
    : describe.skip;
