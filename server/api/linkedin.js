// linkedinApi.js
const CONFIG = require('../config/startup_properties');
const axios = require('axios');
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';
//const REDIRECT_URI = 'http://localhost:3000/';

async function getAccessToken(code) {
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            client_id: CONFIG.properties.CLIENT_ID,
            client_secret: CONFIG.properties.CLIENT_SECRET
        }
    });

    return tokenResponse.data.access_token;
}

async function getUserInfo(accessToken) {
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return userInfoResponse.data;
}

module.exports = {
    getAccessToken,
    getUserInfo,
    REDIRECT_URI};
