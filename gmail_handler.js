const { google, oauth2_v1 } = require('googleapis');
const { authorize } = require('./gmail')
const fs = require('fs');
const { encrypt_text, decrypt_text } = require('./secure')
const { getSheetsData, writeToSheets } = require('./recordSheets');
const { sheets } = require('googleapis/build/src/apis/sheets');
const { send_email } = require('./email')

/**
 * Helper method to mark email as read
 * @param {google.auth.oAuth2} auth An authorized OAuth2 client.
 * @param {String} messageID Message ID of the specific email
 * @param {Array} addLabelsID To add 
 * @param {Array} removeLabelsID To remove the label
 * @returns 
 */
const EmailReadHelper = async (auth, messageID, removeLabelsID) => { 
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({
            version: 'v1',
            auth 
        });
        gmail.users.messages.modify(
            {
                id: messageID,
                userId: 'me',
                resource: {
                    'addLabelIds': [],
                    'removeLabelIds': removeLabelsID,
                },
            },
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(res);
                return;
            }
        );
    });
};

/**
 * 
 * @param {google.auth.oAuth2} auth An authorized OAuth2 client.
 * @param {*} messageID Message ID of the specific email
 */
const markEmailAsRead = async (auth, messageID) => {
    const content = fs.readFileSync("credentials.json");
    const token_path = 'tokens.json';
    const oAuth2Client = await authorize(JSON.parse(content), token_path);
    await EmailReadHelper(oAuth2Client, messageID, ['UNREAD'])
}

/**
 * Method to encrypt the email using AES-256-CBC
 * @param {String} email Requested user's email address
 * @returns Encrypted string for the email address
 */
const encryptCode = async (email) => {
    const encrypted_email = await encrypt_text(email)
    return encrypted_email
}

/**
 * 
 * @param {String} encrypted_string Answer string submitted by a user
 * @returns Decrypted string for the encrypted text
 */
const decryptCode = async (encrypted_string) => {
    const decrypted_email = await decrypt_text(encrypt_text)
    return decrypted_email
}

/**
 * Method to fetch Google sheets content
 * @param {google.auth.OAuth2} oAuth2Client The authenticated Google OAuth client.
 * @returns Array containing the content from Google sheets
 */
const getSheetsContent = async (oAuth2Client) => {
    const sheetsContent = await getSheetsData(oAuth2Client)
    return sheetsContent
}

const saveToSheets = async (email, name) => {
    const content = fs.readFileSync("credentials.json");
    const token_path = 'tokens.json';
    const oAuth2Client = await authorize(JSON.parse(content), token_path);
    const sheetsContent = await getSheetsContent(oAuth2Client)  
    if (sheetsContent.length > 0) {
        const str_sheets = JSON.stringify(sheetsContent)
        if (str_sheets.includes(email)) {
            console.log('Already there') // Send email for the same, duplicate entry
        } else {
            await writeToSheets(oAuth2Client, email, name)
        }
    } else {
        await writeToSheets(oAuth2Client, email, name)
    }
}

/**
 * Method to send an email
 */
const sendEmail = async () => {
    await send_email("aa", 'email@mail.com')
}

/**
 * Method to initialize the scheduling jobs 
 */
