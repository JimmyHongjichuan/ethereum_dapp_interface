const Eos = require('eosjs');
const ecc = require('eosjs-ecc');
const request = require('sync-request');
const binaryen = require('binaryen');
const fs = require('fs');


/**
 * 节点列表
 * @type {*[]}
 */
let nodes = [
    {
        schema: 'http',
        hostname: 'localhost',
        port: 9082,
        prefix: '/eosmix/nodeos',       //http://localhost:9082/eosmix/nodeos
    },
    {
        schema: 'https',
        hostname: 'api1.eosasia.one',
        prefix: '',
    },
    {
        schema: 'http',
        hostname: '172.18.11.52',
        port: 8888,
        prefix: '',
    }
];
/**
 * 当前使用的节点
 *
 * 可以直接使用1号野节点单独进行客户端测试
 *
 * @type {number}
 */
let curNode = nodes[1];
/**
 * eos 请求路径
 */
let urls = {
    getInfo: '/v1/chain/get_info',
    getBlock: '/v1/chain/get_block',
    getAccount: '/v1/chain/get_account',
    getAbi: '/v1/chain/get_abi',
    getCode: '/v1/chain/get_code',
    getTableRow: '/v1/chain/get_table_rows',
    getBalance: '/v1/chain/get_currency_balance',
    jsonToBin: '/v1/chain/abi_json_to_bin',
    binToJson: '/v1/chain/abi_bin_to_json',
    pushTransaction: '/v1/chain/push_transaction',   //推送transaction
    getRequiredKeys: '/v1/chain/get_required_keys',
    getCurrencyStats: '/v1/chain/get_currency_stats',
    getActions: '/v1/history/get_actions',
    getTransaction: '/v1/history/get_transaction',
    getKeyAccounts: '/v1/history/get_key_accounts',
    getControlledAccounts: '/v1/history/get_controlled_accounts',
};
/**
 * 配置,只需要chainId，其他的配置都不需要
 *
 * @type {{chainId: string, keyProvider: string[], expireInSeconds: number, broadcast: boolean, verbose: boolean, sign: boolean}}
 */
let config = {
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    keyProvider: ['xxxxxxx'],        //私钥
    httpEndpoint: null,
    expireInSeconds: 60,
    broadcast: false,
    verbose: false, // API activity
    sign: true
};

/**
 * 查看account
 *
 * @param account 账户名
 * @return {any}
 */
function getAccount(account) {
    let data = {account_name: account};
    let ret = post(data, urls.getAccount);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 替换
 *
 *
 [{
    "perm_name": "active",
    "parent": "owner",
    "required_auth": {
        "threshold": 1,
        "keys": [{
            "key": "EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a",
            "weight": 1
        }],
        "accounts": [],
        "waits": []
    }
}, {
    "perm_name": "owner",
    "parent": "",
    "required_auth": {
        "threshold": 1,
        "keys": [{
            "key": "EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a",
            "weight": 1
        }],
        "accounts": [],
        "waits": []
    }
}]
 *
 * @param account 账户
 * @param owner 新的owner
 * @param active 新的active
 * @return {any}
 */
function newPermissions(account, owner, active) {
    const perms = JSON.parse(JSON.stringify(account.permissions));// clone
    for (const perm of perms) {
        if (perm.perm_name === 'owner') {   //owner
            if (owner) {
                for (const key of perm.required_auth.keys) {
                    key.key = owner;
                }
            }
        } else if (perm.perm_name === 'active') {   //active
            if (active) {
                for (const key of perm.required_auth.keys) {
                    key.key = active;
                }
            }
        }
    }
    return perms;
}

/**
 * 更新perms
 * @param privateKey account的私钥（owner）
 * @param account 待更新的账户名
 * @param perms perms
 */
async function updateAuth(privateKey, account, perms) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        for (const perm of perms) {
            tr.updateauth({
                account: account,
                permission: perm.perm_name,
                parent: perm.parent,
                auth: perm.required_auth
            }, {authorization: `${account}@owner`})
        }
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("updateAuth result : ", JSON.stringify(processedTransaction));
}

/**
 * 获取公钥对应的账户
 *
 * @param publicKey 公钥
 * @return {any}
 */
function getKeyAccounts(publicKey) {
    let data = {public_key: publicKey};
    let ret = post(data, urls.getKeyAccounts);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 账户余额
 *
 * @param code
 * @param account
 * @param symbol
 */
function getCurrencyBalance(code, account, symbol) {
    let data = {code: code, account: account, symbol: symbol};
    let ret = post(data, urls.getBalance);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * table rows
 *
 * @param scope
 * @param code
 * @param table
 * @return {any}
 */
function getTableRows(scope, code, table) {
    let data = {scope: scope, code: code, table: table, json: true};
    let ret = post(data, urls.getTableRow);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * ram价格
 * RAM价格 = (n * quote.balance) / (n + base.balance / 1024)
 * @param ram 内存（单位kb）
 */
function ramPrice(ram) {
    let ret = getTableRows('eosio', 'eosio', 'rammarket');
    let row = ret.rows[0];
    let quote = row.quote.balance;
    quote = quote.substr(0, quote.length - 3).trim();
    let base = row.base.balance;
    base = base.substr(0, base.length - 3).trim();
    return (ram * parseFloat(quote)) / (ram + parseFloat(base) / 1024);
}

/**
 * action 列表
 *
 * @param account 账户
 * @param pos pos 最后一个元素为-1
 * @param offset offset 如果pos为-1，offset必须<-1
 */
function getActions(account, pos, offset) {
    let data = {account_name: account, pos: pos, offset: offset};
    let ret = post(data, urls.getActions);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 转账（EOS）
 * @param privateKey 私钥
 * @param from 转账者
 * @param receiver 接收者
 * @param amount 数量
 * @param memo 留言
 * @return {Promise<void>}
 */
async function transferEos(privateKey, from, receiver, amount, memo) {
    let transactionHeaders = prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        transactionHeaders
    });
    let nc = await eos.transfer(from, receiver, amount, memo, false);
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("transferEos result : ", JSON.stringify(processedTransaction));
}

/**
 * 转账（token）
 * @param privateKey 私钥
 * @param code token的code
 * @param from from account
 * @param receiver to account
 * @param amount amount
 * @param memo 留言
 * @return {Promise<void>}
 */
async function transfer(privateKey, code, from, receiver, amount, memo) {
    let transactionHeaders = prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        // httpEndpoint: 'https://api1.eosasia.one',              //！！！！！！！！！这个地方不对，如果传入endpoint，那abi的下载就走这条路了。
        // httpEndpoint: 'http://localhost:9082/eosmix/nodeos',
	      httpEndpoint: null,
        transactionHeaders
    });
	  await eos.fc.abiCache.abi(code, {
			  "version": "eosio::abi/1.0",
			  "types": [{
				  "new_type_name": "account_name",
				  "type": "name"
			  }],
			  "structs": [{
				  "name": "transfer",
				  "base": "",
				  "fields": [
					  {"name":"from", "type":"account_name"},
					  {"name":"to", "type":"account_name"},
					  {"name":"quantity", "type":"asset"},
					  {"name":"memo", "type":"string"}
				  ]
			  },{
				  "name": "create",
				  "base": "",
				  "fields": [
					  {"name":"issuer", "type":"account_name"},
					  {"name":"maximum_supply", "type":"asset"}
				  ]
			  },{
				  "name": "issue",
				  "base": "",
				  "fields": [
					  {"name":"to", "type":"account_name"},
					  {"name":"quantity", "type":"asset"},
					  {"name":"memo", "type":"string"}
				  ]
			  },{
				  "name": "account",
				  "base": "",
				  "fields": [
					  {"name":"balance", "type":"asset"}
				  ]
			  },{
				  "name": "currency_stats",
				  "base": "",
				  "fields": [
					  {"name":"supply", "type":"asset"},
					  {"name":"max_supply", "type":"asset"},
					  {"name":"issuer", "type":"account_name"}
				  ]
			  }
			  ],
			  "actions": [{
				  "name": "transfer",
				  "type": "transfer",
				  "ricardian_contract": ""
			  },{
				  "name": "issue",
				  "type": "issue",
				  "ricardian_contract": ""
			  }, {
				  "name": "create",
				  "type": "create",
				  "ricardian_contract": ""
			  }
			
			  ],
			  "tables": [{
				  "name": "accounts",
				  "type": "account",
				  "index_type": "i64",
				  "key_names" : ["currency"],
				  "key_types" : ["uint64"]
			  },{
				  "name": "stat",
				  "type": "currency_stats",
				  "index_type": "i64",
				  "key_names" : ["currency"],
				  "key_types" : ["uint64"]
			  }
			  ],
			  "ricardian_clauses": [],
			  "abi_extensions": []
		  }
	  );
    let nc = await eos.transaction(
        {
            actions: [
                {
                    account: code,
                    name: 'transfer',
                    authorization: [{
                        actor: from,
                        permission: 'active'
                    }],
                    data: {
                        from: from,
                        to: receiver,
                        quantity: amount,
                        memo: ''
                    }
                }
            ]
        }
    );;
	let transaction = nc.transaction;
	let processedTransaction = pushTransaction(transaction);
	console.log("transfer result : ", JSON.stringify(processedTransaction));
}

/**
 * 新建账号
 *
 * @param privateKey 私钥
 * @param creatoraccount 创建者
 * @param newaccount 新账户名
 * @param newaccount_pubkey 新账户的公钥
 * @returns {Promise<void>}
 */
async function newAccount(privateKey, creatoraccount, newaccount, newaccount_pubkey, ram = 4096, cpu = '0.2000 EOS', net = '0.2000 EOS') {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        //新账号
        tr.newaccount({
            creator: creatoraccount,
            name: newaccount,
            owner: newaccount_pubkey,
            active: newaccount_pubkey
        });

        //为新账号充RAM
        tr.buyrambytes({
            payer: creatoraccount,
            receiver: newaccount,
            bytes: ram
        });

        //为新账号抵押CPU和NET
        tr.delegatebw({
            from: creatoraccount,
            receiver: newaccount,
            stake_net_quantity: net,
            stake_cpu_quantity: cpu,
            transfer: 0
        });
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction)
    console.log("new account result : ", JSON.stringify(processedTransaction));
}

/**
 * 抵押
 *
 * @param config
 * @returns {Promise<void>}
 */
async function delegatebw(privateKey, from, receiver, cpu, net) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        tr.delegatebw({
            from: from,
            receiver: receiver,
            stake_net_quantity: net,
            stake_cpu_quantity: cpu,
            transfer: 0
        });
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("delegatebw result : ", JSON.stringify(processedTransaction));
}

/**
 * 赎回
 *
 * @param privateKey 私钥
 * @param account 账户,接收者也是此账户
 * @param cpu cpu（eos）
 * @param net net（eos）
 */
async function undelegatebw(privateKey, account, cpu, net) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        tr.undelegatebw({
            from: account,
            receiver: account,
            unstake_net_quantity: net,
            unstake_cpu_quantity: cpu
        });
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("undelegatebw result : ", JSON.stringify(processedTransaction));
}

/**
 * refund
 * undelegatebw执行三天后，再操作refund
 * @param account
 * @return {Promise<void>}
 */
async function refund(privateKey, account) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.refund(account, false);
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("refund result : ", JSON.stringify(processedTransaction));
}

/**
 * 购买内存
 *
 * @param privateKey 私钥
 * @param from from（私钥对应的账户）
 * @param receiver  接收者
 * @param bytes 字节
 * @return {Promise<void>}
 */
async function buyrambytes(privateKey, from, receiver, bytes) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        tr.buyrambytes({
            payer: from,
            receiver: receiver,
            bytes: bytes
        });
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("buyrambytes result : ", JSON.stringify(processedTransaction));
}

/**
 * 出售ram
 *
 * @param privateKey 私钥
 * @param account 账户
 * @param bytes 字节
 * @return {Promise<void>}
 */
async function sellram(privateKey, account, bytes) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.transaction(tr => {
        tr.sellram({
            account: account,
            bytes: bytes
        });
    });
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("sellram result : ", JSON.stringify(processedTransaction));
}

/**
 * header
 *
 * @returns {Promise<{expiration: *|Date, ref_block_num: number, ref_block_prefix: string|number}|*>}
 */
function prepareHeader() {
    expireInSeconds = 60 * 60;
    info = getInfo();
    chainDate = new Date(info.head_block_time + 'Z');
    expiration = new Date(chainDate.getTime() + expireInSeconds * 1000);
    expiration = expiration.toISOString().split('.')[0];

    block = getBlock(info.last_irreversible_block_id);

    transactionHeaders = {
        expiration,
        ref_block_num: info.last_irreversible_block_num & 0xffff,
        ref_block_prefix: block.ref_block_prefix
    };
    return transactionHeaders;
}

/**
 * 推送
 *
 * @param transaction
 */
function pushTransaction(transaction) {
    let ret = post(transaction, urls.pushTransaction);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * info
 *
 * @returns {any}
 */
function getInfo() {
    let ret = post(null, urls.getInfo);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * block
 *
 * @param blockNumberOrId
 */
function getBlock(blockNumberOrId) {
    let data = {block_num_or_id: blockNumberOrId};
    let ret = post(data, urls.getBlock);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 下载abi
 * @param account 合约账户
 * @return {any}
 */
function getAbi(account) {
    let data = {account_name: account};
    let ret = post(data, urls.getAbi);
    return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 发币
 * @param privateKey 私钥
 * @param account 账户
 * @param supply 供应量
 * @return {Promise<void>}
 */
async function deployToken(privateKey, account, supply) {
    let wasm = fs.readFileSync(`./eosio.token.wasm`);
    let abi = fs.readFileSync(`./eosio.token.abi`);
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        //binaryen: binaryen,
        httpEndpoint: 'https://api1.eosasia.one',              //！！！！！！！！！这个地方不对，如果传入endpoint，那abi的下载就走这条路了。
        //httpEndpoint: 'http://localhost:9082/eosmix/nodeos',
        transactionHeaders
    });
    await eos.setcode(account, 0, 0, wasm);
    await eos.setabi(account, JSON.parse(abi));

    await eos.transaction(account, myaccount => {
        myaccount.create(account, supply);
        myaccount.issue(account, supply, 'token inited.');
    });
}


/**
 * 投票
 *
 */
async function voteproducer(privateKey, voter, proxy, producers) {
    let transactionHeaders = await prepareHeader();
    let eos = Eos({
        chainId: config.chainId,
        keyProvider: privateKey,
        httpEndpoint: null,
        transactionHeaders
    });
    let nc = await eos.voteproducer({
            voter: voter,
            proxy: proxy,
            producers: producers
        });

    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("voteproducer result : ", JSON.stringify(processedTransaction));
}

/**
 * 发送数据
 *
 * @param content
 * @param uri
 */
function post(content, uri) {
    let node = curNode;
    let url = node.schema + '://' + node.hostname + (node.port ? (':' + node.port) : '') + node.prefix + uri;
    let ret = request('POST', url, content == null ? '{}' : {
        json: content
    });
    return ret;
}

/**
 *  精度转换
 *  @param input 输入 ，1.0
 *  @param pre精度 ,4
 *  @return 1.0000
 */
function precision(input, pre) {
    let DecimalPad = Eos.modules.format.DecimalPad;
    return DecimalPad(input, pre);
}

/**
 * 产生公钥私钥
 */
function randomKey() {
    ecc.randomKey().then(privateKey => {
        console.log('私钥 : ', privateKey);
        console.log('公钥 : ', ecc.privateToPublic(privateKey));
    });
}

//randomKey();

let prikey = 'xxxxx';
let pubKey = 'EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a'

// let ret = getKeyAccounts(pubKey);
// console.log(ret);

// let ret = getCurrencyBalance('williamoony1', 'williamoony1', 'EOS');//获取代币持有情况
// console.log(ret);

// let ret = getTableRows('williamoony5', 'eosio', 'userres');//获取资源情况
// console.log(ret);


// transferEos(prikey, 'williamoony5', 'williamoony1', '0.1000 EOS', '测试转账');

// let pubkey = 'EOS8NqJ2aKqPGFkKUUdbgKHWTbMjARAdzuBPznvyCWpYPg5DZJmig';//先randomKey生成一对公私钥，然后创建账户
// newAccount(prikey, 'williamoony5', 'williamoony2', pubkey);

// delegatebw(prikey,"williamoony5","williamoony5",'0.1000 EOS','0.1000 EOS');

//undelegatebw(prikey,'williamoony5','0.1000 EOS','0.1000 EOS');

// let ret = getAccount('williamoony5');//   EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a
// console.log(JSON.stringify(ret));


// let acc = getAccount('williamoony2');//    EOS8NqJ2aKqPGFkKUUdbgKHWTbMjARAdzuBPznvyCWpYPg5DZJmig
// let perms = newPermissions(acc, 'EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a', 'EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a');//替换成williamoony5的公钥
// console.log(perms);
// updateAuth('xxxxxxxxxx', 'williamoony2', perms);


//refund(prikey,'williamoony5');

// let ret = getActions('williamoony5', 0, 10);
// console.log(ret.actions.length);
// console.log(JSON.stringify(ret));

// transfer(prikey, 'eosio.token', 'williamoony5', 'williamoony2', '0.1000 EOS', '测试转账');

// transfer(prikey, 'everipediaiq', 'williamoony5', 'williamoony2', '0.100 IQ', '转点智商币，聪明起来！');
//transfer('xxx', 'zhaoguosuker', 'zhaoguosuker', 'ha3tcnrygqge', '1000000.0000 EOS', '发财啦');

let voter = "yyloveuu1314"
let proxy = ""
let producers = ['eoshuobipool']
voteproducer(prikey, voter, proxy, producers);

// let ret = getAbi('everipediaiq');
// console.log(JSON.stringify(ret));


// let ret = getTableRows('eosio', 'eosio', 'rammarket');     //ram市场
// console.log(JSON.stringify(ret));

// let ret = ramPrice(1);
// console.log(ret);

// deployToken('xxxxxxx', 'williamoony1', '1000000000.0000 EOS');
