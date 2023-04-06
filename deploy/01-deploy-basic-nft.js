const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments

    const { deployer } = await getNamedAccounts()

    log("-----------------------------------------")

    const args = []

    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("-----------------------------------------")

    //     Successfully verified contract BasicNft on Etherscan.
    // https://sepolia.etherscan.io/address/0x001e8Bb77b4642FBf026880872523Cc9D0934dcD#code

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying..........")

        await verify(basicNft.address, args)
    }
}

module.exports.tags = ["all", "basicnft", "main"]
