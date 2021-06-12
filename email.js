/** 
 * Using Gmail API for sending emails
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {google, oauth2_v1} = require('googleapis');
const { resolve } = require('path');
const nodemailer = require('nodemailer');
const {authorize} = require("./gmail.js");

/**
 * Send an email to the user with a specific message
 * @param {string} message Message string
 * @return {Object} emailData Sent email data
 */
async function send_email(message) {
    try {
        const content = fs.readFileSync("credentials.json");
        const {client_secret, client_id, redirect_uris, refresh_token} = JSON.parse(content).installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, 
            client_secret, 
            redirect_uris[0]
        );
        oAuth2Client.setCredentials({refresh_token: refresh_token})
        const accessToken = await oAuth2Client.getAccessToken()
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'SENDER EMAIL ADDRESS',
                clientId: client_id,
                clientSecret: client_secret,
                refreshToken: refresh_token,
                accessToken
            }
        })

        const mailOptions =  {
            from: "SENDER EMAIL ADDRESS",
            to: "RECEIVER EMAIL ADDRESS",
            subject: "SUBJECT",
            text: "Hello from the other side!s",
            html: "<h1>Hello from the other side </h1>",
        }

        const result = await transport.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log("Error: ", error)
        return error
    }
}
send_email()
    .then(result => console.log("Email Sent", result))
    .catch(error => {
        console.log('Error', error)
    })