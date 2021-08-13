const { google, oauth2_v1 } = require('googleapis');
const { authorize, automate_gmail } = require('./gmail')
const fs = require('fs');
const { encrypt_text, decrypt_text } = require('./secure')
const { getSheetsData, writeToSheets, deleteFromSheets, updateStatus } = require('./recordSheets');
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

/*
 * Method to add a timeout delay
 */
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

/**
 * Method to mark email as read
 * @param {google.auth.oAuth2} auth An authorized OAuth2 client.
 * @param {*} messageID Message ID of the specific email
 */
const markEmailAsRead = async (messageID) => {
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
 * @param {String} encrypt_text Answer string submitted by a user
 * @returns Decrypted string for the encrypted text
 */
const decryptCode = async (encrypt_text) => {
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

/**
 * Method to add data to Google sheets
 * @param {String} email Email address of the user
 * @param {String} name Name of the user
 */
const saveToSheets = async (email, name) => {
    const content = fs.readFileSync("credentials.json");
    const token_path = 'tokens.json';
    const oAuth2Client = await authorize(JSON.parse(content), token_path);
    const sheetsContent = await getSheetsContent(oAuth2Client)  
    if (sheetsContent.length > 0) {
        const str_sheets = JSON.stringify(sheetsContent)
        if (str_sheets.includes(email)) {
            const message = "A user already requested access from this email address."
            const html = "<h2>A user already requested access from this email address.</h2>"
            // await sendEmail(message, html, email)
        } else {
            await encryptCode(email)
                .then(encrypted_text => {
                    const message = `Here is your security answer for the Facebook group: ${encrypted_text}`
                    const html = `<h2>Here is your security answer for the Facebook group: ${encrypted_text}</h2>`
                    const write = writeToSheets(oAuth2Client, email, name)
                    // await sendEmail(message, html, email)
                })
                .catch(error => {
                    console.log('Error')
                })
            
            
        }
    } else {
        await encryptCode(email)
                .then(encrypted_text => {
                    const message = `Here is your security answer for the Facebook group: ${encrypted_text}`
                    const html = `<h2>Here is your security answer for the Facebook group: ${encrypted_text}</h2>`
                    const write = writeToSheets(oAuth2Client, email, name)
                    // await sendEmail(message, html, email)
                })
                .catch(error => {
                    console.log('Error')
                })
    }
}

/**
 * Method to send an email
 * @param {String} message Email content of the email
 * @param {String} html Email html of the email
 * @param {String} toEmail Email address
 */
const sendEmail = async (message, html, toEmail) => {
    await send_email(message, html, toEmail)
}

/**
 * Method to delete specific rows from the Google sheets
 * @param {number} start Starting index of the rows
 * @param {number} end End index of the rows 
 */
const deleteRowFromSheets = async (start, end) => {
    const content = fs.readFileSync("credentials.json");
    const token_path = 'tokens.json';
    const oAuth2Client = await authorize(JSON.parse(content), token_path);
    await deleteFromSheets(oAuth2Client, start, end)
}

/**
 * Method to fetch the user's name and email address
 * @param {String} content String received from gmailProcess with mixed name and email address
 * @returns User's name and email address string array
 */
const getNameAndEmail = async(content) => {
    if (content.includes("<") || content.includes(">")) {
        let finalValues = []
        let temp = content.split("<")
        let name = temp[0]
        let email = temp[1]
        finalValues.push(name.slice(0, name.length - 1), email.slice(0, email.length - 1))
        return finalValues
    } 
    else if (!content.includes("<") || !content.includes(">")) {
        return ["", content]
    } else {
        return []
    }
}

/**
 * Helper method to update the specific row in the Sheets using email as the key
 * @param {String} email key to search and update a specific row
 */
const updateSheetRow = async(email) => {
    const content = fs.readFileSync("credentials.json");
    const token_path = 'tokens.json';
    const oAuth2Client = await authorize(JSON.parse(content), token_path);
    await updateStatus(oAuth2Client, email)
}

/**
 * Method to orchestrate the entire gmail workflow
 */
const gmailProcess = async() => {
    const final = await automate_gmail()
    for (let index = 0 ; index < final.length ; index++) {
        await delay(1000)
        let results = final[index]['payload']['headers'].filter(function (entry) { return entry.name === 'From' });
        let result = results[0]['value']
        const userCredentials = await getNameAndEmail(result)
        const messageID = final[index].id
        if (userCredentials.length > 0) {
            const name = userCredentials[0]
            const email = userCredentials[1]
            await saveToSheets(email, name)
            await markEmailAsRead(messageID)
        }  
    }
    return true
    // final.map((value, index) => {
    // })
    // let results = final[0]['payload']['headers'].filter(function (entry) { return entry.name === 'From'; });
    // console.log("FINAL", final[0]['payload']['headers'][final[0]['payload']['headers'].length - 3]['value']);
    // console.log('RESULTS', final.length)
}

module.exports = {
    markEmailAsRead,
    encryptCode,
    decryptCode,
    getSheetsContent,
    saveToSheets,
    deleteRowFromSheets,
    gmailProcess,
    updateSheetRow
}