
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  
  const delay = 7890000; // 3 months
  const depositValue = ethers.BigNumber.from("100000000000000000"); // = 0.1 eth
  const tax = 10; // = 10%
  const Vote = await hre.ethers.getContractFactory("Vote");
  const voting = await Vote.deploy(delay,depositValue, tax);

  await voting.deployed();

  console.log("Vote deployed to:", voting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
