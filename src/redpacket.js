/**
 * 红包的逻辑
 * 1，最少需要发0.1个eos
 * 2，领取人数最多100
 * 3，每人获得的红包最小为0.001
 * 4，24小时有效期
 * 5，72小时候后删除
 */
const BigNumber = require('bignumber.js');
const Format = require('../node_modules/eosjs/lib/format');
const ecc = require('eosjs-ecc');
const mix = require('./mix');

/**红包合约*/
const contract = 'rptest333333';

/**用户的私钥(钱包里才有，示例为了签名直接写在这里)*/
const prikey = '5KGQEVnw9oqwCAs1Qn7E8bf1hJos8b7xi9rAiS2pYyrazTcxu2c';

/**用户的账户名（需要从钱包里获得）*/
const account = 'test1';

/**
 * 发红包
 * @param type 类型（1普通2拼手气）
 * @param amount 红包大小（比如 '1.0000 EOS'）
 * @param limit 红包领取人数上限
 * @param blessing ㊗️语
 */
function sendRedpacket(type, amount, limit, blessing) {
  ecc.randomKey().then(privateKey => {
    let publicKey = ecc.privateToPublic(privateKey);
    let id = new Date().getTime();
    let memo = '1-' + id + '-' + type + '-' + limit + '-' + publicKey + '-' + blessing;
    mix.transfer(prikey, 'eosio.token', account, contract, amount, memo);
    sended(id, privateKey);
  });
}

/**
 * 红包发完以后回调
 * @param id 红包id
 * @param privateKey 收红包需要的私钥
 */
function sended(id, privateKey) {
  //这里把网页（share.html）分享给微信
  let url = 'http://xxxx/share.html?secret=' + id + '-' + privateKey;
  //看到网页的用户打开网页把'secret'（id + '-' + privateKey）复制到clipboard；然后打开钱包里面的红包dapp，粘贴'secret'到领取码输入框，点击领取，则执行getRedpacket
}

/**
 * 收红包
 * @param id
 * @param privateKey
 */
function getRedpacket(id, privateKey) {
  let data = new Date().getTime();
  let sig = ecc.sign(data.toString(), privateKey);
  let params = {
    id: id,
    receiver: account,
    data: data,
    sig: sig
  };
  mix.exec(prikey, account, contract, 'get', params);
}

/**
 * 查看红包详情
 *
 * @param id 红包id
 */
function redpacketInfo(id) {
  params = {
    "code": contract,
    "scope": contract,
    "table": "redpacket",
    "json": true,
    "lower_bound": id,
    "upper_bound": id + 1
  };
  let ret = mix.getTableRows(params);
  return ret;
}

/**
 * 查看某账户已发出的所有红包
 * @param sender 发红包者
 */
function getSendedRedpackets(sender) {
  let table_key = new BigNumber(Format.encodeName(sender, false));
  let params = {
    code: contract,
    scope: contract,
    table: "redpacket",
    json: true,
    lower_bound: table_key.toString(),
    upper_bound: table_key.plus(1).toString(),
    //limit: 1,
    key_type: 'i64',
    index_position: 2
  };
  let ret = getTableRows(params);
  return ret;
}

let ret=redpacketInfo(1);
console.log(JSON.stringify(ret));