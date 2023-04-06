const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { networkConfig } = require("../helper-hardhat-config")
const fs = require("fs")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    log("----------------------------------------------------")

    // const args = [ethUsdPriceFeedAddress]

    const lowSvg = await fs.readFileSync("./images/dynamicNft/frown.svg", {
        encoding: "utf-8",
    })

    const highSvg = await fs.readFileSync("./images/dynamicNft/happy.svg", {
        encoding: "utf-8",
    })

    const args = [lowSvg, highSvg, ethUsdPriceFeedAddress]

    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("------------------------------------------------------")

    //     Successfully verified contract DynamicSvgNft on Etherscan.
    // https://sepolia.etherscan.io/address/0xBDF7A61f5aBf6633031Ff7B6816af9316E762AE6#code

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying......")

        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicsvgnft", "main"]
