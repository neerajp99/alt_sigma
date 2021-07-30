const config = require('./config');
const {automate_fb} = require('./fb_group')

async function fetchRequests() {
    const result = await automate_fb()
    console.log(result);
    return result
}
fetchRequests()
    .then(result => {
    console.log('REEEE', result)
    console.log('ACHSAAA')
    })
    .catch(error => {
        console.log('Error', error)
    })


