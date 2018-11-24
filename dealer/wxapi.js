const querystring = require('querystring');
const xml = require('xml');
const wxpay = require('./wxpay');
const util = require('../common/util');
const cfg = require('../secret');

async function handle_uid(req, res) {
    let sess = req.session;
    let code = req.query.code;
    if (!code) {
        let rurl = req.query.rurl;
        if (!rurl) {
            return res.end('no return url');
        }
        sess.rurl = rurl;
        //snsapi_base or snsapi_userinfo
        const qs = querystring.stringify({
            appid: cfg.wx_app_id,
            redirect_uri: `${util.get_myurl_by_req(req)}/wx/uid`,
            response_type: 'code',
            scope: 'snsapi_base',
            state: 'freego'
        });
        r_url = `https://open.weixin.qq.com/connect/oauth2/authorize?${qs}#wechat_redirect`;
        // console.log(r_url);
        res.redirect(r_url);
    } else {
        const data = await wxpay.get_uid(code);
        const rurl = `${sess.rurl}?openid=${data.openid}`;
        res.redirect(rurl);
    }
}
async function handle_uif(req, res) {
    let sess = req.session;
    let code = req.query.code;
    if (!code) {
        let rurl = req.query.rurl;
        if (!rurl) {
            return res.end('no return url');
        }
        sess.rurl = rurl;
        //snsapi_base or snsapi_userinfo
        const qs = querystring.stringify({
            appid: cfg.wx_app_id,
            redirect_uri: `${util.get_myurl_by_req(req)}/wx/uif`,
            response_type: 'code',
            scope: 'snsapi_userinfo',
            state: 'freego'
        });
        r_url = `https://open.weixin.qq.com/connect/oauth2/authorize?${qs}#wechat_redirect`;
        // console.log(r_url);
        res.redirect(r_url);
    } else {
        const data = await wxpay.get_uinfo(code);
        const rurl = `${sess.rurl}?${querystring.stringify(data)}`;
        res.redirect(rurl);
    }
}

async function post_tmpl_msg(req, res) {
    if (!req.body) return res.sendStatus(400);
    let data = req.body;
    data = await wxpay.post_tmpl_msg(data);
    res.json(data);
}
async function handle_verify(req, res) {

    const token = 'ExgGQu1gcUguYxfUXZ9gGU91g11CFUGb';
    let signature = req.query.signature;
    let timestamp = req.query.timestamp;
    let nonce = req.query.nonce;
    let echostr = req.query.echostr;
    let str = [nonce, timestamp, token];
    str = str.sort().join('');
    // console.log(str);
    let sig = util.sha1(str)
    console.log(req.query, sig);
    if (sig == signature) {
        res.end(echostr);
    } else {
        res.end('signature error');
    }
}
async function handle_activity(req, res) {
    console.log('post /do', req.body.xml);
    let data = req.body.xml;
    let myid = data.tousername[0];
    let oid = data.fromusername[0];
    let msgtype = data.msgtype[0];
    let ndt = new Date();
    let resp = xml([
        {
            xml: [
                { ToUserName: { _cdata: oid } },
                { FromUserName: { _cdata: myid } },
                { CreateTime: ndt.getTime() },
                { MsgType: { _cdata: 'text' } },
                { Content: { _cdata: '欢迎进入智慧旅游' } }
            ]
        }
    ], true)
    // console.log(resp);
    /*<xml>
        <ToUserName><![CDATA[ok7PPv1TI3LbP6ixCdOW3Dv_Vo14]]></ToUserName>
        <FromUserName><![CDATA[gh_42a5b5a3801a]]></FromUserName>
        <CreateTime>1496381923782</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[欢迎进入智慧旅游]]></Content>
    </xml>*/
    if (msgtype == 'text') {

        res.end(resp);
    } else if (msgtype == 'event') {
        let event = data.event[0];
        if (event == 'subscribe') {
            console.log('用户关注');
            res.end(resp);
        } else if (event == 'unsubscribe') {
            res.end('success');
        }
    } else {
        res.end('success');
    }
}
function init(app) {
    app.get('/wx/uid', handle_uid);
    app.get('/wx/uif', handle_uif);
    app.post('/wx/notify_user', post_tmpl_msg);

    app.get('/wx/do', handle_verify);
    app.post('/wx/do', handle_activity);
}
// 恭喜购票成功\n\n票名:{ {name.DATA} }\n价格:{ {price.DATA} }\n有效期:{ {duetime.DATA} }\n{ {remark.DATA} } 
module.exports = {
    init,
    handle_uid
}