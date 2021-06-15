const cron = require("node-cron")
const {send_email} = require("./email")
/**
 * Cron job to run a check on new emails and requests at specific time interval. 
 */
cron.schedule('0 */10 * * * *', send_email());