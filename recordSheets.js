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
    const sheets = google.sheets({
      version: 'v4', 
      auth
    });
    sheets.spreadsheets.values.get({
      spreadsheetId: '1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg',
      range: 'Data',
    }, 
    (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(err)
      }
      // console.log('RESPONSE', res)
      if (Object.keys(res.data).length > 2) {
        const rows = res.data.values;
        if (rows.length) {
          // rows.map((row) => {
          //   console.log(`${row[0]}, ${row[1]}`);
          // });
          // console.log('Data', res)
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
    const sheets = google.sheets({ 
      version: 'v4',
      auth 
    });
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
        range: 'Data',
        valueInputOption: 'RAW',
        resource: resource,
    }, (error, result) => {
        if (error) {
            console.log("Error", error);
            reject(error)
        } else {
            // console.log('EMAIL', email)
            console.log('%d cells updated on range: %s', result.data.updates.updatedCells, result.data.updates.updatedRange);
            resolve(true)
        }
    });
  })
}

/**
 * 
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for
 * @param {number} start Starting index of the rows
 * @param {number} end End Index of the rows
 * @returns {Object} Response object for successful process, else error
 */
async function deleteFromSheets(auth, start, end) {
  return new Promise ((resolve, reject) => {
    const sheets = google.sheets({
      version: 'v4',
      auth
    })
    sheets.spreadsheets.batchUpdate({
      spreadsheetId: '1B8upVnuawfWfcqgFlTIhkYv7yDpJw3IT2xRUs1i9zYg',
      resource: {
        "requests": [
          {
            "deleteDimension": {
              "range": {
                "dimension": "ROWS",
                "startIndex": start,
                "endIndex": end
              }
            }
          }
        ]
      }
    }, (error, result) => {
      if (error) {
        console.log('Error', error)
        reject(error)
      } else {
        console.log('Row (s) deleted successfully!')
        resolve(result)
      }
    })
  })
}


module.exports = {
  getSheetsData,
  writeToSheets,
  deleteFromSheets
}
