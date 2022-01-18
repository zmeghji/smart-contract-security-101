// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

import { ETBToken } from "./EtbToken.sol";

contract EtbDex {
  address public owner;
  ETBToken private _etbToken;
  uint256 public fee;
  //vulnerability: confidentiality - password is public on blockchain
  bytes32 private password;

  constructor(address _token, bytes32 _password) public {
    _etbToken = ETBToken(_token);
    password = _password;
    owner = msg.sender;
  }

  //vulnerability: confidentiality - password is public on blockchain
  modifier onlyOwner(bytes32 _password) {
    require(password == _password, "You are not the owner!");
    _;
  }

  function buyTokens() external payable {
    require(msg.value > 0, "Should send ETH to buy tokens");
    //vulnerability: underflow
    require(_etbToken.balanceOf(owner) - msg.value >= 0, "Not enough tokens to sell");
    _etbToken.transferFrom(owner, msg.sender, msg.value - calculateFee(msg.value));
  }

  function sellTokens(uint256 _amount) external {
    //vulnerability: underflow
    require(_etbToken.balanceOf(msg.sender) - _amount >= 0, "Not enough tokens");

    //vulnerability: re-entrancy
    //vulnerability: not checking status of call 
    //vulnerability: Dos attack (not using pull over push)
    //vulnerability: using send instead of call
    payable(msg.sender).send(_amount);

    _etbToken.burn(msg.sender, _amount);
    _etbToken.mint(_amount);
  }

  function setFee(uint256 _fee, bytes32 _password) external onlyOwner(_password) {
    fee = _fee;
  }

  function calculateFee(uint256 _amount) internal view returns (uint256) {
    //Not using safeMath
    return (_amount / 100) * fee;
  }

  function withdrawFees(bytes32 _password) external onlyOwner(_password) {
    payable(msg.sender).send(address(this).balance);
  }
}
