const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

/**
 * Fetched the data from Google sheets
 * @see https://docs.google.com/spreadsheets/d/1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
*/
async function getSheetsData(auth) {
  return new Promise((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: '1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg',
      range: 'Data!A2:E',
    }, 
    (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(err)
      }

      if (Object.keys(res.data).length > 2) {
        const rows = res.data.values;
        if (rows.length) {
          // rows.map((row) => {
          //   console.log(`${row[0]}, ${row[1]}`);
          // });
          resolve(rows)
        } else {
          console.log('No data found.');
          resolve([])
        }
      } else {
        resolve([])
      }
    });
})

}

/**
 * Writes to the Google Sheets from the server
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @return {boolean} bool Boolean value or error value
 */
async function writeToSheets(auth, email, name) {
  return new Promise((resolve, reject) => {
    const sheets = google.sheets({ version: 'v4', auth });
    let values = [
        [
            email,
            name
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
    }, (error, result) => {
        if (error) {
            console.log("Error", error);
            reject(error)
        } else {
            console.log('%d cells updated on range: %s', result.data.updates.updatedCells, result.data.updates.updatedRange);
            resolve(true)
        }
    });
  })
}

module.exports = {
  getSheetsData,
  writeToSheets
}
