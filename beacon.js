const cron = require("node-cron")
/**
 * Cron job to run a check on new emails and requests at specific time interval. 
 */
cron.schedule('0 */10 * * * *', send_email());