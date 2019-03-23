
const _ = require('lodash');
const ssms = {};
const admins = new Set();
function init(ws) {
    function fresh_ssms(){
        for (let a of admins) {
            a.send(JSON.stringify({
                cmd: 'online_ssms',
                ssms: _.map(ssms, w => w.ssm)
            }))
        }
        
    }
    ws.on('message', message => {
        // console.log('received: %s', message);
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            return ws.send('need json object')
        }

        if (data.cmd == 'ssm_online') {
            ws.ssm = data;
            ssms[data.dev_id] = ws;
            fresh_ssms();
        } else if (data.cmd == 'admin_online') {
            admins.add(ws)
            fresh_ssms()
        } else if (data.cmd == 'send_log') {
            console.log('in send_log', data)
            const tid = data.dev_id;
            if(ssms[tid]){
                ssms[tid].send( JSON.stringify(data) )
            }
            
        } else {

        }
        // ws.send(`echo from server: ${message}`)
    });
    ws.on('error', err => {
        console.log('ws client error');
    });
    ws.on('close', reason => {
        console.log('ws client closed');
        if (ws.ssm) {
            delete ssms[ws.ssm.dev_id];
            fresh_ssms()
        }
        admins.delete(ws)
    });
    // console.log('ws client connected +');

}
module.exports = {
    init
}