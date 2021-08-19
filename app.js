const config = require('./config');
const { automate_fb } = require('./fb_group')
const { automate_gmail } = require('./gmail')
const { gmailProcess } = require('./gmail_handler')
const express = require('express')
const cron = require("node-cron")

const app = express()

async function fetchRequests() {
    const result = await automate_fb()
    return result
}

async function fetchEmails() {
    const emailStatus = gmailProcess()
    return emailStatus
}

cron.schedule('* */6 * * *', function() {
    console.log('Automating your facebook group and emails every 6 hours now...');
    fetchEmails()
    .then(result => {
        fetchRequests()
            .then(status => {
                console.log('Session done!!')
            })
            .catch(error => {
                console.log('Error: ', error)
            })
    })
    .catch(err => {
        console.log('ERROR', err)
    })
});

app.listen(3000)