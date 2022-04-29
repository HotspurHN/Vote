require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');
require("@nomiclabs/hardhat-web3");
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

task("addVoting", "Prints an account's balance")
  .addParam("candidates", "Comma-separated candidates addresses")
  .setAction(async ({ candidates }, hre) => {
    const Vote = await hre.ethers.getContractFactory("Vote");
    const voting = await Vote.attach(process.env.CONTRACT);
    await voting.addVoting(candidates.split(","));
  });

task("vote", "Vote for a candidate")
  .addParam("votingid", "integer")
  .addParam("candidateid", "integer")
  .setAction(async ({ votingid, candidateid }, hre) => {
    const Vote = await hre.ethers.getContractFactory("Vote");
    const voting = await Vote.attach(process.env.CONTRACT);
    await voting.vote(votingid, candidateid, {
      value: ethers.utils.parseEther("0.1")
    });
  });

task("getVoting", "Vote for a candidate")
  .addParam("votingid", "integer")
  .setAction(async ({ votingid }, hre) => {
    const Vote = await hre.ethers.getContractFactory("Vote");
    const voting = await Vote.attach(process.env.CONTRACT);
    const result = await voting.getVoting(votingid);
    console.log(result);
  });

task("finish", "Finish the vote")
  .addParam("votingid", "integer")
  .setAction(async ({ votingid }, hre) => {
    const Vote = await hre.ethers.getContractFactory("Vote");
    const voting = await Vote.attach(process.env.CONTRACT);
    await voting.finish(votingid);
  });

task("withdraw", "Withdraw funds")
  .setAction(async ({ }, hre) => {
    const Vote = await hre.ethers.getContractFactory("Vote");
    const voting = await Vote.attach(process.env.CONTRACT);
    await voting.withdraw();
  });

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`]
    }
  }
};
