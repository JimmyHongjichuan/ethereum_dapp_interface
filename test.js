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
web3.eth.getBlockNumber(function callback(err, value) { console.log("BlockNumber:" + value) });
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
let contractAddressGateway = "0x25729b0eafb35BF850561bfFDA87C1f1A5AB2F36";//"0x0abfafdb75dd0bcc2b7789100fa45538db967fec";//
let fromAddressGateway1 = "0x9ee4fc0c19b802e83e34696f4a5430e7e5b8f412";
let fromAddressGateway2 = "0x9dd4610b7ccc7d21543c7c17c32405ce82441bf5";
let fromAddressGateway3 = "0xa6c4e089c9a2e7b7aa0334586034f1c7716f920c";
contractGateway = new web3.eth.Contract(abiArray_gateway, contractAddressGateway, {
    from: fromAddressGateway1
});
let keystoreStrGateway1 = fileUtil.readFileSync('./keystore_9ee4fc0c19b802e83e34696f4a5430e7e5b8f412')
let keystoreStrGateway2 = fileUtil.readFileSync('./keystore_9dd4610b7ccc7d21543c7c17c32405ce82441bf5')
let keystoreStrGateway3 = fileUtil.readFileSync('./keystore_a6c4e089c9a2e7b7aa0334586034f1c7716f920c')
let decryptedAccountGateway1 = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGateway1), '123');
let decryptedAccountGateway2 = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGateway2), '123');
let decryptedAccountGateway3 = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGateway3), '123');
//dapp_inf.isVoter(contractGateway,fromAddressGateway3)
// dapp_inf.getMstop(contractGateway, fromAddressGateway2)
// dapp_inf.getMaxchainCode(contractGateway, fromAddressGateway2)
// dapp_inf.getChainCode(contractGateway, fromAddressGateway2,"BTC")
// dapp_inf.getmNumVoters(contractGateway, fromAddressGateway2)
// dapp_inf.getAppCode(contractGateway, fromAddressGateway2,contractAddressWBCH)
// dapp_inf.getAppInfo(contractGateway, fromAddressGateway2,1)


/**
 * WBCH
 */

let abiStr_wbch = fileUtil.readFileSync('./WBCHToken_abi');
let abiArray_wbch = JSON.parse(abiStr_wbch);
let contractAddressWBCH = "0x8Da61C2F1cD7f2c2F30157B64Cff35D16fad0e54";//"0x240cc7bb13a949ad8addf02f8e64730987891991";//
let fromAddressWBCH = "0x9ee4fc0c19b802e83e34696f4a5430e7e5b8f412";
let fromAddressWBCH1 = "0x9dd4610b7ccc7d21543c7c17c32405ce82441bf5";
contractWBCH = new web3.eth.Contract(abiArray_wbch, contractAddressWBCH, {
    from: fromAddressWBCH
});

//dapp_inf.BalanceQuery(contractWBCH, fromAddressWBCH)
//dapp_inf.BalanceQuery(contractWBCH, fromAddressWBCH1)
// CHAIN   TOKEN code
// BTC:1   WBCH：1
// EOS:2
//dapp_inf.removeVoter(web3, contractGateway, fromAddressGateway1, fromAddressGateway2,"removeVoter", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.changeVoter(web3, contractGateway, fromAddressGateway1, fromAddressGateway1,fromAddressGateway3,"changeVoter", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.mintByGateway(web3, contractGateway, fromAddressGateway2, 1, 1000, fromAddressGateway2 ,"mintByGateway", contractAddressGateway, decryptedAccountGateway2)
//dapp_inf.changeGatewayAddr(web3, contractGateway, fromAddressGateway1, 1, "0x240cc7bb13a949ad8addf02f8e64730987891991" ,"changeGatewayAddr", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.addApp(web3, contractGateway, fromAddressGateway2, contractAddressWBCH, 1, 1,"addApp", contractAddressGateway, decryptedAccountGateway2)
//dapp_inf.addChain(web3, contractGateway, fromAddressGateway1, "EOS", "addChain", contractAddressGateway, decryptedAccountGateway1)
//dapp_inf.startContract(web3, contractGateway, fromAddressGateway, "start", contractAddressGateway, decryptedAccountGateway)


//salaclockAuction
let abiStr_saleClockAuction = fileUtil.readFileSync('./SaleClockAuction_abi');
let abiArray_saleClockAuction = JSON.parse(abiStr_saleClockAuction);
let contractAddressSaleClockAuction = "0x11f86688828671ef48acb729e364ca68f6477218";
let fromAddressSale = "0x8c4ffcc692af5d1000277e676819b405a0fa8478";
let keystoreStrSale= fileUtil.readFileSync('./keystore_8c4ffcc692af5d1000277e676819b405a0fa8478')
let decryptedAccountSaleClockAuction = web3.eth.accounts.decrypt(JSON.parse(keystoreStrSale), '123');
contractSaleClockAuction= new web3.eth.Contract(abiArray_saleClockAuction, contractAddressSaleClockAuction, {
    from: fromAddressSale
});
dapp_inf.mNonFungibleContract(contractSaleClockAuction, fromAddressSale)

//siringclockAuction
let abiStr_siringClockAuction = fileUtil.readFileSync('./SiringClockAuction_abi');
let abiArray_siringClockAuction = JSON.parse(abiStr_siringClockAuction);
let contractAddressSiringClockAuction = "0xfe68172b73c189bf3afdbd43618a930f7c308e22";
let fromAddressSiring = "0x8c4ffcc692af5d1000277e676819b405a0fa8478";
let keystoreStrSiring= fileUtil.readFileSync('./keystore_8c4ffcc692af5d1000277e676819b405a0fa8478')
let decryptedAccountSiringClockAuction = web3.eth.accounts.decrypt(JSON.parse(keystoreStrSiring), '123');
contractSiringClockAuction= new web3.eth.Contract(abiArray_siringClockAuction, contractAddressSiringClockAuction, {
    from: fromAddressSiring
});
dapp_inf.mNonFungibleContract(contractSiringClockAuction, fromAddressSiring)

//genescience
let abiStr_GeneScience= fileUtil.readFileSync('./GeneScience_abi');
let abiArray_GeneScience = JSON.parse(abiStr_GeneScience);
let contractAddressGeneScience = "0xbcfa5133479c9994b2d92b75fe60d2f406a8d1c9";
let fromAddressGeneScience = "0x8c4ffcc692af5d1000277e676819b405a0fa8478";
let keystoreStrGeneScience= fileUtil.readFileSync('./keystore_8c4ffcc692af5d1000277e676819b405a0fa8478')
let decryptedAccountGeneScience = web3.eth.accounts.decrypt(JSON.parse(keystoreStrGeneScience), '123');
contractGeneScience= new web3.eth.Contract(abiArray_GeneScience, contractAddressGeneScience, {
    from: fromAddressGeneScience
});
dapp_inf.isGeneScience(contractGeneScience, fromAddressGeneScience)
dapp_inf.mixGenes(contractGeneScience, 0xa, 0x5, fromAddressGeneScience)

//kitty
let abiStr_kitty = fileUtil.readFileSync('./CryptoKitty_abi');
let abiArray_kitty = JSON.parse(abiStr_kitty);
let contractAddressKITTY = "0xcc2449d0b9df19a09c51e8017557a2fe8e12fb3d";//"0x240cc7bb13a949ad8addf02f8e64730987891991";
let fromAddressKITTY = "0x8c4ffcc692af5d1000277e676819b405a0fa8478";
let keystoreStrKitty = fileUtil.readFileSync('./keystore_8c4ffcc692af5d1000277e676819b405a0fa8478')
let decryptedAccountKitty = web3.eth.accounts.decrypt(JSON.parse(keystoreStrKitty), '123');
contractKITTY= new web3.eth.Contract(abiArray_kitty, contractAddressKITTY, {
    from: fromAddressKITTY
});
// dapp_inf.implementsERC721(contractKITTY, fromAddressKITTY)
// dapp_inf.canBreedWith(contractKITTY, 0x1, 0x3)
// dapp_inf.isReadyToBreed(contractKITTY, 0x1)
// dapp_inf.isReadyToBreed(contractKITTY, 0x5)
dapp_inf.getKitty(contractKITTY, 0x1, fromAddressKITTY)
dapp_inf.getKitty(contractKITTY, 0x2, fromAddressKITTY)
dapp_inf.getKitty(contractKITTY, 0x3, fromAddressKITTY)
dapp_inf.getKitty(contractKITTY, 0x4, fromAddressKITTY)
dapp_inf.getKitty(contractKITTY, 0x5, fromAddressKITTY)
//dapp_inf.breedWith(web3, contractKITTY, fromAddressKITTY, 0x1, 0x2, contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.breedWithAuto(web3, contractKITTY, fromAddressKITTY, 0x3, 0x4, web3.utils.toWei("3","ether"), contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.createPromoKitty(web3, contractKITTY, fromAddressKITTY, 0x135246852741,  fromAddressKITTY,contractAddressKITTY, decryptedAccountKitty)
// dapp_inf.OwnerOfQuery(contractKITTY, fromAddressKITTY, 0x3)
// dapp_inf.unpause(web3, contractKITTY, fromAddressKITTY, contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.mPaused(contractKITTY, fromAddressKITTY)
//dapp_inf.giveBirth(web3, contractKITTY, fromAddressKITTY, 0x1,contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.isReadyToBreed(contractKITTY, 0x3, fromAddressKITTY)
// dapp_inf.mCeoAddress(contractKITTY, fromAddressKITTY)
//dapp_inf.setGeneScienceAddress(web3, contractKITTY, fromAddressKITTY, contractAddressGeneScience,contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.setSaleAuctionAddress(web3, contractKITTY, fromAddressKITTY, contractAddressSaleClockAuction,contractAddressKITTY, decryptedAccountKitty)
//dapp_inf.setSiringAuctionAddress(web3, contractKITTY, fromAddressKITTY, contractAddressSiringClockAuction,contractAddressKITTY, decryptedAccountKitty)
