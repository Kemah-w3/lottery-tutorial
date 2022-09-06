require("@nomiclabs/hardhat-etherscan")
const { ethers } = require("hardhat")
const { LINK_TOKEN, VRF_COORDINATOR, KEY_HASH, FEE } = require("../constants")


async function main() {
  const randomWinnerGameContract = await ethers.getContractFactory("RandomWinnerGame")
  const deployedRandomWinnerGame = await randomWinnerGameContract.deploy(
    VRF_COORDINATOR, 
    LINK_TOKEN,
    KEY_HASH, 
    FEE
  )

  await deployedRandomWinnerGame.deployed()

  console.log("RandomWinnerGame contract deployed to :", deployedRandomWinnerGame.address)

  console.log("Sleeping...")
  //wait for ethersacn to notice that the contract has been deployed 
  await sleep(30000)

  //verify contract on etherscan
  await hre.run("verify:verify", {
    address: deployedRandomWinnerGame.address,
    constructorArguments: [
      VRF_COORDINATOR, 
      LINK_TOKEN,
      KEY_HASH, 
      FEE
    ]
  })

  console.log("contract verified!")

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })