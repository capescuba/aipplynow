const dbModule = require('./db/db');
let properties = "";

async function fetchData() {
    try {
        properties = await dbModule.getTableData('config');
        console.log(properties);
    } catch (err) {
        console.error(err);
    }
}

fetchData();


module.exports = {
    properties
}
