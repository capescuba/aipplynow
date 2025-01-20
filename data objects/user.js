class User {
    constructor(sub, email_verified, name, country, language, given_name, family_name, email, picture) {
        this.sub = sub;
        this.email_verified = email_verified;
        this.name = name;
        this.locale = {
            country: country,
            language: language
        };
        this.given_name = given_name;
        this.family_name = family_name;
        this.email = email;
        this.picture = picture;
    }

    // Method to display user information
    displayInfo() {
        console.log(`Name: ${this.given_name} ${this.family_name}`);
        console.log(`Email: ${this.email}`);
        console.log(`Email Verified: ${this.email_verified}`);
        console.log(`Locale: ${this.locale.country}, ${this.locale.language}`);
        console.log(`Profile Picture URL: ${this.picture}`);
    }
}

// Example JSON data
const jsonString = '{"sub":"r1HzBDo6TL","email_verified":true,"name":"Dave Britton ","locale":{"country":"US","language":"en"},"given_name":"Dave","family_name":"Britton ","email":"d_britton@hotmail.com","picture":"https://media.licdn.com/dms/image/v2/D5603AQEZh65np94tmg/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1727283432656?e=1742428800&v=beta&t=9_3X7lPjm4md-ERd-6QQLc2XBsBdVJGx0AWsT17RyKs"}';

// Parse JSON string into an object
const userData = JSON.parse(jsonString);

// Create a new User instance
const user = new User(
    userData.sub,
    userData.email_verified,
    userData.name,
    userData.locale.country,
    userData.locale.language,
    userData.given_name,
    userData.family_name,
    userData.email,
    userData.picture
);

// Display user information
user.displayInfo();
