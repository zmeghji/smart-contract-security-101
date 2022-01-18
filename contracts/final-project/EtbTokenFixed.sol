// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;
import "@openzeppelin/contracts-legacy/math/SafeMath.sol";


contract ETBTokenFixed {
  using SafeMath for uint256;
  
  address public owner;
  address public etbDex;
  uint256 public totalSupply;
  string public name = "Eat the Blocks Token";
  string public symbol = "ETBT";
  uint8 public decimals = 18;

  mapping(address => uint256) public balances;
  mapping(address => mapping(address => uint256)) private allowances;

  constructor(uint256 initialSupply) public {
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;
    owner = msg.sender;
  }

  modifier onlyEtbDex() {
    require(msg.sender == etbDex, "Restricted Access");
    _;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Restricted Acces");
    _;
  }

  function setDexAddress(address _dex) external onlyOwner{
    etbDex = _dex;
  }

  function transfer(address recipient, uint256 amount) external {
    require(recipient != address(0), "ERC20: transfer from the zero address");
    require(balances[msg.sender] >= amount, "Not enough balance");

    balances[msg.sender] = balances[msg.sender].sub(amount);
    balances[recipient] = balances[recipient].add(amount);
  }

  function approve(address spender, uint256 amount) external {
    require(spender != address(0), "ERC20: approve to the zero address");

    allowances[msg.sender][spender] = amount;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool) {
    require(allowances[sender][msg.sender]  >= amount, "ERC20: amount exceeds allowance");
    require(balances[sender]  >= amount, "Not enough balance");

    allowances[sender][msg.sender] = allowances[sender][msg.sender].sub(amount);

    balances[sender] = balances[sender].sub(amount);
    balances[recipient] = balances[recipient].add(amount);

    return true;
  }

  function mint(uint256 amount) external onlyEtbDex {
    totalSupply = totalSupply.add(amount);
    balances[owner] = balances[owner].add(amount);
  }

  function burn(address account, uint256 amount) external onlyEtbDex {
    totalSupply = totalSupply.sub(amount);
    balances[account] = balances[account].sub(amount);
  }

  /* --- Getters --- */

  function balanceOf(address account) public view returns (uint256) {
    return balances[account];
  }

  function allowanceOf(address balanceOwner, address spender) public view virtual returns (uint256) {
    return allowances[balanceOwner][spender];
  }
}