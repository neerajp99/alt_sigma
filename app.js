const config = require('./config');
const {automate_fb} = require('./fb_group')
const {automate_gmail} = require('./gmail')

async function fetchRequests() {
    const result = await automate_fb()
    console.log(result);
    return result
}

async function fetchEmails() {
    const emails = await automate_gmail()
    // console.log('EMAILS', emails)
    return emails
}

// fetchRequests()
//     .then(result => {
//     console.log('REEEE', result)
//     console.log('ACHSAAA')
//     })
//     .catch(error => {
//         console.log('Error', error)
//     })

fetchEmails()
    .then(result => {
        // console.log('CHECCCC', result)
        console.log('achsa')
    })
    .catch(err => {
        console.log('ERROR', err)
    })


