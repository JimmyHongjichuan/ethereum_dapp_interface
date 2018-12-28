Web3 = require('web3');
fileUtil = require('fs');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var keystoreStr = fileUtil.readFileSync('./keystore_5cdb3d471f319a481a375f95ee557ce3acb3588c')
var keystore =  JSON.parse(keystoreStr)
const decryptedAccount = web3.eth.accounts.decrypt(keystore, '123');

var rawTransaction = {

    "from": "0x5cdb3d471f319a481a375f95ee557ce3acb3588c",

    "to": "0x8c4ffcc692af5d1000277e676819b405a0fa8478",

    "value": web3.utils.toHex(web3.utils.toWei("10", "ether")),

    "gas": 200000,

    "chainId": 50

};
var returnResult
async function sendTransaction ()
{
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

sendTransaction()
