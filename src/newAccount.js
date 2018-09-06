Eos = require('eosjs');
const EosApi = require('eosjs-api');
const http = require('http');
const querystring = require('querystring');

let config = {
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    keyProvider: ['xxxxxxx'],        //私钥
    httpEndpoint: 'http://localhost:9082/eosmix/nodeos',
    expireInSeconds: 60,
    broadcast: true,
    verbose: false, // API activity
    sign: true
};

var eos = Eos(config);
var eosapi = EosApi(config);

/**
 * 转账
 * @param config
 * @returns {Promise<void>}
 */
async function asyncTransfer(config) {
    transactionHeaders = await prepareHeader();
    eos = Eos({
        httpEndpoint: config.httpEndpoint,
        chainId: config.chainId,
        keyProvider: config.keyProvider,
        transactionHeaders
    });
    transfer = await eos.transfer('yyloveuu1314', 'williamoony5', '0.1000 EOS', 'for free.', true);
    transferTransaction = transfer.transaction;
    processedTransaction = await eos.pushTransaction(transferTransaction);
}

/**
 * 创建账户
 *
 * @param config 配置
 * @param creatoraccount 创建者
 * @param newaccount 新账户
 * @param newaccount_pubkey 新账户的公钥
 * @returns {Promise<void>}
 */
async function asyncNewAccount(config, creatoraccount, newaccount, newaccount_pubkey) {
    transactionHeaders = await prepareHeader();
    pubkey = 'EOS68hmKN91AnKr5WaRWNgCFDbLCVmcBi48y9tDVUMMJD9W4zQFL8'
    eos = Eos({
        httpEndpoint: config.httpEndpoint,
        chainId: config.chainId,
        keyProvider: config.keyProvider,
        transactionHeaders
    });
    nc = await eos.transaction(tr => {
        //新建账号
        tr.newaccount({
            creator: creatoraccount,
            name: newaccount,
            owner: newaccount_pubkey,
            active: newaccount_pubkey
        });

        //为新账号充值RAM
        tr.buyrambytes({
            payer: creatoraccount,
            receiver: newaccount,
            bytes: 8192
        });

        //为新账号抵押CPU和NET资源
        tr.delegatebw({
            from: creatoraccount,
            receiver: newaccount,
            stake_net_quantity: '0.5000 EOS',
            stake_cpu_quantity: '0.5000 EOS',
            transfer: 0
        });
    });
    newaccpuntTransaction = nc.transaction;
    processedTransaction = await eos.pushTransaction(newaccpuntTransaction)
}

/**
 * 抵押
 * @param config
 * @returns {Promise<void>}
 */
async function asyncDelegatebw(config) {
    transactionHeaders = await prepareHeader();
    eos = Eos({
        httpEndpoint: config.httpEndpoint,
        chainId: config.chainId,
        keyProvider: config.keyProvider,
        transactionHeaders
    });
    transfer = await eos.delegatebw('yyloveuu1314', 'yyloveuu1314', '0.0000 EOS', '0.5000 EOS', 0);
    transferTransaction = transfer.transaction;
    var contents = JSON.stringify(transferTransaction);
    var options = {
        hostname: '127.0.0.1',
        port: 9082,
        path: '/eosmix/chain/transaction/push',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': contents.length
        }
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            console.log("data:", data);   //一段html代码
        });
    });
    req.write(contents);
    req.end;
    //processedTransaction =await eos.pushTransaction(transferTransaction)
}

/**
 * header
 * @returns {Promise<{expiration: *|Date, ref_block_num: number, ref_block_prefix: string|number}|*>}
 */
async function prepareHeader() {
    expireInSeconds = 60 * 60;// 1 hour
    info = await eos.getInfo({});
    chainDate = new Date(info.head_block_time + 'Z');
    expiration = new Date(chainDate.getTime() + expireInSeconds * 1000);
    expiration = expiration.toISOString().split('.')[0];

    block = await eos.getBlock(info.last_irreversible_block_num);

    transactionHeaders = {
        expiration,
        ref_block_num: info.last_irreversible_block_num & 0xffff,
        ref_block_prefix: block.ref_block_prefix
    };
    return transactionHeaders;
}