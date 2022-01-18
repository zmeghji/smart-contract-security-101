const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Final Project", function () {
  let deployer, user, user_2;

  beforeEach(async function () {
    [deployer, user, user_2] = await ethers.getSigners();

    // const EtbToken = await ethers.getContractFactory("ETBToken", deployer);
    const EtbToken = await ethers.getContractFactory("ETBTokenFixed", deployer);
    this.etbToken = await EtbToken.deploy(ethers.utils.parseEther("1000"));

    // const EtbDex = await ethers.getContractFactory("EtbDex", deployer);
    const EtbDex = await ethers.getContractFactory("EtbDexFixed", deployer);
    // this.etbDex = await EtbDex.deploy(this.etbToken.address, ethers.utils.formatBytes32String("eatTheBlocks"));
    this.etbDex = await EtbDex.deploy(this.etbToken.address);


    // await this.etbDex.setFee(1, ethers.utils.formatBytes32String("eatTheBlocks"));
    await this.etbDex.setFee(1);

    await this.etbToken.setDexAddress(this.etbDex.address);
    await this.etbToken.approve(this.etbDex.address, ethers.utils.parseEther("1000"));
  });

  describe("ETB Token", function () {
    it("totalSupply should match Initial supply", async function () {
      expect(await this.etbToken.totalSupply()).to.eq(ethers.utils.parseEther("1000"));
    });
    // 😃 Let's test every path for every function!
    describe("setDexAddress function", function () {
      it("Should let the owner set the dex address", async function(){
        const newDexAddress ="0x19e1B6ABE026b56AD302dC8BdF60e4af92752f0e";
        this.etbToken.setDexAddress(newDexAddress);
        expect(await this.etbToken.etbDex()).to.eq(newDexAddress);
      });

      it("Should not let someone other than owner set dex address ", async function(){
        const newDexAddress ="0x19e1B6ABE026b56AD302dC8BdF60e4af92752f0e";
        await expect(this.etbToken.connect(user).setDexAddress(newDexAddress))
          .to.be.revertedWith("Restricted Acces");
      });
    });
    describe("transfer function", function () {
      it("should let the user transfer tokens if they have sufficient balance", async function(){
        const tokensTransferred = 100;
        const initialUserBalance = await this.etbToken.balanceOf(user.address);
        await this.etbToken.transfer(user.address, 100);
        const finalUserBalance  = await this.etbToken.balanceOf(user.address);
        expect(finalUserBalance).to.eq(initialUserBalance+tokensTransferred)
      })

      it("should not let the user transfer tokens if they have insufficient balance", async function(){
        const tokensTransferred = 100;
        await expect (this.etbToken.connect(user_2).transfer(user.address, 100))
          .to.be.revertedWith("Not enough balance")
      })

    })

    describe("transferFrom function", function () {
      it("should allow transferring from another address if allowance is sufficient", async function(){
        const tokensToTransfer = 50;

        await this.etbToken.transfer(user.address, tokensToTransfer);
        await this.etbToken.connect(user).approve(user_2.address, tokensToTransfer);

        await this.etbToken.connect(user_2).transferFrom(user.address, user_2.address, tokensToTransfer);

        const finalUser1TokenBalance = await this.etbToken.balanceOf(user.address);
        const finalUser2TokenBalance = await this.etbToken.balanceOf(user_2.address);
        expect(finalUser1TokenBalance).to.eq(0);
        expect(finalUser2TokenBalance).to.eq(tokensToTransfer);
      })
      it("should not allow transferring from another address if allowance is insufficient", async function(){
        await expect (this.etbToken.connect(user_2).transferFrom(deployer.address, user_2.address, 50))
          .to.be.revertedWith("ERC20: amount exceeds allowance");
      })
    })
    describe("mint function", function () {
      it("should let the dex mint more tokens", async function(){

        // console.log(`dex address: ${await this.etbToken.etbDex()}`)
        // console.log(`expected address: ${this.etbDex.address}`)
        // const tokensToMint =1000;
        // const initialTokenBalanceOfOwner = await this.etbToken.balanceOf(deployer.address);
        // const initialTotalSupply = await this.etbToken.totalSupply();

        // await this.etbToken.connect(this.etbDex.signer).mint(tokensToMint);
        // expect (await this.etbToken.balanceOf(deployer.address))
        //   .to.eq(initialTokenBalanceOfOwner+tokensToMint);
        // expect (await this.etbToken.totalSupply())
        //   .to.eq(initialTotalSupply+tokensToMint);
      })

    })
  });
  describe("EtbDex", function () {
    describe("buyTokens function", function(){
      it("Should let a user buy tokens if they have enough ether", async function(){;
        const numberOfTokens = 1000;
        await this.etbDex.connect(user).buyTokens({value: numberOfTokens});

        expect(await this.etbToken.balanceOf(user.address)).to.eq(numberOfTokens*.99)
      })
      it("Should not let a user buy tokens if they don't send eth", async function(){
        // await user.sendTransaction({
        //   to: user_2.address,
        //   value: ethers.utils.parseEther("9500")
        // });
        // const userBalance = await ethers.provider.getBalance(user.address)
        // console.log(`balance: ${userBalance}`)
        await expect(this.etbDex.connect(user).buyTokens({value: 0}))
          .to.be.revertedWith("Should send ETH to buy tokens");
      })

    })
    describe("sellTokens function", function(){
      it ("Should allow user to sell tokens if they have enough", async function(){
        const numberOfTokens = 1000;
        await this.etbToken.transfer(user.address, numberOfTokens);

        expect (await this.etbToken.balanceOf(user.address)).to.eq(numberOfTokens);

        await this.etbDex.connect(user).sellTokens(1000);

        expect (await this.etbToken.balanceOf(user.address)).to.eq(0);
      })

      it("Shouldn't allow a user to sell tokens if they don't have enough",async function(){
        await expect(this.etbDex.connect(user).sellTokens(1000))
          .to.be.revertedWith("Not enough tokens");
      })

    })
    describe("setFee function", function(){
      it ("should let the owner change the fee", async function(){
        const initialFee = await this.etbDex.fee();
        const newFee = initialFee+1;

        // await this.etbDex.setFee(newFee,ethers.utils.formatBytes32String("eatTheBlocks"));
        await this.etbDex.setFee(newFee);

        expect(await this.etbDex.fee(), newFee);
      })
      it ("shouldn't let anyone other than the owner change the fee", async function(){
        // await expect(this.etbDex.connect(user).setFee(1,ethers.utils.formatBytes32String("eatTheBlocks")))
        //   .to.be.revertedWith( "You are not the owner!");
        await expect(this.etbDex.connect(user).setFee(1))
          .to.be.revertedWith( "You are not the owner!");
      })
    })
    // describe("setFee function", function(){
    //   it("should let the owner change the fee", async () => {
    //     // const initialFee = await this.etbDex.fee();
    //     // const newFee = initialFee+1;

    //     // await this.etbDex.setFee(newFee);
    //     // expect(await this.etbDex.fee(), newFee);

    //     await this.etbDex.setFee(2);
    //     expect(await this.etbDex.fee(), 2);
    //   })
    // })
    it("...");
  });
});
