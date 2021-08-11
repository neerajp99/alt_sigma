/** 
 * Using Gmail API for utilities around sending emails, extracting information et al.
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {google, oauth2_v1} = require('googleapis');
const { resolve } = require('path');


// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://mail.google.com/',
  'https://spreadsheets.google.com/feeds',
  'https://www.googleapis.com/auth/drive'
];
// The file tokens.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'tokens.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {string} token_path The path for the tokens.
 * @return {google.auth.OAuth2} oAuth2Client The new OAuth2 client to get token for.
 */
async function authorize(credentials, token_path) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, 
        client_secret, 
        redirect_uris[0]
    );
    // Check if we have previously stored a token.
    try {
      const token = fs.readFileSync(
        token_path || path.resolve(__dirname, TOKEN_PATH)
      );
      if (JSON.parse(token).expiry_date <= (new Date()).getTime()) {
        oAuth2Client.setCredentials(JSON.parse(token));
        
        const refresh_token = await oAuth2Client.refreshToken(
          oAuth2Client.credentials.refresh_token
        );

        if (refresh_token && refresh_token.tokens) {
          // Initialize new token as the available token only 
          const new_token = JSON.parse(fs.readFileSync(
            token_path || path.resolve(__dirname, TOKEN_PATH)
          ));
          
          // Check if access tokens are available in refresh token
          if (refresh_token.tokens.access_token) {
            new_token.access_token = refresh_token.tokens.access_token;
          }

          // Check if refresh tokens are available in refresh token
          if (refresh_token.tokens.refresh_token) {
            new_token.refresh_token = refresh_token.tokens.refresh_token
          }
          
          // Check if expiry date are available in refresh token
          if (refresh_token.tokens.expiry_date) {
            new_token.expiry_date = refresh_token.tokens.expiry_date;
          }

          // Write to the tokens.json file
          fs.writeFileSync(
            token_path || path.resolve(__dirname, TOKEN_PATH),
            JSON.stringify(new_token)
          )
          oAuth2Client.setCredentials(JSON.parse(token));
          return oAuth2Client;

        } else {
            // Throw Error
            throw new Error(
              `Refresh access token failed! Response is: ${JSON.stringify(
                refresh_token
              )}`
            );
        }
      } else {
        // Update and return the new OAuth2Client
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
      }
    } catch(error) {
      return await generate_new_token(oAuth2Client, token_path);
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {string} token_path The path for the tokens.
 * @return {Promise} Promise object, oAuth2Client The new OAuth2 client to get token for.
 */
async function generate_new_token(oAuth2Client, token_path) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          reject(error);
        } else {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later executions 
          fs.writeFileSync(
            token_path || path.resolve(__dirname, TOKEN_PATH),
            JSON.stringify(token)
          );
          resolve(oAuth2Client);
        }
      });
    });
  })
}

/**
 * List the labels in the users account
 * @param {google.auth.oAuth2} auth An authorized OAuth2 client.
 * @return {Array} labels Labels of an user.
 */
async function listLabels(auth) {
  const gmail = google.gmail({
    version: 'v1',
    auth 
  });
  try {
    const labels = await new Promise((resolve, reject) => {
      gmail.users.labels.list(
        {
          userId: "me"
        },
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            const labels = response.data.labels;
            // console.log('Labels', labels)
            resolve(labels);
          }
        }
      )
    })
    return labels;
  } catch (error) {
    console.log('API returned an error: ' + error);
    throw error;
  }
}

/**
 * Fetch the messages with a specific query 
 * @param {String} user_id User's email address. The special value "me"
 * can be used to indicate the authenticated user. 
 * @param {String} query String used to filter the messages listed 
 */
async function fetch_messages(oauth2Client, query, labelIds) {
  const gmail = google.gmail({
    version: 'v1', 
    oauth2Client
  });
  const messages = await new Promise((resolve, reject) => {

    gmail.users.messages.list(
      {
        userId: "me",
        q: query,
        auth: oauth2Client,
        labelIds: labelIds
      },
      async function(err, res) {
        if (err) {
          reject(err);
        } else {
          let result = res.data.messages || [];
          let { nextPageToken } = res.data;
          let count = 0
          while (nextPageToken) {
            // console.log('sahi hai xD')
            const resp = await new Promise((resolve, reject) => {
              gmail.users.messages.list(
                {
                  userId: "me",
                  q: query,
                  auth: oauth2Client,
                  labelIds: labelIds,
                  pageToken: nextPageToken
                },
                function(err, res) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(res);
                  }
                }
              );
            });
            result = result.concat(resp.data.messages);
            nextPageToken = resp.data.nextPageToken;
            count += 1
          }
          resolve(result);
        }
      }
    );
  });
  let result = messages || [];
  return result;
}

/**
 * Fetch the contents of the emails from the list of emails from fetch_messages 
 * @param {google.auth.oAuth2} oAuth2Client An authorized OAuth2 client.
 * @param {String} query String used to filter the messages listed 
 */
async function fetch_message_content(oAuth2Client, query = "") {
  try {
    const labels = await listLabels(oAuth2Client)
    const label_id = [labels.find(label => label.name === "INBOX").id]
    const gmail = google.gmail ({
      version: 'v1',
      oAuth2Client
    })
    const messages = await fetch_messages(
      oAuth2Client, 
      query,
      label_id
    )

    let promises = []
    if (messages.length > 0) {
      for (let message of messages) {
        promises.push(
          new Promise((resolve, reject) => {
            gmail.users.messages.get(
              {
                auth: oAuth2Client,
                userId: 'me',
                id: message.id,
                format: 'full'
              },
              (error, response) => {
                if (error) {
                  reject(error)
                } else {
                  resolve(response)
                }
              } 
            )
          })
        )
      }
      const results = await Promise.all(promises)
      return results.map(res => res.data)
    }
    else {
      return []
    }
    
  }
  catch(error) {
    console.log("Error while fetching email content: ", error)
    throw error
  }
}

/**
 * Method to automate the process of fetching unread email for a specific title
 * @returns {Array} A list of email messages
 */
async function automate_gmail() {
  const content = fs.readFileSync("credentials.json");
  const oAuth2Client = await authorize(JSON.parse(content), "tokens.json");
  const gmail_client = google.gmail({ version: "v1", oAuth2Client });
  listLabels(oAuth2Client);
  const final = await fetch_message_content(oAuth2Client, "is:unread subject:Enjoy")
  return final
}

module.exports = {
  authorize,
  automate_gmail
};


