Web3 = require('web3');
fileUtil = require('fs');
axios = require('axios');
Tx = require('ethereumjs-tx');
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

/**
 * ETH Transfer
 * @type {Buffer}
 */
let keystoreStr = fileUtil.readFileSync('./keystore_5cdb3d471f319a481a375f95ee557ce3acb3588c')
//let keystoreStr = fileUtil.readFileSync('./keystore_fd7cdbf6cc424bfa04c556b3863a62b57209f40b')
let keystore = JSON.parse(keystoreStr)
let decryptedAccount = web3.eth.accounts.decrypt(keystore, '123');

let rawTransaction = {

    "from": "0x5cdb3d471f319a481a375f95ee557ce3acb3588c",

    "to": "0xfd7cdbf6cc424bfa04c556b3863a62b57209f40b",

    "value": web3.utils.toHex(web3.utils.toWei("50", "ether")),

    "gas": 200000,

    "chainId": 50

};
let returnResult

async function SendTransaction() {
    let signTx = await web3.eth.accounts.signTransaction(rawTransaction, decryptedAccount.privateKey)


    try {
        await web3.eth.sendSignedTransaction(signTx.rawTransaction, function (error, hash) {
            if (!error) {
                returnResult = hash
            } else {
                returnResult = "101"


            }
        })
    } catch (error) {
        console.log(error)
    }
    console.log(returnResult)
}

//SendTransaction()

/**
 * erc20 transfer
 */
// Use BigNumber
let decimals = web3.utils.toBN(18);
let amount = web3.utils.toBN(100);
// calculate ERC20 token amount
let value = amount.mul(web3.utils.toBN(10).pow(decimals));

let fromAddress = "0xfd7cdbf6cc424bfa04c556b3863a62b57209f40b";
let toAddress = "0x5cdb3d471f319a481a375f95ee557ce3acb3588c";
let abiStr = fileUtil.readFileSync('./WBCHToken_abi');
let abiJson = JSON.parse(abiStr)
let abiArray = abiJson;
let contractAddress = "0x7bf09685b164d2491c4839ece2cb102a1d6a7a65";
let contract = new web3.eth.Contract(abiArray, contractAddress, {
    from: fromAddress
});

contract.methods.balanceOf(fromAddress).call({from: fromAddress}, function (error, result) {
        if (error != null) {
            console.log(error)
        }
        else {
            console.log(result)
        }
    }
);
BalanceQuery = async(contract, Balanceaddress, fromAddress) => {
    let balance = await contract.methods.balanceOf(Balanceaddress).call({from: fromAddress});
    console.log(`Balance before send: ${balance}`);
}
//BalanceQuery()


const GetCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10
    };

    console.log("\r\n");
    console.log("Current ETH Gas Prices (in GWEI):");
    console.log("\r\n");
    console.log(`Low: ${prices.low} (transaction completes in < 30 minutes)`);
    console.log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`);
    console.log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`);
    console.log("\r\n");

    return prices
};
//GetCurrentGasPrices()
let gasPriceGwei = 3;
let gasLimit = 3000000;
// Build a new transaction object.

// call transfer function
TransferERC20Toekn = async() => {
    let keystoreStr = fileUtil.readFileSync('./keystore_fd7cdbf6cc424bfa04c556b3863a62b57209f40b')
//let keystoreStr = fileUtil.readFileSync('./keystore_fd7cdbf6cc424bfa04c556b3863a62b57209f40b')
    let keystore = JSON.parse(keystoreStr)
    let decryptedAccount = web3.eth.accounts.decrypt(keystore, '123');
    let amount = 1;
    let tokenAmount = web3.utils.toWei(amount.toString(), 'ether')

    // The gas price is determined by the last few blocks median gas price.
    const avgGasPrice = await web3.eth.getGasPrice();
// current transaction gas prices from https://ethgasstation.info/
    const currentGasPrices = await GetCurrentGasPrices();
    let nonce = await web3.eth.getTransactionCount(fromAddress);
// Will call estimate the gas a method execution will take when executed in the EVM without.
    let estimateGas = await web3.eth.estimateGas({
        "value": '0x0', // Only tokens
        "data": contract.methods.transfer(toAddress, tokenAmount).encodeABI(),
        "from": fromAddress,
        "to": toAddress
    });
    console.log({
        estimateGas: estimateGas
    });
    const nonceHex = web3.utils.toHex(nonce)
    chainIdHex= web3.utils.toHex(50)
    transaction = {
        "value": '0x0', // Only tokens
        "data": contract.methods.transfer(toAddress, tokenAmount).encodeABI(),
        "from": fromAddress,
        "to": contractAddress,
        "nonce": nonceHex,
        //"gas": web3.utils.toHex(estimateGas),
        "gasLimit": '0x30D40',
       // "gasLimit": web3.utils.toHex(estimateGas),
        "gasPrice": web3.utils.toHex(Math.trunc(currentGasPrices.medium * 1e9)),
        "chainId": chainIdHex
    };

    /**
     * ethereum-js
     * @type {Buffer}
     */
    // let privateKey = Buffer.from('971c668cb87f58afc33a69406bd504c26b46f22edd4833d681f5375accfc8d80', 'hex');
    // const tx = new Tx(transaction);
    // tx.sign(privateKey);
    // const serializedTx = tx.serialize();
    //
    // const receipt = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
    // console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);
    //
    // console.log(`From\'s balance after transfer: ${await contract.methods.balanceOf(fromAddress).call()}`);
    // console.log(`To\'s balance after transfer: ${await contract.methods.balanceOf(toAddress).call()}`);

    /**
     * web3.js
     */
    // Creates an account object from a private key.
    const senderAccount = web3.eth.accounts.privateKeyToAccount(decryptedAccount.privateKey);
    /**
     * This is where the transaction is authorized on your behalf.
     * The private key is what unlocks your wallet.
     */
    const signedTransaction = await senderAccount.signTransaction(transaction);
    console.log({
        transaction: transaction,
        amount: amount,
        tokenAmount: tokenAmount,
        avgGasPrice: avgGasPrice,
        signedTransaction: signedTransaction
    });

    // We're ready! Submit the raw transaction details to the provider configured above.
    try {
        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        console.log({
            receipt: receipt
        });

    } catch (error) {
        console.log({
            error: error.message
        });
    }
}

//TransferERC20Toekn()

/**
 * erc721 transfer
 */


fromAddress = "0x8c4ffcc692af5d1000277e676819b405a0fa8478";
toAddress = "0xfd7cdbf6cc424bfa04c556b3863a62b57209f40b";
NameQuery = async(contract, fromAddress) => {
    let name = await contract.methods.name().call({from: fromAddress});
    console.log(`ERC721 token: ${name}`);
}
//NameQuery()

OwnerQuery = async(contract, fromAddress) => {
    let name = await contract.methods.owner().call({from: fromAddress});
    console.log(`owner: ${name}`);
}
//OwnerQuery()


OwnerOfQuery = async(contract, fromAddress, token_id) => {
    let name = await contract.methods.ownerOf(token_id).call({from: fromAddress});
    console.log(`ownerof: ${name}`);
}
//OwnerOfQuery()


// call transfer function
MintERC721Toekn = async(web3js, contract, fromAddress, toAddress, contractAddress, decryptedAccount) => {

    // The gas price is determined by the last few blocks median gas price.
    const avgGasPrice = await web3js.eth.getGasPrice();
// current transaction gas prices from https://ethgasstation.info/
    const currentGasPrices = await GetCurrentGasPrices();
    let nonce = await web3js.eth.getTransactionCount(fromAddress);
    let token_id = 0x1234
// Will call estimate the gas a method execution will take when executed in the EVM without.
    let estimateGas = await web3js.eth.estimateGas({
        "value": '0x0', // Only tokens
        "data": contract.methods.mint(toAddress, token_id).encodeABI(),
        "from": fromAddress,
        "to": toAddress
    });
    console.log({
        estimateGas: estimateGas
    });
    const nonceHex = web3js.utils.toHex(nonce)
    chainIdHex= web3js.utils.toHex(50)
    gas = web3js.utils.toHex(5000000000)
    transaction = {
        "value": '0x0', // Only tokens
        "data": contract.methods.mint(toAddress, token_id).encodeABI(),
        "from": fromAddress,
        "to": contractAddress,
        "nonce": nonceHex,
        "gas": gas,
        "gasLimit": '0x7000000D40',
        // "gasLimit": web3.utils.toHex(estimateGas),
        "gasPrice": web3js.utils.toHex(Math.trunc(currentGasPrices.medium * 1e9)),
        "chainId": chainIdHex
    };
    /**
     * web3.js
     */
        // Creates an account object from a private key.
    const senderAccount = web3js.eth.accounts.privateKeyToAccount(decryptedAccount.privateKey);
    /**
     * This is where the transaction is authorized on your behalf.
     * The private key is what unlocks your wallet.
     */
    const signedTransaction = await senderAccount.signTransaction(transaction);
    console.log({
        transaction: transaction,
        amount: amount,

        avgGasPrice: avgGasPrice,
        signedTransaction: signedTransaction
    });

    // We're ready! Submit the raw transaction details to the provider configured above.
    try {
        const receipt = await web3js.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        console.log({
            receipt: receipt
        });

    } catch (error) {
        console.log({
            error: error.message
        });
    }
}

//MintERC721Toekn()


/**
 * transfer ERC721
 * @type {string}
 */


// call transfer function
TransferFromERC721Toekn = async(web3js, contract, fromAddress, toAddress, contractAddress, decryptedAccount) => {

    // The gas price is determined by the last few blocks median gas price.
 //   const avgGasPrice = await web3js.eth.getGasPrice();
// current transaction gas prices from https://ethgasstation.info/
    const currentGasPrices = await GetCurrentGasPrices();
    let nonce = await web3js.eth.getTransactionCount(fromAddress);
    let token_id = 0x1234
// Will call estimate the gas a method execution will take when executed in the EVM without.
    let estimateGas = await web3js.eth.estimateGas({
        "value": '0x0', // Only tokens
        "data": contract.methods.transferFrom(fromAddress, toAddress, token_id).encodeABI(),
        "from": fromAddress,
        "to": toAddress
    });
    console.log({
        estimateGas: estimateGas
    });
    const nonceHex = web3js.utils.toHex(nonce)
    chainIdHex= web3js.utils.toHex(50)
    gas = web3js.utils.toHex(500000000)
    transaction = {
        "value": '0x0', // Only tokens
        "data": contract.methods.transferFrom(fromAddress, toAddress, token_id).encodeABI(),
        "from": fromAddress,
        "to": contractAddress,
        "nonce": nonceHex,
        "gas": gas,
        "gasLimit": '0x7000000D4000',
        // "gasLimit": web3.utils.toHex(estimateGas),
        "gasPrice": web3js.utils.toHex(Math.trunc(currentGasPrices.medium * 1e9)),
        "chainId": chainIdHex
    };
    /**
     * web3.js
     */
        // Creates an account object from a private key.
    const senderAccount = web3js.eth.accounts.privateKeyToAccount(decryptedAccount.privateKey);
    /**
     * This is where the transaction is authorized on your behalf.
     * The private key is what unlocks your wallet.
     */
    const signedTransaction = await senderAccount.signTransaction(transaction);
    console.log({
        transaction: transaction,
        amount: amount,

        //avgGasPrice: avgGasPrice,
        signedTransaction: signedTransaction
    });

    // We're ready! Submit the raw transaction details to the provider configured above.
    try {
        const receipt = await web3js.eth.sendSignedTransaction(signedTransaction.rawTransaction);

        console.log({
            receipt: receipt
        });

    } catch (error) {
        console.log({
            error: error.message
        });
    }
}

//GatewayVote

isVoter = async(web3js, contract) => {
    let res =  await contract.methods.isVoter(fromAddress).call();
    console.log(`address:${res}`);
}


module.exports =
{
    TransferFromERC721Toekn,
    OwnerQuery,
    OwnerOfQuery,
    isVoter,
    BalanceQuery,
}

