const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
// const { DECIMALS, INITIAL_PRICE } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    const args = [BASE_FEE, GAS_PRICE_LINK,]

    if (developmentChains.includes(network.name)) {
        log("Local network has been detected now we are deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        // await deploy("MockV3Aggregator", {
        //     from: deployer,
        //     log: true,
        //     args: [DECIMALS, INITIAL_PRICE],
        // })
    }
    log("Mocks deployed")

    log("---------------------------------------------------------")
}

module.exports.tags = ["all", "mocks"]