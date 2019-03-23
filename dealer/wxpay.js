
const util = require('../common/util');
const request = require('request-promise-native')
const moment = require('moment');
const qs = require('querystring').stringify;
const cfg = require('../secret');
class Wxpay {
	constructor() {
		this.get_access_token()
	}
	
	async get_uid(code) {
		const data = {
			appid: cfg.wx_app_id,
			secret: cfg.wx_app_sc,
			code,
			grant_type: "authorization_code"
		}
		const url = `https://api.weixin.qq.com/sns/oauth2/access_token?${qs(data)}`;
		// console.log(url);
		let res = await request({ url, method: 'GET' });
		res = JSON.parse(res);
		return res;
	}
	async get_uinfo(code) {
		const rd = await this.get_uid(code);
		const data = {
			access_token: rd.access_token,
			openid: rd.openid,
			lang: cfg.CHARSET,
			sign_type: "zh_CN"
		}
		const url = `https://api.weixin.qq.com/sns/userinfo?${qs(data)}`;
		let res = await request({ url, method: 'GET' });
		res = JSON.parse(res);
		console.log(res);
		return res;
	}
	async get_access_token(){
		const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${cfg.wx_app_id}&secret=${cfg.wx_app_sc}`;
		let res = await request({ url });
		res = JSON.parse(res);
		this.access_token = res.access_token;
		// console.log(`access_token=${this.access_token}`)
		//7200s 2hour
		await util.delay(7000 * 1000)
		this.get_access_token();
	}
	async post_tmpl_msg(data){
		const usr = await this.get_usr_info(data.touser);
		if(usr.subscribe == 1){
			const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${this.access_token}`;
			data.template_id = "vq9nYfxFk9oXJgb1pLeEAb1k2T7cQWg4pQmPXX-tYwg";
			// console.log( data)
			let res = await request.post({ url, json: data });
			// console.log( res)
			return {
				ret: res.errcode,
				msg: res.errmsg
			}
		} else if(usr.subscribe == 0){
			// cache msg
			m_db.collection('notification').insert(data)
		} else{
			// usr.subscribe maybe null
		}
		return {
			ret: -1,
			msg: usr.errmsg || "用户未关注"
		};
	}
	async get_usr_info(openid){
		const url = `https://api.weixin.qq.com/cgi-bin/user/info?access_token=${this.access_token}&openid=${openid}&lang=zh_CN`;
		let res = await request({ url});
		res = JSON.parse(res);
		// console.log( res)
		return res;
	}
}

module.exports = new Wxpay();