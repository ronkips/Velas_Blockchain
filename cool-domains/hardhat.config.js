require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const ALCHEMY_URL = process.env.ALCHEMY_URL
module.exports = {
  solidity: "0.8.10",
  networks: {
    Velas_Testnet: {
      url: ALCHEMY_URL,
      accounts: [PRIVATE_KEY]
    }
  }
};
