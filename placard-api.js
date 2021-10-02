var request = require('request');
var cheerio = require('cheerio');

/*const placard = require('placard-api');

(async ()=>{
    const nextEvents = await placard.nextEvents();
    console.log(nextEvents['exportedProgrammeEntries'][1]['markets'][0]['outcomes'])
})();
*/
const url = 'https://www.hltv.org'

const matches_url = '/matches'

bet_websites_classes = ['gprov_gv4nx914', 'gprov_3etkx6rj', 'gprov_nz6cnayl',
'gprov_egb', 'gprov_p2g0jzml', 'gprov_5i4rhap1',
'gprov_pinnacle', 'gprov_buff88', 'gprov_parimatch',
'gprov_uazy6czn', 'gprov_vulkan', 'gprov_midnite',
'gprov_csgoempire', 'gprov_mobiusbet', 'gprov_vz0pxwkq',
'gprov_comeon', 'gprov_n1bet', 'gprov_22bet',
'gprov_bet20', 'gprov_cyberbet', 'gprov_bitcasino']

visitPage(url + matches_url, function (body) {
    var $ = cheerio.load(body);
    let matches = $('.match.a-reset')
    debugger;
    //for (var j = 0; j < matches.length; j++) {
        let link_for_next_request = matches[0]['attribs']['href']
        visitPage(url + link_for_next_request, function (body) {
            var $ = cheerio.load(body);
            for (var bet_class_index = 0; bet_class_index < bet_websites_classes.length; bet_class_index++) {
                let odd = $('.' + bet_websites_classes[bet_class_index] + '.provider')
                stat[0].children[3].children[0].children[0].data
                stat[0].children[7].children[0].children[0].data
            }

            debugger;
        })
    //}
})




function visitPage(url, callback) {
    // Make the request
    console.log("Visiting page " + url);
    request(url, function (error, response, body) {
         callback(body)
    });
}