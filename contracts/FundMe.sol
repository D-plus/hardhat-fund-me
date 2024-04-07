// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// Imports
import "./PriceConverter.sol";

// Error Codes
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts

// Get funds from users
// Withdraw funds
// Set a minimum funding value in USD

/* constat and immutable - are stored directly into a bite code of a contract and not in the storage,
 this is why constat and immutable variables are gas efficient */

/**
 * @title A contract for  crowd funding
 * @author Dmytro Burzak
 * @notice This contract is a sample funding contract
 * @dev This implemets price feeds as our library
 */
contract FundMe {
    // Type Declarations section

    // Using means to add PriceConverter interface for uint256 values;
    using PriceConverter for uint256;

    // State variables section

    uint256 public constant MINIMUM_USD = 50 * 1e18; // 1e18 == 1 * 10 ** 18
    // "constant" use if variable does not change during contract lifecycle, it is more gas efficient, it is gas optimization;
    // constants consum less gas during contract deployment, and constats are cheaper when call reading of constant varibles

    address[] private s_funders;

    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    // Modifiers section

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // require(msg.sender == i_owner, "You are not the owner of this contract"); // Second argument error message is string array and it would be stored in memory which is not gas efficient.
        _; // _; means code of the function to which this modifier is assigned should be executed here
    }

    // immutable; Variables that are assigned one time but outside of the same line they are declared could be marked as "immutable".
    // immutable variables are gas efficient as constats are;
    // good convention is to name immutable variables with "i_" as prefix

    constructor(address priceFeedAddress) {
        // constructor is a function which is called immediately when we deploy a contract
        i_owner = msg.sender;

        // get contract ABI by Address for ETH/USD for example for Sepolia network the contract address is: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happend if somone send ETH directly to the contracts address without calling fund function?
    /* receive() function - will be triggered as soon as a transaction(WITHOUT CALLDATA) or ETH is sent to the contract (without using contracts ABI)
      fallback() function - https://docs.soliditylang.org/en/latest/contracts.html#fallback-function called when transaction (WITH CALLDATA)
      is sent to the contract or ETH is sent to the contract (without using contracts ABI) but
      function name provided in the CALLDATA does not exists on the contract
    */

    /* https://solidity-by-example.org/sending-ether/
    Which function is called, fallback() or receive()?

           send Ether
               |
         msg.data is empty?
              / \
            yes  no
            /     \
    receive() exists?  fallback()
         /   \
        yes   no
        /      \
    receive()   fallback()
    */

    // Called when someone send eth not using contract`s "fund" function
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev This implemets price feeds as our library
     */
    function fund() public payable {
        // payable: is for sending eth to the contract

        // require: is checker, if condition is not met, than revert will take place and message in second argument will display)
        // revert:
        // undo any prior work in the function happened before code line with "require" keyword, and send remaining gas back for actions happened after "require" code line

        // require(msg.value > 1e18, "Didn't send enough"); // 1e18 == 1 * 10 ** 18 == 1000000000000000000 wei (1 ETH)

        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Did not send enough"
        ); // 1e18 == 1 * 10 ** 18 == 1000000000000000000 wei (1 ETH)
        // msg.value has 18 (zeros)

        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        // reset all the amount for addresses which funded

        /* for(starting index; condition (ending index); step) {} */
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funderAddress = s_funders[funderIndex];

            s_addressToAmountFunded[funderAddress] = 0;
        }

        // reset funders array with empty array of 0 elements
        s_funders = new address[](0);

        // to send native currency(ETH) to the address there are 3 ways to do that: "transfer", "send" and "call"
        // transfer

        // in solidity to transfer native currency we need "payable" address, so we don typecasting in the next row of code (payable(msg.sender)):
        // address(this) where "this"-current contract; means get address of contract provided'
        payable(msg.sender).transfer(address(this).balance); // if this call ends with error - the transaction will be reverted;

        // send

        // "send" method returns bool value indicating if assets were sent: true if sent, false if not sent
        // so if assets were not send we need to revert transaction by ourselves with "require"

        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // call

        // call in combination with re-entrancy guard is the recommended method to use after December 2019.
        // call low level function which allows us to call different function (specified as an call's argument) of a contract. call returns two values,
        // first is bool result state, second is bytes data returned by the function provided to the "call".
        // In our example we provide empty string as "call" argument, this means that we just create a transaction and specify "value" of ETH amount

        // (bool isCallSucceed, bytes memory dataReturned) = payable(msg.sender).call{ value: address(this).balance }(""); // if we provided a function to call to the "call" method instead of "" empty string than it would return result of the function to the dataReturned varible
        // require(isCallSucceed, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funderAddress = funders[funderIndex];

            s_addressToAmountFunded[funderAddress] = 0;
        }

        s_funders = new address[](0);

        payable(msg.sender).transfer(address(this).balance); // if this call ends with error - the transaction will be reverted;
    }

    // View / Pure func

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 funderIndex) public view returns (address) {
        return s_funders[funderIndex];
    }

    function getAddressToAmountFunded(
        address funderAddress
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funderAddress];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
