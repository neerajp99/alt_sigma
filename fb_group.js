/* Automate Log In on Facebook using Puppeteer*/
const puppeteer = require('puppeteer');
const config = require('./config');

/*
 * Method to add a timeout delay
 */
function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

/**
 * Log into the user's Facebook account
 * @param {Object} page Intance of the browser 
 * @param {String} user_email User's email address
 * @param {String} user_password User's password
 */
async function login(page, user_email, user_password) {
    await page.goto("https://www.facebook.com/login");
    // Login using email address and password 
    await page.waitForXPath('//*[@id="loginbutton"]')
    await delay(2000);
    // Find Login fields and add the values to the login and password field
    await page.type('#email', user_email, {delay: 100});
    await page.type('#pass', user_password, {delay: 100});
    // Wait for 1 second before logging in 
    await delay(1000);
    // Click the login button
    await page.click("#loginbutton");
    console.log("Logged In!");
    // Wait for navigation 
    await page.waitForNavigation();
    // Take a screenshot for reference
    await page.screenshot({
        path: 'loggedInnn-facebook.png'
    });
    delay(2000);
}

/**
 * Check whether the user is logged in or not 
 * @param {Object} page Intance of the browser
 * @returns {Boolean} bool A boolean value for the presence of the xpath
 */
async function check_login_status(page) {
    try {
        await page.waitForXPath(
            "//*[text()[contains(., 'Manage group')]]", { 
                visible: true, 
                timeout: 1000 
            });
        return true;
    } catch (error) {
        console.log("Error: ", error);
        return false;
    }
    
}
/*
 * Script to manage the Facebook group join requests automatically 
 */
module.exports.automate_fb = () => {
    (async () => {
        const browser = await puppeteer.launch(config.launchOptions);
        const page = await browser.newPage();
        await page.setViewport({width: 1366, height: 768});
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
 
        // Close the browser
        // const login_status = await check_login_status(page);
        // await browser.close();
        console.log(typeof(page))
    })();
}