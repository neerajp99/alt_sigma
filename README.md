## AltSigma - Automated Email and Facebook Group Request Handling


### Background 
It's really hard to handle Facebook group requests when there are tons of request and most of them are there to spam your group or there is a need to accept only people from some specific organisation. This could be achieved using AltSigma which will automate the process of verifying users on its own. This will reduce the manual workload of cross checking every single request again and again.  


### Philosophy
The user is required to send an email to a specific email address using a specific Email subject. AltSigma will automatically check for the user email, encrypt it and send the encrypted text as the answer to the Facebook Group question back to the email address. It will also store and update the google sheets to keep a track of users accepted and prevent user from sending multiple emails again and again. 

## How it works?

Let Bob be the automated system moderator for the Facebook group.

1. Alice wants to join the Facebook group. 
2. Alice sends an email to Bob using her email address with a specific subject.
3. Bob then verifies the email address presence on the Google sheet, and sends an encrypted answer accordingly back to Alice's email address. If the email address is already present in the Google sheet, it rejects the request and sends a respective email stating the same back to Alice. 
4. Alice then copies the encrypted text and paste it as an answer on the Facebook group request question. 
5. Bob decryts the answer and confirms from Google sheet whether Alice is trying to join for the first time and approve her request accordingly and updates the Google Sheet. If not, Bob will reject her Facebook group join request respectively. 

### Getting Started 
The user has to create/update two files according to its credentials. 

> credentials.json  (sample configuration)
```js
	{
    "installed": {
        "client_id":"", // Gmail API client id
        "project_id":"", // Project ID on Google Cloud 
        "auth_uri":"", // Auth URI
        "token_uri":"", // Token URI
        "auth_provider_x509_cert_url":"",
        "client_secret":"", // Gmail API client secret
        "redirect_uris":[""], // Redirect URI
        "refresh_token": "", // Google OAuth refresh tokens
        "random_bytes": "", // Random 16 byte string for AES256
        "key": "" // Random key for AES256
    }
}
```

> config.json
```js
	{
    "user_config": {
        "fb_email": "fb_email", // User's facebook email address
        "fb_password": "fb_password", // Users facebook account password
        "search_query": "This is it!", // Email Subject to search for
        "fb_group_request": "Link to the Facebook group's requests page" // Link to the Faccebook group's requests
    }
}
```

Following the above steps, 
> ``` npm install```
> ``` node app.js ```