const dbModule = require('../db/db.js');
let dbProperties = "";

class StartupProperties {
    constructor() {
        if (!StartupProperties.instance) {
            this.properties = {};
            StartupProperties.instance = this;
        }

        return StartupProperties.instance;
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key];
    }

    async init() {
        // Fetch data from the database
        try {
            dbProperties = await dbModule.getTableData('config');
            console.log(dbProperties);
            this.setProperty('CLIENT_ID', dbProperties[0].LinkedInClientId);
            this.setProperty('CLIENT_SECRET', dbProperties[0].LinkedInClientSecret);
            this.setProperty('JWT_PASSWORD', dbProperties[0].JwtPassword);
        } catch (err) {
            console.error(err);
        }
    }
}


// Freeze the instance to prevent modifications
const instance = new StartupProperties();

Object.freeze(instance);

module.exports = instance;
