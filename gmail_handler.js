const {google, oauth2_v1} = require('googleapis');
/**
 * Helper method to mark email as read
 * @param {google.auth.oAuth2} auth An authorized OAuth2 client.
 * @param {String} messageID Message ID of the specific email
 * @param {Array} addLabelsID To add 
 * @param {Array} removeLabelsID To remove the label
 * @returns 
 */
const EmailReadHelper = async (auth, messageID, addLabelsID, removeLabelsID) => { 
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({
            version: 'v1',
            auth 
        });
        gmail.users.messages.modify(
            {
                id: messageID,
                userID: 'me',
                resource: {
                    'addLabelsIds': addLabelsID,
                    'removeLabelsIds': removeLabelsID,
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
    await EmailReadHelper(auth, messageID, [], ['UNREAD'])
}

/**
 * Method to encrypt the email using AES-256-CBC
 */

/**
 * Method to send an email
 */

/**
 * Method to initialize the scheduling jobs 
 */