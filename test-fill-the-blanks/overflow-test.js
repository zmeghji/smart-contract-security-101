const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleToken", function () {
  let deployer, attacker, user;

  beforeEach(async function () {
    [deployer, attacker, user] = await ethers.getSigners();

    const SimpleToken = await ethers.getContractFactory("SimpleToken", deployer);
    this.simpleToken = await SimpleToken.deploy(1000);
  });

  it("Should allow a user to transfer amounts smaller than or equal to its balance", async function () {
    const tokensToTransfer=1;
    await this.simpleToken.transfer(user.address,tokensToTransfer);
    expect(await this.simpleToken.balanceOf(user.address)).to.eq(tokensToTransfer);
  });
  it("Should rever if the user tries to transfer more tokens than they have ", async function () {
    await this.simpleToken.transfer(attacker.address,10);
    await expect(this.simpleToken.connect(attacker).transfer(user.address,11 ))
      .to.be.revertedWith("Not enough tokens");

  });

  
});
