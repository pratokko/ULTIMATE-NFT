const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { networkConfig } = require("../helper-hardhat-config")
const {
    storeImages,
    storeTokenUriMetadata,
} = require("../utils/uploadToPinata")
const { verify } = require("../utils/verify")

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}
let tokenUris = [
    "ipfs://QmeBBurNnenXR9EuCmyno7HxpN9mK4gnZaTEqGvZEgntFM",
    "ipfs://QmcUDjrTuTVpikh4KBpBjotPoV3Uk8hj9YjgbVh8BBx3Pd",
    "ipfs://QmespL6R8wXrLPs3ad5oX1C9ng9GE1DHmU8s25W2eo3gu5",
]

const FUND_AMOUNT = ethers.utils.parseEther("1")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    // get the ipfs hashes of our images

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }
    // PInata
    // nft.storage

    let vrfCoordinatorV2Address, subscriptionId, VRFCoordinatorV2Mock

    if (developmentChains.includes(network.name)) {
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = VRFCoordinatorV2Mock.address

        const tx = await VRFCoordinatorV2Mock.createSubscription()

        const txReceipt = await tx.wait(1)

        subscriptionId = txReceipt.events[0].args.subId
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    log("------------------------------------------------")

    await storeImages(imagesLocation)

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("--------------------------------------------------")

    if (developmentChains.includes(network.name)) {
        await VRFCoordinatorV2Mock.addConsumer(
            subscriptionId,
            randomIpfsNft.address
        )
        log("Consumer is added")
    }

    //     Successfully verified contract RandomIpfsNft on Etherscan.
    // https://sepolia.etherscan.io/address/0x360dc198b68CbF357276851F8F0F4B36c16cdfF3#code

    if (!developmentChains.includes(network.name)) {
        log("Verifying...")

        await verify(randomIpfsNft.address, args)
    }
}

async function handleTokenUris() {
    tokenUris = []
    // store the image and metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(
        imagesLocation
    )

    for (imageUploadResponseIndex in imageUploadResponses) {
        // create metadata
        // upload metadata

        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(
            ".png",
            ""
        )
        tokenUriMetadata.description = `A Beautiful ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`uploading ${tokenUriMetadata.name}...`)
        // store the JSON to pinata

        const metadataUploadResponse = await storeTokenUriMetadata(
            tokenUriMetadata
        )
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }

    console.log("Token URIs Uploaded!! they are:")
    console.log(tokenUris)

    return tokenUris
}

module.exports.tags = ["all", "randomipfs", "main"]
