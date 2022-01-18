// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;
import "@openzeppelin/contracts-legacy/math/SafeMath.sol";

import { ETBToken } from "./EtbToken.sol";

contract EtbDexFixed {

    using SafeMath for uint256;

    address public owner;
    ETBToken private _etbToken;
    uint256 public fee;
    uint256 public feesCollected;
    mapping (address => uint) withdrawals;
    constructor(address _token) public {
        _etbToken = ETBToken(_token);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner!");
        _;
    }

    function buyTokens() external payable {
        require(msg.value > 0, "Should send ETH to buy tokens");
        require(_etbToken.balanceOf(owner)>= msg.value, "Not enough tokens to sell");
        uint buyFee = calculateFee((msg.value));
        feesCollected = feesCollected.add(buyFee);
        _etbToken.transferFrom(owner, msg.sender, msg.value.sub(buyFee));
    }

    function sellTokens(uint256 _amount) external {
        require(_etbToken.balanceOf(msg.sender)  >= _amount, "Not enough tokens");

        _etbToken.burn(msg.sender, _amount);
        _etbToken.mint(_amount);
        withdrawals[msg.sender] = withdrawals[msg.sender].add(_amount);
    }
    function withdraw() public {
        require(withdrawals[msg.sender]>0, "nothing to withdraw");
        sendValue(payable(msg.sender),(withdrawals[msg.sender]));
    }
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        // solhint-disable-next-line avoid-call-value
        (bool success, ) = recipient.call.value(amount)("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    function setFee(uint256 _fee) external onlyOwner() {
        fee = _fee;
    }

    function calculateFee(uint256 _amount) internal view returns (uint256) {
        return (_amount.div( 100)).mul(fee);
    }

    function withdrawFees() external onlyOwner() {
        uint feesToWithdraw = feesCollected;
        feesCollected  =0;
        sendValue(payable(msg.sender), feesToWithdraw);
    }
}
