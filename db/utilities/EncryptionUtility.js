const crypto = require("crypto");

const algorithm = "aes256"; // Encryption algorithm
const key = "password"; // Encryption key (should be stored securely in env variables)

class EncryptionUtility {
  static encrypt(text) {
    const cipher = crypto.createCipher(algorithm, key);
    return cipher.update(text, "utf8", "hex") + cipher.final("hex");
  }
}

module.exports = EncryptionUtility;
