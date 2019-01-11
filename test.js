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

abiStr = fileUtil.readFileSync('./UUToken_abi');
abiJson = JSON.parse(abiStr)
abiArray = abiJson;
contractAddress = "0x8b907e3163924aa887066215d8d065695f028f89";
fromAddress = "0x5cdb3d471f319a481a375f95ee557ce3acb3588c";
toAddress = "0x8c4fFCc692AF5d1000277e676819b405A0Fa8478";
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let keystoreStr = fileUtil.readFileSync('./keystore_5cdb3d471f319a481a375f95ee557ce3acb3588c')
//let keystoreStr = fileUtil.readFileSync('./keystore_fd7cdbf6cc424bfa04c556b3863a62b57209f40b')
let keystore = JSON.parse(keystoreStr)
let decryptedAccount = web3.eth.accounts.decrypt(keystore, '123');

contract = new web3.eth.Contract(abiArray, contractAddress, {
    from: fromAddress
});

dapp_inf.OwnerQuery(contract, fromAddress)
dapp_inf.OwnerOfQuery(contract, fromAddress, 0x1234)
dapp_inf.TransferFromERC721Toekn(web3, contract, fromAddress, toAddress, contractAddress, decryptedAccount)
console.log("script end");
