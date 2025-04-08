function setSessionStorageWithTimeout(key, value, timeout) {
    const now = new Date().getTime();
    const item = {
        value: value,
        expiry: now + timeout,
    };
    sessionStorage.setItem(key, JSON.stringify(item));
}

function getSessionStorageWithTimeout(key) {
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    if (now > item.expiry) {
        sessionStorage.removeItem(key);
        return null;
    }
    return item.value;
}

// Function to get the value of a specific cookie by name
function getCookie(name) {
    alert("getCookie document.cookie = " + document.cookie);
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

module.exports = {
    setSessionStorageWithTimeout,
    getSessionStorageWithTimeout,
    getCookie
};
