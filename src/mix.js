const Eos = require('eosjs');
const ecc = require('eosjs-ecc');
const request = require('sync-request');
const binaryen = require('binaryen');
const fs = require('fs');
const BigNumber = require('bignumber.js');
const Format = require('../node_modules/eosjs/lib/format');

/**
 * 节点列表
 * @type {*[]}
 */
let nodes = [
  {
    schema: 'http',
    hostname: '172.18.11.11',
    port: 7777,
    prefix: '',       //私链
  },
  {
    schema: 'http',
    hostname: 'localhost',
    port: 8100,
    prefix: '/eos/nodeos',       //http://localhost:9082/eosmix/nodeos
  },
  {
    schema: 'https',
    hostname: 'api1.eosasia.one',
    prefix: '',
  },
  {
    schema: 'http',
    hostname: '172.18.11.11',
    port: 8100,
    prefix: '/eosapi/nodeos',
  },
  {
    schema: 'http',
    hostname: 'wallet-dev-02.sinnet.huobiidc.com',        // 测试环境
    port: 80,
    prefix: '/eosapi/nodeos',
  },
  {
    schema: 'http',
    hostname: '127.0.0.1',
    port: 7777,
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
let curNode = nodes[0];
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

  jsonToBin: '/v1/chain/abi_json_to_bin',
  binToJson: '/v1/chain/abi_bin_to_json',
  pushTransaction: '/v1/chain/push_transaction',   //推送transaction
  getRequiredKeys: '/v1/chain/get_required_keys',
  getCurrencyStats: '/v1/chain/get_currency_stats',
  getCurrencyBalance: '/v1/chain/get_currency_balance',
  getActions: '/v1/history/get_actions',
  getTransaction: '/v1/history/get_transaction',
  getKeyAccounts: '/v1/history/get_key_accounts',
  getControlledAccounts: '/v1/history/get_controlled_accounts',
  getProducers: '/v1/chain/get_producers',
};
/**
 * 配置,只需要chainId，其他的配置都不需要
 *
 * @type {{chainId: string, keyProvider: string[], expireInSeconds: number, broadcast: boolean, verbose: boolean, sign: boolean}}
 */
let config = {
  chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
  //chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
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
  let ret = post(data, urls.getCurrencyBalance);
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
  let ret = null;
  if (arguments.length <= 1) {
    ret = post(scope, urls.getTableRow);
  } else {
    let data = {scope: scope, code: code, table: table, json: true};
    ret = post(data, urls.getTableRow);
  }
  return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 抵押详情
 * @param account 账户
 * @return {any}
 */
function delband(account) {
  return getTableRows(account, "eosio", "delband");
}

/**
 * 资源详情
 * @param account 账户
 * @return {any}
 */
function userres(account) {
  return getTableRows(account, "eosio", "userres");
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
  return new Promise(async (resolve, reject) => {
    let transactionHeaders = prepareHeader();
    let eos = Eos({
      chainId: config.chainId,
      keyProvider: privateKey,
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
            {"name": "from", "type": "account_name"},
            {"name": "to", "type": "account_name"},
            {"name": "quantity", "type": "asset"},
            {"name": "memo", "type": "string"}
          ]
        }, {
          "name": "create",
          "base": "",
          "fields": [
            {"name": "issuer", "type": "account_name"},
            {"name": "maximum_supply", "type": "asset"}
          ]
        }, {
          "name": "issue",
          "base": "",
          "fields": [
            {"name": "to", "type": "account_name"},
            {"name": "quantity", "type": "asset"},
            {"name": "memo", "type": "string"}
          ]
        }, {
          "name": "account",
          "base": "",
          "fields": [
            {"name": "balance", "type": "asset"}
          ]
        }, {
          "name": "currency_stats",
          "base": "",
          "fields": [
            {"name": "supply", "type": "asset"},
            {"name": "max_supply", "type": "asset"},
            {"name": "issuer", "type": "account_name"}
          ]
        }
        ],
        "actions": [{
          "name": "transfer",
          "type": "transfer",
          "ricardian_contract": ""
        }, {
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
          "key_names": ["currency"],
          "key_types": ["uint64"]
        }, {
          "name": "stat",
          "type": "currency_stats",
          "index_type": "i64",
          "key_names": ["currency"],
          "key_types": ["uint64"]
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
              memo: memo
            }
          }
        ]
      }
    );
    let transaction = nc.transaction;
    let processedTransaction = pushTransaction(transaction);
    console.log("transfer result : ", JSON.stringify(processedTransaction));
    resolve(processedTransaction);
  });
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
 * @param account  赎回账户
 * @param receiver 接收账户
 * @param cpu cpu（eos）
 * @param net net（eos）
 */
async function undelegatebw(privateKey, account, receiver, cpu, net) {
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
      receiver: receiver,
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
function fetchAbi(account) {
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
 * 部署合约
 * @param privateKey 私钥
 * @param account 私钥对应的账户
 * @param wasm wasm
 * @param abi abi
 */
async function deployContract(privateKey, account, wasm, abi) {
  let transactionHeaders = await prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    //binaryen: binaryen,
    //httpEndpoint: 'https://api1.eosasia.one',              //！！！！！！！！！这个地方不对，如果传入endpoint，那abi的下载就走这条路了。
    //httpEndpoint: 'http://172.18.11.11:8100/eosmix/nodeos',
    httpEndpoint: 'http://172.18.11.11:7777',
    transactionHeaders
  });
  await eos.setcode(account, 0, 0, wasm);
  await eos.setabi(account, JSON.parse(abi));
}

/**
 * 获取eos对象（准备好私钥和合约的eos对象）
 * @param privateKey 签名用的私钥
 * @param account 合约账户
 * @return {Promise<*>}
 */
async function eos(privateKey, account) {
  let abi = fetchAbi(account);
  let transactionHeaders = await prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  await eos.fc.abiCache.abi(account, abi.abi);
  return eos;
}

/**
 * 查看超级节点
 *
 * @param lowerBound 账户名
 * @param limit
 * @return {any}
 */
function getProducers(lowerBound, limit) {
  let data = {
    json: true,
    lower_bound: lowerBound,
    limit: limit
  };
  let ret = post(data, urls.getProducers);
  return JSON.parse(ret.getBody('utf-8'));
}

/**
 * 投票
 * @param  voter 账户
 * @param  proxy 为 '' 表示 voter直投， 如果不为空则为voter授权proxy代理投票，此时producers数组需为空
 * @param  producers 为投给的节点账户名数组,并且需要按照账户名字母排序  like ['eos42freedom','eoshuobipool']
 */
async function vote(privateKey, voter, proxy, producers) {
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
 * 注册为代理
 * @param proxy:account register or unregister for proxy
 * @param isproxy: 1 for register, 0 for unregister
 */
async function regProxy(privateKey, proxy, isproxy) {
  let transactionHeaders = await prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let nc = await eos.regproxy({
    proxy: proxy,
    isproxy: isproxy
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
  let options = {};
  options.headers = {'Postman-Token': '364a16a3-fbd1-4c94-97dc-7de38445334d'};
  options.json = content == null ? {} : content;
  let ret = request('POST', url, options);
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

/**
 * 公钥
 * @param privateKey
 */
function publicKey(privateKey) {
  let pub = ecc.privateToPublic(privateKey);
  return pub;
}

/**
 *
 * @param privateKey 私钥
 * @param code 合约账户
 * @param actor 私钥对应的账户
 * @param user hi参数
 * @return {Promise<void>}
 */
async function hi(privateKey, code, actor, user) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);

  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'hi',
          authorization: [{
            actor: actor,
            permission: 'active'
          }],
          data: {
            user: user,
          }
        }
      ]
    }
  );

  //another implement, also OK!
  //let contract = await eos.contract('yy');
  //let nc = await contract.hi('yy',{  authorization: 'yy' });

  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

/**
 * ping 函数调用
 * @param privateKey 私钥
 * @param code 合约
 * @param actor 私钥对应的账户
 * @return {Promise<void>}
 */
async function ping(privateKey, code, actor) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);

  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'ping',
          authorization: [{
            actor: actor,
            permission: 'active'
          }],
          data: {}
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("beat result : ", JSON.stringify(processedTransaction));
}

async function erase(privateKey, code, actor) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);

  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'erase',
          authorization: [{
            actor: actor,
            permission: 'active'
          }],
          data: {}
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("reset result : ", JSON.stringify(processedTransaction));
}

/**
 * wallet sdk给第三方调用的示例代码
 * dapp的代码
 */
// function invokeWallet() {
//     const account = wallet.account();
//     const walletEos = wallet.eos();
//     walletEos.invoke(
//         {
//             contract: 'hello',
//             method: 'hi',
//             authorization: [{
//                 actor: account.name,
//                 permission: account.permission
//             }],
//             params: {
//                 user: 'hi...',
//             }
//         }，{
//             ......
//           }
//     );
//
// }


async function issue(privateKey, code, issuer, receiver, amount, memo) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'issue',
          authorization: [{
            actor: issuer,
            permission: 'active'
          }],
          data: {
            to: receiver,
            quantity: amount,
            memo: memo
          }
        }
      ]
    }
  );

  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

/**
 * setfund
 * @param privateKey
 * @param code
 * @param actor
 * @param fund
 * @return {Promise<void>}
 */
async function setfund(privateKey, code, fund) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'setfund',
          authorization: [{
            actor: code,
            permission: 'active'
          }],
          data: {
            fund: fund
          }
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

/**
 * set admin
 * @param privateKey
 * @param code
 * @param admin
 * @return {Promise<void>}
 */
async function setadmin(privateKey, code, admin) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi(code);
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi(code, abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: code,
          name: 'setadmin',
          authorization: [{
            actor: code,
            permission: 'active'
          }],
          data: {
            admin: admin
          }
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}


async function linkauth(privateKey, account, data) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi('eosio');
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi('eosio', abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: 'eosio',
          name: 'linkauth',
          authorization: [{
            actor: account,
            permission: 'active'
          }],
          data: data
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

async function unlinkauth(privateKey, account, data) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: privateKey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi('eosio');
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi('eosio', abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: 'eosio',
          name: 'unlinkauth',
          authorization: [{
            actor: account,
            permission: 'active'
          }],
          data: data
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

async function get(data) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: '5Jq1XzuZ1dsGb2LSgsfA9nmpSEUpo3NnRkAYb9MdzRuFoTHZsEC',
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi('redpacketeos');
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi('redpacketeos', abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: 'redpacketeos',
          name: 'get',
          authorization: [{
            actor: 'eosfreetouse',
            permission: 'redpacket'
          }],
          data: data
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("transfer result : ", JSON.stringify(processedTransaction));
}

/**
 * 领红包
 * @param data
 * @return {Promise<void>}
 */
async function getRed(prikey, id, receiver) {
  let transactionHeaders = prepareHeader();
  let eos = Eos({
    chainId: config.chainId,
    keyProvider: prikey,
    httpEndpoint: null,
    transactionHeaders
  });
  let abi = fetchAbi('rptest111111');
  let abi_json = abi.abi;
  await eos.fc.abiCache.abi('rptest111111', abi_json);
  let nc = await eos.transaction(
    {
      actions: [
        {
          account: 'rptest111111',
          name: 'get',
          authorization: [{
            actor: receiver,
            permission: 'active'
          }],
          data: {
            id: id,
            receiver: receiver
          }
        }
      ]
    }
  );
  let transaction = nc.transaction;
  let processedTransaction = pushTransaction(transaction);
  console.log("getRed result : ", JSON.stringify(processedTransaction));
}


// let data = {
//   receiver: "williamoony2",
//   id: "15434920280946776",
//   sig: "SIG_K1_K6pf4hhsfNzSsLgZusjNv2KTgPNySyQ5W6Da7xM9Eesz3jQLQPX5xkUgzr6CyN7wEkMeQXijmZgAcDV9NZAr626UUDCZkn"
// };
// try {
//   get(data);
// } catch (e) {
//   console.log(e);
// }


//随机一个私钥
//randomKey();

//let prikey = 'xxxxxx';
// let prikey = 'xxx';
// let pubKey = 'EOS8icXZmymmiVUbV7jERCereDY75Fo3MMNbbK8VVwPEGceifbT9D';

// let ret = getKeyAccounts(pubKey);
// console.log(ret);

// let ret = getCurrencyBalance('williamoony1', 'williamoony1', 'EOS');//获取代币持有情况
// console.log(ret);


// let ret = getTableRows('williamoony5', 'eosio', 'userres');//获取资源情况
// console.log(ret);

// let ret = userres('williamoony5');
// console.log(ret);

// let ret = delband('liuzhigang55');
// console.log(ret);


// transferEos('xxxxxx', 'williamoony1', 'ikhygsdruw12', '1.0000 EOS', 'for check . ');


// let pubkey = 'EOS5P24pkBpkzrun4TrxtyerLLZ5RVVcWi3pLrT2QiEq3oTiCUsSf';//先randomKey生成一对公私钥，然后创建账户
// newAccount('xxxxxx', 'williamoony1', 'ikhygsdruw12', pubkey);


// delegatebw(prikey,"williamoony5","williamoony5",'0.1000 EOS','0.1000 EOS');

//undelegatebw(prikey,'williamoony5','0.1000 EOS','0.1000 EOS');


// let prikey='xxxx';
// let acc = getAccount('williamoony2');//    EOS85KA15qFrdG3SqZ8pcBVi7G8AypBf9WG4HGFb8VtCb8NiWD7an
// console.log(JSON.stringify(acc));
// let perms = newPermissions(acc, 'EOS85KA15qFrdG3SqZ8pcBVi7G8AypBf9WG4HGFb8VtCb8NiWD7an', 'EOS85KA15qFrdG3SqZ8pcBVi7G8AypBf9WG4HGFb8VtCb8NiWD7an');
// console.log(perms);
// updateAuth(prikey, 'williamoony2', perms);


// let perms = [{
//   "perm_name": "active",
//   "parent": "owner",
//   "required_auth": {
//     "threshold": 1,
//     "keys": [{
//       "key": "EOS635ETyYi4ZNCeHwasM2Q5Pp58vXt6idRnTDcsbrHVpwK1RWQ1Z",
//       "weight": 1
//     }],
//     "accounts": [],
//     "waits": []
//   }
// }, {
//   "perm_name": "owner",
//   "parent": "",
//   "required_auth": {
//     "threshold": 1,
//     "keys": [{
//       "key": "EOS635ETyYi4ZNCeHwasM2Q5Pp58vXt6idRnTDcsbrHVpwK1RWQ1Z",
//       "weight": 1
//     }],
//     "accounts": [],
//     "waits": []
//   }
// }, {
//   "perm_name": "redpacket",
//   "parent": "active",
//   "required_auth": {
//     "threshold": 1,
//     "keys": [{
//       "key": "EOS6ReqckGA6ZwAXYET2iFxm5YtCQD3hAG73SWf2T6UUs3FmZhHkg",
//       "weight": 1
//     }],
//     "accounts": [],
//     "waits": []
//   }
// }];
// updateAuth('5KGQEVnw9oqwCAs1Qn7E8bf1hJos8b7xi9rAiS2pYyrazTcxu2c', 'eosfreetouse', perms);

// let actionAuth = {
//   account: "eosfreetouse",
//   code: "redpacket",
//   type: "get",
//   requirement: "redpacket"
// }
// let unauth = {
//   account: "eosfreetouse",
//   code: "redpacket",
//   type: "get"
// };
//
// let pri = '5KGQEVnw9oqwCAs1Qn7E8bf1hJos8b7xi9rAiS2pYyrazTcxu2c';
// try {
//
//   linkauth(pri, 'eosfreetouse', actionAuth);
// } catch (e) {
//   console.log(e);
// }

// try {
//
//   unlinkauth(pri, 'eosfreetouse', unauth);
// } catch (e) {
//   console.log(e);
// }
// let pri = '5KGQEVnw9oqwCAs1Qn7E8bf1hJos8b7xi9rAiS2pYyrazTcxu2c';
// try {
//   //setfund(pri, 'redpacket', 'signupeospro');
//   setadmin(pri, 'redpacket', 'eosfreetouse');
// } catch (e) {
//   console.log(e);
// }


//refund(prikey,'williamoony5');

// let ret = getActions('williamoony5', 0, 10);
// console.log(ret.actions.length);
// console.log(JSON.stringify(ret));

// prikey = 'xxxxx';
// try {
//     //transfer(prikey, 'williamoony1', 'williamoony1', 'williamoony5', '0.0001 EOS', '取钱');
//     transferEos(prikey,'williamoony1','williamoony5','0.0001 EOS','取钱');//gy4temjrhage
// } catch (e) {
//     console.log(e);
// }
// prikey = 'xxxxx';
// pubKey = ecc.privateToPublic(prikey);
// console.log(pubKey);
// try {
//   transferEos(prikey, 'williamoony1', 'marslandlord', '0.0001 EOS', 'test');
// } catch (e) {
//   console.log(e);
// }


// prikey='xxxx';
// transfer(prikey, 'williamoony1', 'williamoony1', 'yanliang5555', '10000.0000 EOS', '发钱啦');

let prikey = '5KGQEVnw9oqwCAs1Qn7E8bf1hJos8b7xi9rAiS2pYyrazTcxu2c';
let pubkey = 'EOS635ETyYi4ZNCeHwasM2Q5Pp58vXt6idRnTDcsbrHVpwK1RWQ1Z';
let contract = 'rptest111111';
// let ret = getKeyAccounts(pubkey);
// console.log(JSON.stringify(ret));

// ret = getCurrencyBalance('eosio.token', 'eosfreetouse', 'EOS');
// console.log(JSON.stringify(ret));
// try {
//   newAccount(prikey, 'eosfreetouse', 'rptest111111', pubkey, 409600, '100.0000 EOS', '100.0000 EOS');    //ram = 4096, cpu = '0.2000 EOS', net = '0.2000 EOS'
// } catch (e) {
//   console.log(e);
// }

/**发合约*/
// let wasm = fs.readFileSync(`./redpacket.wasm`);
// let abi = fs.readFileSync(`./redpacket.abi`);
// try {
//   deployContract(prikey, contract, wasm, abi);
// } catch (e) {
//   console.log(e);
// }

// let ret = fetchAbi(contract);
// console.log(JSON.stringify(ret));

/**改permission*/
/**
 let perms = [{
  "perm_name": "active",
  "parent": "owner",
  "required_auth": {
    "threshold": 1,
    "keys": [{
      "key": pubkey,
      "weight": 1
    }],
    "accounts": [{
      "permission": {
        "actor": contract,
        "permission": "eosio.code"
      },
      "weight": 1
    }],
    "waits": []
  }
}, {
  "perm_name": "owner",
  "parent": "",
  "required_auth": {
    "threshold": 1,
    "keys": [{
      "key": pubkey,
      "weight": 1
    }],
    "accounts": [],
    "waits": []
  }
}];
 console.log(perms);
 updateAuth(prikey, contract, perms);
 */

/**发红包*/
//transfer(prikey, 'eosio.token', 'test2', contract, '2.0000 EOS', '1-6-2-2-hi...');

/**查库(id)*/
// params = {
//     "code": contract,
//     "scope": contract,
//     "table": "redpacket",
//     "json": true,
//     "lower_bound": 1,
//     "upper_bound": 2
// };
// let ret = getTableRows(params);
// console.log(JSON.stringify(ret));

/**查库(根据sender查)*/
let sender = 'test2';
let table_key = new BigNumber(Format.encodeName(sender, false));
let params = {
  code: contract,
  scope: contract,
  table: "redpacket",
  json: true,
  lower_bound: table_key.toString(),
  upper_bound: table_key.plus(1).toString(),
  limit: 1,
  key_type: 'i64',
  index_position: 2
};
let ret = getTableRows(params);
console.log(JSON.stringify(ret));


// /**领红包*/
// getRed(prikey, 1, 'test2');


// let ret = fetchAbi('everipediaiq');
// console.log(JSON.stringify(ret));


// let ret = getTableRows('eosio', 'eosio', 'rammarket');     //ram市场
// console.log(JSON.stringify(ret));

// let ret = ramPrice(1);
// console.log(ret);

// deployToken('xxx', 'williamoony5', '1000000000.0000 EOS');

// let ret = getProducers( '', 400000);
// console.log(ret);


/*
try {
    issue(prikey, "uu", "uu", "yy","900000.0000 SYS", "dispatch to yy");
} catch (e) {
    console.log(e);//
}
*/

// prikey = 'xxxx';
// let ret = getAccount('williamoony1');//   EOS6pEzrdKwTpqURTp9Wocc6tdYTfZrGhE7hTKKfhZupFsoWCwn6a
// console.log(JSON.stringify(ret));


// let perms = [{
//   "perm_name": "active",
//   "parent": "owner",
//   "required_auth": {
//     "threshold": 1,
//     "keys": [{
//       "key": "EOS5GjTfXVaVAcvoJy5q8PQngunfnpauV5CzVfxYuoWuqWFuTBM3L",
//       "weight": 1
//     }],
//     "accounts": [{
//       "permission": {
//         "actor": "marslandlord",
//         "permission": "eosio.code"
//       },
//       "weight": 1
//     }],
//     "waits": []
//   }
// }, {
//   "perm_name": "owner",
//   "parent": "",
//   "required_auth": {
//     "threshold": 1,
//     "keys": [{
//       "key": "EOS5GjTfXVaVAcvoJy5q8PQngunfnpauV5CzVfxYuoWuqWFuTBM3L",
//       "weight": 1
//     }],
//     "accounts": [],
//     "waits": []
//   }
// }];
// console.log(perms);
// updateAuth(prikey, 'marslandlord', perms);


// try {
//     hi(prikey, "marslandlord", "marslandlord", "marslandlord");
// } catch (e) {
//     console.log(e);//
// }

//erase(prikey, 'marslandlord', 'marslandlord');


// prikey = 'xxxx';
// let wasm = fs.readFileSync(`./empty.wasm`);
// let abi = fs.readFileSync(`./empty.abi`);
// try {
//   deployContract(prikey, "marslandlord", wasm, abi);
// } catch (e) {
//   console.log(e);
// }


// prikey = 'xxxx';
// let wasm = fs.readFileSync(`./eosdayeosday.wasm`);
// let abi = fs.readFileSync(`./eosdayeosday.abi`);
// try {
//   deployContract(prikey, "marslandlord", wasm, abi);
// } catch (e) {
//   console.log(e);
// }


// prikey = 'xxxx';
// let ret=getKeyAccounts(ecc.privateToPublic(prikey));
// console.log(JSON.stringify(ret));
//
// try {
//   transfer(prikey, 'eosio.token', 'williamoony5', 'williamoony1', '0.0001 EOS', '测试');
//
// } catch (e) {
//   console.log(e);
// }


// buyrambytes(prikey,'marslandlord','marslandlord',300*1024);

//delegatebw(prikey,"marslandlord","marslandlord",'2.0000 EOS','1.1000 EOS');


// prikey = 'xxxxx';
// try {
//   ping(prikey, 'marslandlord', 'marslandlord');
// } catch (e) {
//   console.log(e);
// }


// prikey = 'xxxxx';
// erase(prikey, 'marslandlord', 'marslandlord');


//合约的数据库访问
// let table_key = new BigNumber(Format.encodeName('williamoony1', false));
// let params = {
//     "code": "williamoony5",
//     "scope": "williamoony5",
//     "table": "playertable",
//     "json": true,
//     "lower_bound": table_key.toString(),
//     "upper_bound": table_key.plus(1).toString(),
//     "limit": 1111
// };
//
// table_key = new BigNumber(Format.encodeName('williamoony1', false));
// params = {
//     "code": "marslandlord",
//     "scope": "marslandlord",
//     "table": "userbalance",
//     "json": true,
//     "lower_bound": 0,
//     "upper_bound": -1,
//     "limit": 1111
// };
// table_key = new BigNumber(Format.encodeName('williamoony1', false));

//userbalance   playertable   counter

// params = {
//     "code": "marslandlord",
//     "scope": "marslandlord",
//     "table": "counter",
//     "json": true,
//     "lower_bound": 0,
//     "upper_bound": -1
//
// };
// let ret = getTableRows(params);
// console.log(JSON.stringify(ret));
//
// params.table='userbalance';
// ret = getTableRows(params);
// console.log(JSON.stringify(ret));
//
// params.table='playertable';
// ret = getTableRows(params);
// console.log(JSON.stringify(ret));


// let ret = getInfo();
// console.log(JSON.stringify(ret));
