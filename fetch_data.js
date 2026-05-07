const fs = require('fs');

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const APP_TOKEN = "CSazbwvezaQslWsSuTscwdwwnDf"; 
const TABLE_ID = "tbl5kuw0CNPXovfW";

async function getAccessToken() {
    const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    const data = await res.json();
    return data.tenant_access_token;
}

async function fetchRecords() {
    const token = await getAccessToken();
    let allRecords = [], pageToken = "";
    do {
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100&page_token=${pageToken}`;
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        allRecords = allRecords.concat(data.data.items || []);
        pageToken = data.data.page_token;
    } while (pageToken);

    return allRecords.map(item => {
        const f = item.fields || {};
        const fv = k => {
            const v = f[k];
            if (v == null || v === "") return "";
            if (Array.isArray(v)) return v.map(x => x.name || x.text || x).join(", ");
            if (typeof v === "object" && v.text) return v.text;
            return String(v).trim();
        };
        return {
            模块: fv("模块"), 版本: fv("版本"), 版本备注: fv("版本备注"),
            状态: fv("状态"), 数据集: fv("数据集"), 指标名称: fv("指标名称"),
            当前值: fv("当前值"), AION基线值: fv("AION基线值"), 改进幅度: fv("改进幅度"),
            任务baseline: fv("任务baseline"), 下游任务: fv("下游任务"), 任务指标: fv("任务指标"),
            任务当前值: fv("任务当前值"), 任务baseline值: fv("任务baseline值"),
            遇到的问题: fv("遇到的问题"), 下一步计划: fv("下一步计划"),
            当前进展总结: fv("当前进展总结"), 阶段目标: fv("阶段目标"), 最终目标: fv("最终目标")
        };
    });
}

fetchRecords().then(rows => {
    fs.writeFileSync('data.json', JSON.stringify({ ok: true, rows }, null, 2));
    console.log("Fetch Complete.");
}).catch(err => { console.error(err); process.exit(1); });
