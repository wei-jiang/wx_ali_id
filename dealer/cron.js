const CronJob = require('cron').CronJob;
const moment = require('moment');
const mail = require('./mail');
const stat = require('./statistic');
const credential = require('../secret')

// mail.send(`建行支付服务重启`, null, `建行支付服务重启通知【${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}】`, credential.to_admin)

const job = new CronJob('55 59 23 * * *', () => {
  // console.log('send report mail');
  // mail.send('test email', 'test content')
  // clear7days_before()
  stat.do_job()
}, null, false, 'Asia/Shanghai');
async function clear7days_before() {
  let time_point = moment({ h: 0, m: 0, s: 0 }).subtract(7, 'd').format("YYYY-MM-DD HH:mm:ss");
  // console.log(time_point)
  try {
    // let count = await (m_db.collection('order').countDocuments({}))
    // console.log(`count before clear all orders = ${count}`)
    const ret = await (m_db.collection('order').deleteMany({
      "time_end": {
        $lt: time_point
      }
    }))
    console.log(`clear7days_before operation success, (${ret.deletedCount}) deleted`)
    // count = await (m_db.collection('order').countDocuments({}))
    // console.log(`count after clear all orders = ${count}`)
  } catch (err) {
    console.log('clear7days_before operation failed', err)
  }
  return 'done'
}
module.exports = {
  start: () => {
    //pm2 first node
    if (typeof process.env.NODE_APP_INSTANCE == 'undefined' || process.env.NODE_APP_INSTANCE == 0) {
      //schedule your cron job here since this part will be executed for only one cluster
      job.start()
    }
  }
}
