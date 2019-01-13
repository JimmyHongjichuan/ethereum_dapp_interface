const dapp_inf = require ("./dapp_interface");

Web3 = require('web3');
//
// function runAsync(){
//     var p = new Promise(function(resolve, reject){
//         //做一些异步操作
//         setTimeout(function(){
//             console.log('执行完成');
//             resolve('随便什么数据');
//         }, 2000);
//     });
//     return p;
// }
// runAsync().then(x=>{console.log(x)})
//
//
//
// async function async1() {
//     console.log("async1 start");
//     let ret = await async2();
//     console.log(ret)
//     console.log("async1 end");
// }
//
// async function async2() {
//     console.log("async2");
//     return "kkk"
// }
//
// console.log("script start");
//
// setTimeout(function() {
//     console.log("setTimeout");
// }, 0);
//
// async1();
//
// new Promise(function(resolve) {
//     console.log("promise1");
//     resolve("ok");
// }).then(function(data) {
//     console.log("promise2"+data);
//     return "data"
// }).then(
//     function(data) {
//         console.log("promise3"+data);
//         return "err";}
// ).then(
//         function(data) {
//             console.log("promise4"+data);}
//     );


if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

/**
 * ERC721
 */
// abiStr = fileUtil.readFileSync('./UUToken_abi');
// abiJson = JSON.parse(abiStr)
// abiArray = abiJson;
// contractAddress = "0x8b907e3163924aa887066215d8d065695f028f89";
// fromAddress = "0x5cdb3d471f319a481a375f95ee557ce3acb3588c";
// toAddress = "0x8c4fFCc692AF5d1000277e676819b405A0Fa8478";
//
//
// let keystoreStr = fileUtil.readFileSync('./keystore_5cdb3d471f319a481a375f95ee557ce3acb3588c')
// //let keystoreStr = fileUtil.readFileSync('./keystore_fd7cdbf6cc424bfa04c556b3863a62b57209f40b')
// let keystore = JSON.parse(keystoreStr)
// let decryptedAccount = web3.eth.accounts.decrypt(keystore, '123');
//
// contract = new web3.eth.Contract(abiArray, contractAddress, {
//     from: fromAddress
// });
//
// dapp_inf.OwnerQuery(contract, fromAddress)
// dapp_inf.OwnerOfQuery(contract, fromAddress, 0x1234)
// dapp_inf.TransferFromERC721Toekn(web3, contract, fromAddress, toAddress, contractAddress, decryptedAccount)
// console.log("script end");

/**
 * Gateway
 */
let abiStr_gateway = fileUtil.readFileSync('./Gatewayvote_abi');
let abiArray_gateway = JSON.parse(abiStr_gateway);
let contractAddressGateway = "0x25729b0eafb35BF850561bfFDA87C1f1A5AB2F36";//"0x0abfafdb75dd0bcc2b7789100fa45538db967fec";
let fromAddressGateway1 = "0x9ee4fc0c19b802e83e34696f4a5430e7e5b8f412";
let fromAddressGateway2 = "0x9dd4610b7ccc7d21543c7c17c32405ce82441bf5";
contractGateway = new web3.eth.Contract(abiArray_gateway, contractAddressGateway, {
    from: fromAddressGateway2
});
let keystoreStrGateway1 = fileUtil.readFileSync('./keystore_9ee4fc0c19b802e83e34696f4a5430e7e5b8f412')
let keystoreStrGateway2 = fileUtil.readFileSync('./keystore_9dd4610b7ccc7d21543c7c17c32405ce82441bf5')
let decryptedAccountGateway1 = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGateway1), '123');
let decryptedAccountGateway2 = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGateway2), '123');
dapp_inf.isVoter(contractGateway,fromAddressGateway2)

/**
 * WBCH
 */

let abiStr_wbch = fileUtil.readFileSync('./WBCHToken_abi');
let abiArray_wbch = JSON.parse(abiStr_wbch);
let contractAddressWBCH = "0x8Da61C2F1cD7f2c2F30157B64Cff35D16fad0e54";//"0x240cc7bb13a949ad8addf02f8e64730987891991";
let fromAddressWBCH = "0x9ee4fc0c19b802e83e34696f4a5430e7e5b8f412";

contractWBCH = new web3.eth.Contract(abiArray_wbch, contractAddressWBCH, {
    from: fromAddressWBCH
});

dapp_inf.BalanceQuery(contractWBCH, fromAddressWBCH)
dapp_inf.getMstop(contractGateway, fromAddressGateway2)
dapp_inf.getMaxchainCode(contractGateway, fromAddressGateway2)
dapp_inf.getChainCode(contractGateway, fromAddressGateway2,"BTC")
dapp_inf.getmNumVoters(contractGateway, fromAddressGateway2)
dapp_inf.getAppCode(contractGateway, fromAddressGateway2,contractAddressWBCH)
dapp_inf.getAppInfo(contractGateway, fromAddressGateway2,1)

// CHAIN   TOKEN code
// BTC:1   WBCH：1
// EOS:2

//dapp_inf.mintByGateway(web3, contractGateway, fromAddressGateway2, 1, 100,fromAddressGateway1 ,"mintByGateway", contractAddressGateway, decryptedAccountGateway2)
//dapp_inf.changeGatewayAddr(web3, contractGateway, fromAddressGateway1, 1, "0x240cc7bb13a949ad8addf02f8e64730987891991" ,"changeGatewayAddr", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.addApp(web3, contractGateway, fromAddressGateway1, contractAddressWBCH, 1, 1,"addApp", contractAddressGateway, decryptedAccountGateway1)
 //dapp_inf.addChain(web3, contractGateway, fromAddressGateway1, "BTC", "addChain", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.startContract(web3, contractGateway, fromAddressGateway, "start", contractAddressGateway, decryptedAccountGateway)