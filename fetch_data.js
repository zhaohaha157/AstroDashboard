// fetch_data.js
const fs = require('fs');

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;
const APP_TOKEN = "CSazbwvezaQslWsSuTscwdwwnDf"; // 表格 Token (不敏感，可明文)
const TABLE_ID = "tbl5kuw0CNPXovfW";           // 表格 ID (不敏感)
const FEISHU = "https://open.feishu.cn/open-apis";

async function main() {
  try {
    // 1. 获取 Token
    const authRes = await fetch(`${FEISHU}/auth/v3/tenant_access_token/internal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    });
    const authData = await authRes.json();
    const token = authData.tenant_access_token;

    // 2. 拉取数据
    let records = [], pageToken = "";
    while (true) {
      const url = new URL(`${FEISHU}/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?page_size=100`);
      if (pageToken) url.searchParams.set("page_token", pageToken);
      const res = await fetch(url.toString(), { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      records = records.concat(data.data.items || []);
      if (!data.data.has_more) break;
      pageToken = data.data.page_token;
    }

    // 3. 整理并保存为静态 JSON
    const rows = records.map(item => {
        const f = item.fields || {};
        const fv = k => Array.isArray(f[k]) ? f[k].map(x=>x.name||x.text||x).join(", ") : (f[k]?.text || f[k] || "");
        return {
            模块: fv("模块"), 版本: fv("版本"), 状态: fv("状态"), 
            // ... (提取你需要的所有字段，参考之前的代码) ...
            当前进展总结: fv("当前进展总结"), 最终目标: fv("最终目标")
        };
    });

    fs.writeFileSync('data.json', JSON.stringify({ ok: true, rows }, null, 2));
    console.log("数据已成功保存到 data.json");

  } catch (error) {
    console.error("抓取失败:", error);
    process.exit(1);
  }
}

main();
