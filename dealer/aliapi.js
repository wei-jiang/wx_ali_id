const querystring = require('querystring');
const alipay = require('./alipay');
const util = require('../common/util');
const cfg = require('../secret');

async function handle_uid(req, res){
    let sess = req.session;
    let code = req.query.auth_code;
    if (!code) {
        let rurl = req.query.rurl;
        if (!rurl) {
            return res.end('no return url');
        }
        sess.rurl = rurl;
        //auth_base or auth_user
        const qs = querystring.stringify({
            app_id: cfg.APP_ID,
            redirect_uri: `${util.get_myurl_by_req(req)}/ali/uid`,
            scope: 'auth_base',
            state: 'freego'
        });
        let r_url = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?${qs}`;
        // console.log(r_url);
        res.redirect(r_url);
    } else {
        const data = await alipay.get_uid(code);
        let rurl = `${sess.rurl}?user_id=${data.user_id}`;
        res.redirect(rurl);
    }
}
async function handle_uif(req, res) {
    let sess = req.session;
    let code = req.query.auth_code;
    if (!code) {
        let rurl = req.query.rurl;
        if (!rurl) {
            return res.end('no return url');
        }
        sess.rurl = rurl;
        //auth_base or auth_user
        const qs = querystring.stringify({
            app_id: cfg.APP_ID,
            redirect_uri: `${util.get_myurl_by_req(req)}/ali/uif`,
            scope: 'auth_user',
            state: 'freego'
        });
        let r_url = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?${qs}`;
        res.redirect(r_url);
    } else {
        const data = await alipay.get_uinfo(code);
        const qs = querystring.stringify(data);
        let rurl = `${sess.rurl}?${qs}`;
        res.redirect(rurl);

    }
}
function test_get_uid(req, res) {
    let user_id = req.query.user_id;
    if(user_id) {
        console.log('/ali/test_get_uid, user_id=' + user_id);
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        return res.end( JSON.stringify(req.query) );
    }
    const qs = querystring.stringify({
        rurl: `${util.get_myurl_by_req(req)}/ali/test_get_uid`
    });
    res.redirect(`${util.get_myurl_by_req(req)}/ali/uid?${qs}`);
  }
function init(app) {
    app.get('/ali/uid', handle_uid);
    app.get('/ali/uif', handle_uif);
    app.get('/ali/test_get_uid', test_get_uid);
}

module.exports = {
    init,
    handle_uid
}