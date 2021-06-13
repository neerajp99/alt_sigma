const crypto = require('crypto');
const { isIPv6 } = require('net');
const fs = require('fs');
const content = fs.readFileSync("credentials.json");
const { random_bytes, key } = JSON.parse(content).installed;

/**
 * Method to get 16 bit random byte 
 * @return {string} hexString hexadecimal 16 bit random string
 */
async function getRandom() {
    crypto.randomBytes(16, (err, buf) => {
        console.log(buf.toString('hex'));
        const hexString = buf.toString('hex');
        return hexString;
    });
}

/**
 * Method to encrypt a string 
 * @param {string} value Plain text key 
 * @return {string} encrypted_key AES encrypted key
 */
async function encrypt_text(value) {
    try {
        let iv = Buffer.from(random_bytes, "hex");
        let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(value, 'utf-8', 'hex');
        encrypted += cipher.final('hex');
        console.log('encrypted', encrypted);
        return encrypted;
    }   
    catch(error) {
        console.log("Error: ", error);
        return error;
    }
}

/**
 * Method to decrypt a string 
 * @param {string} value Encrypted key string
 * @return {string} decrypted_key Decrypted plain key string
 */
async function decrypt_text(value) {
    try {
        let iv = Buffer.from(random_bytes, "hex");
        let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(value, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        console.log(decrypted)
        return decrypted;
    }
    catch (error) {
        console.log("Error: ", error);
        return error;
    }
}