// const hardhat = require("hardhat");

const main = async () => {
  // const [owner, randomPerson] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory("Domains");
  const domainContract = await domainContractFactory.deploy("rop");
  await domainContract.deployed();
  console.log("\n============================");
  console.log("Contract deployed to:", domainContract.address);

  // console.log("Contract deployed by:", owner.address);
  // passing in a second variable - value. this is the money

  const txn = await domainContract.register("hillary", {
    value: hre.ethers.utils.parseEther("1234")
  });
  await txn.wait();

  txn = await domainContract.setRecord("hillary");
  await txn.wait();
  console.log("Set record for hillary.rop");

  // Oops, looks like the owner is saving their money!
  txn = await domainContract.connect(owner).withdraw();
  await txn.wait();

  const domainOwner = await domainContract.getAddress("rop");
  console.log("Owner of domain hilary is:", domainOwner);

  const balance = await hre.ethers.provider.getBalance(domainContract.address);
  console.log("Contract Balance is =:", hre.ethers.utils.formatEther(balance));
  txn = await domainContract.connect(owner).withdraw();
  await txn.wait();

  // Fetch balance of contract & owner
  const contractBalance = await hre.ethers.provider.getBalance(
    domainContract.address
  );
  ownerBalance = await hre.ethers.provider.getBalance(owner.address);

  console.log(
    "Contract balance after withdrawal:",
    hre.ethers.utils.formatEther(contractBalance)
  );
  console.log(
    "Balance of owner after withdrawal:",
    hre.ethers.utils.formatEther(ownerBalance)
  );
    // Let's look in their wallet so we can compare later
  let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
  console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));

  // Oops, looks like the owner is saving their money!
  txn = await domainContract.connect(owner).withdraw();
  await txn.wait();
  
  // Fetch balance of contract & owner
  ownerBalance = await hre.ethers.provider.getBalance(owner.address);

  console.log("Contract balance after withdrawal:", hre.ethers.utils.formatEther(contractBalance));
  console.log("Balance of owner after withdrawal:", hre.ethers.utils.formatEther(ownerBalance));
}

// // Trying to set a record that doesn't belong to me!
// txn = await domainContract
//   .connect(randomPerson)
//   .setRecord("ronkips", "That's my domain now!");
// await txn.wait();
// Let's look in their wallet so we can compare later
  // console.log(
    // "Balance of owner before withdrawal:"
    // hre.ethers.utils.formatEther(ownerBalance)
  // );
  // Oops, looks like the owner is saving their money!
  

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
