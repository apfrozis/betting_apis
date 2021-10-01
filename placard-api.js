var request = require('request');
var cheerio = require('cheerio');

/*const placard = require('placard-api');

(async ()=>{
    const nextEvents = await placard.nextEvents();
    console.log(nextEvents['exportedProgrammeEntries'][1]['markets'][0]['outcomes'])
})();
*/
const url = 'https://www.hltv.org/matches'

request(url, function (error, response, body) {
var $ = cheerio.load(body);
debugger;
})