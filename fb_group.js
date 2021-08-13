/* Automate Log In on Facebook using Puppeteer*/
const puppeteer = require('puppeteer');
const config = require('./config');
const { automate_gmail } = require('./gmail');
const { decryptCode, getSheetsContent, updateSheetRow } = require('./gmail_handler')
const fs = require('fs');
const { authorize } = require('./gmail')

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
 * @param {Object} page Instance of the browser 
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
 * Method to add a timeout delay
 */
async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

/**
 * Log into the user's Facebook account
 * @param {Object} page Instance of the browser 
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
    // Load the requests page of the group
    await page.goto('https://www.facebook.com/groups/455333082392289/requests');
    await delay(2000);
}

/**
 * Check whether the user is logged in or not 
 * @param {Object} page Instance of the browser
 * @returns {Boolean} bool A boolean value for the presence of the xpath
 */
async function check_login_status(page) { 
    try {
        await page.waitForXPath("//*[text()[contains(., 'Member Requests')]]", {
            visible: true,
            timeout: 1000 
        });
        return true;
    } catch (error) {
        console.log("Error: ", error);
        return false;
    }
}

/**
 * Method to scroll to the bottom of the page
 * @param {Object} page Instance of the browser 
 */
async function auto_scroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let height = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                height += distance;

                if (height >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        })
    });
}

/**
 * Method to fetch details of all requests
 * @param {Object} page Instance of the browser 
 * @returns {Array} all_requests List of all request objects
 */
async function get_requests(page, user_email, user_password) {
    // Check if the user is logged in
    if (await !check_login_status(page)) {
        await login(page, user_email, user_password);
    } 
    await page.waitForXPath("//div[@role = 'main']", {
        visible: true,
        timeout: 1000 
    })

    // Scroll to the bottom of the page to make sure all requests are fulfilled
    await auto_scroll(page);

    let all_requests = [];

    // Get the element which contains all the list
    let current_list = await page.$x("//div[@role = 'main']/div/div/div/div[4]/*");

    // Iterate over and append details of each request
    for (let elements of current_list) {
        let user_name = await elements.$x(".//a[@role='link']");
        if (user_name.length > 1) {
            user_name = user_name[1]
        }
        // let fb_link = await page.evaluate(el => el.getAttribute('href'), user_name)
        let user_name_text = await page.evaluate(el => el.textContent, user_name);
        // Get the approve request button 
        let [approve_button] = await elements.$x(".//span[text()[contains(., 'Approve')]]");
        // Get the Decline button 
        let [decline_button] = await elements.$x(".//span[text()[contains(., 'Decline')]]");
        
        let question 
        let answer

        // Check for empty answers by the user 
        try {
            let [questions] = await elements.$x(".//*[contains(text(), 'Are you smart?')]")
            question = await page.evaluate(el => el.innerText, questions);
            let [answer_targets]  = await questions.$x(("./following-sibling::*"))
            // const children = await page.evaluateHandle(e => e.children, answer_targets);
            // answer = await page.evaluate(el => el.innerText, answer_target);
            answer = await page.evaluate(el => el.innerText, answer_targets)
        } catch(error) {
            // If the field is empty, make the answer as null
            answer = null
            question = null
        }

        // Return an object of the details back to process 
        const result = {
            "name": user_name_text,
            "answer": answer,
            "approve_button": approve_button,
            "decline_button": decline_button, 
        }
        all_requests.push(result);
    }

    return all_requests;
}

/**
 * Helper method to handle all requests
 */
async function handle_requests(page, user_email, user_password) {
    // Check if the user is logged in 
    if (await !check_login_status(page)) {
        await login(page, user_email, user_password);
    } 
    // Fetch all the pending requests 
    const allRequest = await get_requests(page);
    return allRequest
}

/*
 * Script to manage the Facebook group join requests automatically 
 */
async function automate_fb() {
    const browser = await puppeteer.launch(config.launchOptions);
    const page = await browser.newPage();
    await page.setViewport({width: 1366, height: 768});
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    const content = fs.readFileSync("credentials.json");
    const user_content = fs.readFileSync("config.json");
    const {fb_email, fb_password} = JSON.parse(user_content).user_config;
    await login(page, fb_email, fb_password)
    try {
        // Handle the requests here 
        const requests = await handle_requests(page);
        const content = fs.readFileSync("credentials.json");
        const token_path = 'tokens.json';
        const oAuth2Client = await authorize(JSON.parse(content), token_path);
        const sheetsContent = await getSheetsContent(oAuth2Client)  
        for (let i = 0 ; i < requests.length ; i++) {
            const name = requests[i].name
            const answer = requests[i].answer || "efbff19c7e7711f607972b19fcd8e91573dc4d87df2c85251gb828c91d7d1217"
            const approve = requests[i].approve_button
            const decline = requests[i].decline_button
            const decryptedCode = await decryptCode(answer)
            const sheetsData = await getSheetsContent(oAuth2Client)
            if (sheetsData.some(data => data[0] === decryptedCode)) {
                if (parseInt(sheetsData.filter(arr => arr[0] === decryptedCode)[0][2]) === 0) {
                    // Approve the request and update the sheets 
                    await approve.evaluate((selector) => selector.click())
                    await updateSheetRow(decryptedCode)
                } else {
                    // Decline the request 
                    await decline.evaluate((selector) => selector.click())
                }
            } else {
                await decline.evaluate((selector) => selector.click())
            }
        }
        await browser.close();
        return true
    
    } catch (error) {
        return false
    }

    
}
module.exports = {
    automate_fb
}