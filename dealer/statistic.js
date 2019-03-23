
const _ = require('lodash');
const nunjucks = require('nunjucks');
const moment = require('moment');

const mail = require('./mail');
const tmpl = `
<h1>{{ day }} 建行支付</h1>
<ul>
{% for k0,v0 in today_income %}
    <li>
        <h3>{{ k0 }}: {{ (v0/100 | float).toFixed(2) }}(元)</h3>
    </li>
    --------------------------------------------
{% endfor %}    
</ul>
<h2>总计：</h2>
{{ (total/100 | float).toFixed(2) }}(元)
`
function do_job(st, et) {
    let start_time = st || moment({ h: 0, m: 0, s: 0 }).format("YYYY-MM-DD HH:mm:ss");
    let end_time = et || moment({ h: 23, m: 59, s: 59 }).format("YYYY-MM-DD HH:mm:ss");

    let today_orders = m_db.collection('order').find({
        "time_end": {
            $gte: start_time,
            $lt: end_time
        }
    }).toArray()

    today_orders.then(orders => {
        // console.log(orders)
        let total = 0, today_income = {};
        _.each(orders, o=>{
            total += o.total_amount;
            if(today_income[o.body] == null){
                today_income[o.body] = 0;
            }
            today_income[o.body] += o.total_amount;
        });
        // console.log(JSON.stringify(today_income, null, 4))
        // console.log(total)
        if (total > 0) {
            let day = (st || et) ? `${start_time}--${end_time}` : moment().format("YYYY-MM-DD");
            today_income = nunjucks.renderString(tmpl, {
                day,
                today_income,
                total
            });
            // console.log(today_income)
            mail.send(`南岳建行支付(${day})销售通知`, null, today_income)
        }
    })
}

module.exports = {
    do_job
}
// console.log(moment().format("YYYY-MM-DD HH:mm:ss"))
// console.log(moment({ h: 0, m: 0, s: 0 }).format("YYYY-MM-DD HH:mm:ss"))
// console.log(moment({ h: 23, m: 59, s: 59 }).format("YYYY-MM-DD HH:mm:ss"))