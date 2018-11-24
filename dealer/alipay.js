
const util = require('../common/util');
const request = require('request-promise-native')
const moment = require('moment');
const qs = require('querystring').stringify;
const cfg = require('../secret');
class Alipay {
	constructor() {
		if (cfg.PRIVATE_KEY.indexOf('PRIVATE KEY') < 0) {
			cfg.PRIVATE_KEY = util.raw2pkcs8pem_pri(cfg.PRIVATE_KEY);
		}
		if (cfg.PUBLIC_KEY.indexOf('PUBLIC KEY') < 0) {
			cfg.PUBLIC_KEY = util.raw2pkcs8pem_pub(cfg.PUBLIC_KEY);
		}
		if (cfg.ALIPAY_PUBLIC_KEY.indexOf('PUBLIC KEY') < 0) {
			cfg.ALIPAY_PUBLIC_KEY = util.raw2pkcs8pem_pub(cfg.ALIPAY_PUBLIC_KEY);
		}
		this.conf = cfg
		this.util = util
		
	}
	//object to querystring
	querystring(data) {
		const qs = Object.keys(data)
			.filter(key => {
				return data[key] !== undefined && data[key] !== '' && ['pfx', 'sign', 'key'].indexOf(key) < 0;
			})
			.sort()
			.map(key => `${key}=${data[key]}`).join("&")
		return qs;
	}
	rsa_sign(data) {
		const qs = this.querystring(data)
		// console.log(qs)
		const hex_sign = util.rsa2_sign(this.conf.PRIVATE_KEY, qs);
		//阿里的sign还要转为base64格式
		data.sign = Buffer.from(hex_sign, 'hex').toString('base64')
		return data;
	}
	sign(data) {
		this.rsa_sign(data);
	}
	ret_data_str(ret_data) {
		for (let key in ret_data) {
			if (ret_data.hasOwnProperty(key) && /_response/.test(key)) {
				return JSON.stringify(ret_data[key])
			}
		}
	}
	verify_ret_rsa2(ret_data) {
		const sign = Buffer.from(ret_data.sign, 'base64').toString('hex');
		const data = this.ret_data_str(ret_data)
		// console.log('待验签数据=' + data)
		return util.rsa2_verify(this.conf.ALIPAY_PUBLIC_KEY, data, sign)
	}
	verify_notify_rsa2(ret_data) {
		// todo ...
		return this.verify_ret_rsa2(ret_data);
	}
	async get_uid(code) {
		const data = {
			app_id: this.conf.APP_ID,
			method: "alipay.system.oauth.token",
			charset: this.conf.CHARSET,
			sign_type: this.conf.SIGN_TYPE,
			timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
			version: '1.0',
			grant_type: this.conf.GRANT_TYPE,
			code
		}
		this.sign(data);
		const url = `${this.conf.ALIPAY_GATEWAY}?${qs(data)}`;
		// console.log(url);
		let res = await request({ url, method: 'POST' });
		res = JSON.parse(res);
		// if( this.verify_ret_rsa2(res) ){
		// 	console.log('验签成功');
		// } else{
		// 	console.log('验签失败');
		// }
		return res.alipay_system_oauth_token_response;
	}
	async get_uinfo(code) {
		const rd = await this.get_uid(code);
		const data = {
			app_id: this.conf.APP_ID,
			method: "alipay.user.info.share",
			charset: this.conf.CHARSET,
			sign_type: this.conf.SIGN_TYPE,
			timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
			version: '1.0',
			grant_type: this.conf.GRANT_TYPE,
			code,
			auth_token: rd.access_token
		}
		this.sign(data);
		const url = `${this.conf.ALIPAY_GATEWAY}?${qs(data)}`;
		let res = await request({ url, method: 'POST' });
		res = JSON.parse(res);
		// if( this.verify_ret_rsa2(res) ){
		// 	console.log('验签成功');
		// } else{
		// 	console.log('验签失败');
		// }
		console.log(res);
		return res.alipay_user_info_share_response;
	}

}

module.exports = new Alipay();