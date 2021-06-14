const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { authorize } = require("./gmail.js");
const content = fs.readFileSync("credentials.json");

/**
 * Fetched the data from Google sheets
 * @see https://docs.google.com/spreadsheets/d/1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
*/
async function getSheetsData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg',
    range: 'Data!A2:E',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      console.log('Request, Name:');
      rows.map((row) => {
        console.log(`${row[0]}, ${row[1]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
}

/**
 * Writes to the Google Sheets from the server
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @return {boolean} bool Boolean value or error value
 */
async function writeToSheets(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    let values = [
        [
            'Jason',
            'Waghawale'
        ],
    ];
    const resource = {
        values,
    };
    sheets.spreadsheets.values.append({
        spreadsheetId: '1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg',
        range: 'Data!A1',
        valueInputOption: 'RAW',
        resource: resource,
    }, (err, result) => {
        if (error) {
            console.log("Error", error);
            return error;
        } else {
            console.log('%d cells updated on range: %s', result.data.updates.updatedCells, result.data.updates.updatedRange);
            return true;
        }
    });
}

(async () => {
    const oAuth2Client = await authorize(JSON.parse(content), "tokens.json");
    await getSheetsData(oAuth2Client)
    await writeToSheets(oAuth2Client)
})();
