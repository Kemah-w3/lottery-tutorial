require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({path: ".env"})

const ALCHEMY_KEY = process.env.MUMBAI_ALCHEMY_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY
const API_KEY = process.env.MUMBAI_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    mumbai: {
      url: ALCHEMY_KEY,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: API_KEY
    }
  }
}
