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

/*
 * Script to manage the Facebook group join requests automatically 
 */
module.exports.automate_fb = () => {
    (async () => {
        const browser = await puppeteer.launch(config.launchOptions);
        const page = await browser.newPage();
        await page.setViewport({width: 1366, height: 768});
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
        await page.goto("https://www.facebook.com/login");
        /*
         * Login using email address and password 
         */
        await page.waitForXPath('//*[@id="loginbutton"]')
        await delay(2000);
        // Find Login fields and add the values to the login and password field
        await page.type('#email', 'test@gmail.com', {delay: 100});
        await page.type('#pass', 'test', {delay: 100});
        // Wait for 1 second before logging in 
        await delay(1000);
        // Click the login button
        await page.click("#loginbutton");
        console.log("Logged In!");
        // Wait for navigation 
        await page.waitForNavigation();
        // Take a screenshot for reference
        await page.screenshot({
            path: 'loggedIn-facebook.png'
        });
        delay(2000);
        // Close the browser
        await browser.close();
    })();
}