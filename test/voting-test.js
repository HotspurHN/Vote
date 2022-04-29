const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vote", function () {

  const delay = 7890000;
  const depositValue = ethers.BigNumber.from("100000000000000000");
  const tax = 10;

  before(async () => {
    [this.owner, this.addr1, this.addr2, this.addr3, this.addr4] = await ethers.getSigners();
    this.Vote = await ethers.getContractFactory("Vote");
  });

  beforeEach(async () => {
    this.voting = await this.Vote.deploy(delay, depositValue, tax);
    await this.voting.deployed();
  });

  describe("addVoting", () => {
    it("Should add new open voting with lockDate equals now + delay", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      var result = await this.voting.getVoting(0);

      expect(result.isOpen).to.be.true;
      expect(result.lockTime).to.equals(timestampBefore + delay);

      expect(result.candidates.length).to.equals(2);
      expect(result.candidates).contains(this.addr1.address);
      expect(result.candidates).contains(this.addr2.address);

      expect(result.votes.length).to.equals(2);
      expect(result.votes[0]).to.equals(0);
      expect(result.votes[1]).to.equals(0);
    });
  });

  describe("vote", () => {
    it("Should be able to vote once per voter", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      });

      await expect(this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      })).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You have already voted'");

    });

    it("Should be able to vote only with deposite of 0.1 eth", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      });

      await expect(this.voting.vote(1, 0, {
        value: ethers.utils.parseEther("1")
      })).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You must deposit 100000000000000000 wei to vote'");

      await expect(this.voting.vote(2, 0, {
        value: ethers.utils.parseEther("0")
      })).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You must deposit 100000000000000000 wei to vote'");
    });

    it("Should be increased deposite after vote", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      var tx = await this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      });
      await tx.wait();

      var result = await this.voting.getVoting(0);
      var balanceOfContract = await ethers.provider.getBalance(this.voting.address);

      expect(result.deposits).to.equals(ethers.utils.parseEther("0.1"));
      expect(balanceOfContract).to.equals(ethers.utils.parseEther("0.1"));
    });

    it("Should not be possible to vote on closed voting", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");
      await this.voting.finish(0);

      await expect(this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      })).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Voting is closed'");
    });

    it("Should not be possible to vote on outdated voting", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);
      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await expect(this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      })).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Voting is outdated'");
    });
  });

  describe("finish", () => {
    it("Should be able finish voting after delay period", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await this.voting.finish(0);

      var result = await this.voting.getVoting(0);
      expect(result.isOpen).to.be.false;
    });

    it("Should be transfered prize to winner with max votes", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      var oldBalance = await ethers.provider.getBalance(this.addr1.address);

      await (
        await this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      })).wait();
      
      await (
        await this.voting.connect(this.addr3).vote(0, 0, {
          value: ethers.utils.parseEther("0.1")
        })).wait();

      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await (
        await this.voting.finish(0)
      ).wait();

      var newBalance = await ethers.provider.getBalance(this.addr1.address);
      var balanceOfContract = await ethers.provider.getBalance(this.voting.address);

      expect(newBalance.sub(oldBalance)).to.equals(ethers.utils.parseEther("0.18"));
      expect(balanceOfContract).to.equals(ethers.utils.parseEther("0.02"));
    });

    it("Should be prize devided between all winners", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      var oldBalance = await ethers.provider.getBalance(this.addr1.address);
      var oldBalance2 = await ethers.provider.getBalance(this.addr2.address);

      await (
        await this.voting.vote(0, 0, {
        value: ethers.utils.parseEther("0.1")
      })).wait();
      
      await (
        await this.voting.connect(this.addr3).vote(0, 1, {
          value: ethers.utils.parseEther("0.1")
        })).wait();

      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await (
        await this.voting.finish(0)
      ).wait();

      var newBalance = await ethers.provider.getBalance(this.addr1.address);
      var newBalance2 = await ethers.provider.getBalance(this.addr2.address);
      var balanceOfContract = await ethers.provider.getBalance(this.voting.address);

      expect(newBalance.sub(oldBalance)).to.equals(ethers.utils.parseEther("0.09"));
      expect(newBalance2.sub(oldBalance2)).to.equals(ethers.utils.parseEther("0.09"));
      expect(balanceOfContract).to.equals(ethers.utils.parseEther("0.02"));
    });

    it("Should be not possible to finish voting twice", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await this.voting.finish(0);

      await expect(this.voting.finish(0)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Voting is not open'");
    });

    it("Should be not possible to finish voting before delay period", async () => {
      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await expect(this.voting.finish(0)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Voting is not finished yet'");
    });

    it("Should not be possible to finish non-existing voting", async () => {
      await expect(this.voting.finish(0)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Invalid voting index'");
    });
  });
  
  describe("withdraw", () => {
    it("Should be able to withdraw tax", async () => {

      await this.voting.addVoting([this.addr1.address, this.addr2.address]);

      await( 
        await this.voting.connect(this.addr3).vote(0, 1, {
          value: ethers.utils.parseEther("0.1")
        })).wait();  

      await network.provider.send("evm_increaseTime", [delay]);
      await network.provider.send("evm_mine");

      await( 
        await this.voting.finish(0)).wait();  

      var oldBalance = await ethers.provider.getBalance(this.owner.address);

      var tx = await this.voting.withdraw();
      var receipt = await tx.wait();
      var gas = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

      var newBalance = await ethers.provider.getBalance(this.owner.address);
      var balanceOfContract = await ethers.provider.getBalance(this.voting.address);
      
      expect(newBalance.sub(oldBalance).add(gas)).to.equals(ethers.utils.parseEther("0.01"));
      expect(balanceOfContract).to.equals(ethers.utils.parseEther("0.00"));
    });

    it("Should not be able to withdraw tax if no taxes available", async () => {
        await expect(this.voting.withdraw()).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'No funds to withdraw'");
    });
  });

  describe("getVoting", () => {
    it("Should be not able to get voting out of range", async () => {
      await expect(this.voting.getVoting(0)).to.be.reverted;
    });
  });

});
