/** 
 * Using Gmail API for sending emails
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const {google, oauth2_v1} = require('googleapis');
const { resolve } = require('path');
const nodemailer = require('nodemailer');
const { authorize } = require("./gmail.js");
let emailContent = fs.readFileSync("email.json")
emailContent = JSON.parse(emailContent)

/**
 * Send an email to the user with a specific message
 * @param {string} message Message string
 * @return {Object} emailData Sent email data
 */
async function send_email(message, html, toEmail) {
    try {
        const content = fs.readFileSync("credentials.json");
        const {client_secret, client_id, redirect_uris, refresh_token} = JSON.parse(content).installed;
        const token_path = 'tokens.json';
        const oAuth2Client = await authorize(JSON.parse(content), token_path);
        const token = JSON.parse(fs.readFileSync(token_path))
        oAuth2Client.setCredentials({
            refresh_token: token.refresh_token
        })
        const accessToken = await oAuth2Client.getAccessToken()
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: emailContent.from,
                clientId: client_id,
                clientSecret: client_secret,
                refreshToken: token.refresh_token,
                accessToken
            }
        })

        const mailOptions =  {
            from: emailContent.from,
            to: toEmail,
            subject: emailContent.subject,
            text: message,
            html: html,
        }

        const result = await transport.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log("Error: ", error)
        return error
    }
}

module.exports = {
    send_email
}