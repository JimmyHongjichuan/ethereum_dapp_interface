Eos = require('eosjs');




// Default configuration
config = {
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    keyProvider: ['5JSkmB7crGY8cFMvL7wTRj6QN8bntmcPfnAwg3hMBb5xW4XehLi'],
    httpEndpoint: 'http://localhost:9082/eosmix/nodeos',
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, // API activity
    sign: true
};

eos = Eos(config);

// async function getInfo() {
//     var info = await eos.getInfo({});
// }

// eos.transfer();

eos.getInfo((error, result) => {
    console.log(error, result)
});
// eos.getInfo({}).then((error, result) => {
//     console.log(error, result);
// });