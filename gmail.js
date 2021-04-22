/*
 * Using Gmail API for utilities around sending emails, extracting information et al.
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {google} = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
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
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
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

(async () => {
  const content = fs.readFileSync("credentials.json");
  const oAuth2Client = await authorize(JSON.parse(content), "tokens.json");
  const gmail_client = google.gmail({ version: "v1", oAuth2Client });
})();
