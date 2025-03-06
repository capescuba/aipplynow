class User {
  constructor(
    sub,
    email_verified,
    name,
    country,
    language,
    given_name,
    family_name,
    email,
    picture
  ) {
    this.sub = sub;
    this.email_verified = email_verified;
    this.name = name;
    this.locale = {
      country: country,
      language: language,
    };
    this.given_name = given_name;
    this.family_name = family_name;
    this.email = email;
    this.picture = picture;
  }

  // Static factory method to create an instance from a JSON object
  static fromJSON(json) {
   
    return new User(
      json.sub,
      json.email_verified,
      json.name,
      json.locale.country,
      json.locale.language,
      json.given_name,
      json.family_name,
      json.email,
      json.picture
    );
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

module.exports = User;
