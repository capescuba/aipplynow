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
            dbProperties = await dbModule.getConfig();
            // Log non-sensitive properties
            console.log('Configuration loaded successfully');
            
            this.setProperty('CLIENT_ID', dbProperties.LinkedInClientId);
            this.setProperty('CLIENT_SECRET', dbProperties.LinkedInClientSecret);
            this.setProperty('JWT_PASSWORD', dbProperties.JwtPassword);
            this.setProperty('XAI_API_KEY', dbProperties.XaiApiKey);
            this.setProperty('AWS_ACCESS_KEY_ID', dbProperties.AwsAccessKeyId);
            this.setProperty('AWS_SECRET_ACCESS_KEY', dbProperties.AwsSecretAccessKey);
            this.setProperty('AWS_REGION', dbProperties.AwsRegion);
            this.setProperty('AWS_BUCKET_NAME', dbProperties.AwsBucketName);
        } catch (err) {
            console.error('Error loading configuration:', err);
        }
    }
}


// Freeze the instance to prevent modifications
const instance = new StartupProperties();

Object.freeze(instance);

module.exports = instance;
