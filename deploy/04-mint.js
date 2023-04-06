const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Basic NFT

    const basicNft = await ethers.getContract("BasicNft", deployer)

    const basicMintTx = await basicNft.mintNft()

    await basicMintTx.wait(1)

    console.log(
        `Basic NFT index  0 has tokenURI: ${await basicNft.tokenURI(0)}`
    )

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 400000)
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        const randomIpfsNftMintTx = await randomIpfsNft.requestNft({
            value: mintFee.toString(),
        })

        const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)

        if (developmentChains.includes(network.name)) {
            const requestId =
                randomIpfsNftMintTxReceipt.events[1].args.requestId.toString()
            const VRFCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
            await VRFCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                randomIpfsNft.address
            )
        }
    })

    console.log(
        `Random IPFS NFT Index 0 of tokenURI: ${await randomIpfsNft.tokenURI(
            0
        )}`
    )

    // Dynamic SVG NFT

    const highValue = ethers.utils.parseEther("2000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)

    const dynamicNftMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicNftMintTx.wait(1)

    console.log(
        `Dynamic SVG NFT Index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
    )
}

module.exports.tags = ["all", "mint"]
