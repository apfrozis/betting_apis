var request = require('request');
var cheerio = require('cheerio');
var mysql = require('mysql');

/*const placard = require('placard-api');

(async ()=>{
    const nextEvents = await placard.nextEvents();
    console.log(nextEvents['exportedProgrammeEntries'][1]['markets'][0]['outcomes'])
})();
*/
const url = 'https://www.hltv.org'

const AMOUNT_AVAILABLE = 100

const matches_url = '/matches'

const bet_websites_classes = [{name: 'ggbet', class: 'gprov_gv4nx914'}, {name: 'bet365', class: 'gprov_3etkx6rj'}, {name: 'lootbet', class: 'gprov_nz6cnayl'},
{name: 'egb', class: 'gprov_egb'}, {name: 'thunderpick', class: 'gprov_thunderpick'}, {name: 'betway', class: 'gprov_p2g0jzml'}, {name: '1xbet', class: 'gprov_5i4rhap1'},
{name: 'pinnacle', class: 'gprov_pinnacle'}, {name: 'buffbet', class: 'gprov_buff88'}, {name: 'parimatch', class: 'gprov_parimatch'},
{name: 'betwinner', class: 'gprov_uazy6czn'}, {name: 'vulkan', class: 'gprov_vulkan'}, {name: 'midnite', class: 'gprov_midnite'},
{name: 'csgoempire', class: 'gprov_csgoempire'}, {name: 'mobius', class: 'gprov_mobiusbet'}, {name: 'unibet', class: 'gprov_vz0pxwkq'},
{name: 'comeon', class: 'gprov_comeon'}, {name: 'n1 bet', class: 'gprov_n1bet'}, {name: '22 bet', class: 'gprov_22bet'},
{name: 'bet20', class: 'gprov_bet20'}, {name: 'cyberbet', class: 'gprov_cyberbet'}, {name: 'bitcasino', class: 'gprov_bitcasino'}]

var con = mysql.createConnection({
    host: "eu-cdbr-west-01.cleardb.com",
    user: "bfa556a9934796",
    password: "da9d7209",
    database: "heroku_98a5fdc87d62a3c"
  });

visitPage(url + matches_url, async function (body) {
    var $ = cheerio.load(body);
    let matches = $('.match.a-reset')
    //for (var j = 0; j < matches.length; j++) {
        await delay(5000)
        let link_for_next_request = matches[0]['attribs']['href']
        visitPage(url + link_for_next_request, function (body) {
            var $ = cheerio.load(body);
            let first_team_name = $('.team-cell')[0].children[0].data
            let second_team_name = $('.team-cell')[2].children[0].data
            let biggest_first_odd_and_provider = {biggest_odd: 0, provider: ''}
            let biggest_second_odd_and_provider = {biggest_odd: 0, provider: ''}
            let cs_game = {first_team_name: first_team_name, second_team_name: second_team_name, cs_odds_list: []}
            for (var bet_class_index = 0; bet_class_index < bet_websites_classes.length; bet_class_index++) {
                let odd_div = $('.' + bet_websites_classes[bet_class_index]['class'] + '.provider')
                let first_odd = 0
                let second_odd = 0
                try {
                    first_odd = odd_div[0].children[3].children[0].children[0].data
                    second_odd = odd_div[0].children[7].children[0].children[0].data
                } catch {
                    first_odd = 0
                    second_odd = 0
                }
                if (first_odd > biggest_first_odd_and_provider['biggest_odd']) {
                    biggest_first_odd_and_provider['biggest_odd'] = first_odd
                    biggest_first_odd_and_provider['provider'] = bet_websites_classes[bet_class_index]['class']
                }
                if (second_odd > biggest_second_odd_and_provider['biggest_odd']) {
                    biggest_second_odd_and_provider['biggest_odd'] = second_odd
                    biggest_second_odd_and_provider['provider'] = bet_websites_classes[bet_class_index]['class']
                }
                cs_game['cs_odds_list'].push({provider: bet_websites_classes[bet_class_index]['name'], first_odd: first_odd, second_odd: second_odd})
            }
            let arbitrage_betting = calculate_arbitrage_betting(biggest_first_odd_and_provider, biggest_second_odd_and_provider)
            cs_game = Object.assign({}, cs_game, arbitrage_betting)
            save_to_database(cs_game)
            debugger;
        })
    //}
})

function save_to_database(cs_game) {
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        console.log(cs_game);
        var sql = "INSERT INTO customers (name, address) VALUES ('Company Inc', 'Highway 37')";
        con.query(sql, function (err, result) {
          if (err) throw err;
          console.log("1 record inserted");
        });
      });
}

function calculate_arbitrage_betting(biggest_first_odd_and_provider, biggest_second_odd_and_provider) {
    let first_betting_percentage = 1 / biggest_first_odd_and_provider['biggest_odd'] * 100
    let second_betting_percentage = 1 / biggest_second_odd_and_provider['biggest_odd'] * 100
    let percentage = (first_betting_percentage + second_betting_percentage)
    debugger;
    if(percentage < 98) {
        let amount_to_bet_first = (AMOUNT_AVAILABLE * first_betting_percentage) / percentage
        let amount_to_bet_second = (AMOUNT_AVAILABLE * second_betting_percentage) / percentage

        let profit_first = (amount_to_bet_first * biggest_first_odd_and_provider['biggest_odd']) - amount_to_bet_second - amount_to_bet_first
        let profit_second = (amount_to_bet_second * biggest_second_odd_and_provider['biggest_odd']) - amount_to_bet_first - amount_to_bet_second
        debugger;
        return true
    }
    return false
}


function visitPage(url, callback) {
    // Make the request
    console.log("Visiting page " + url);
    request(url, function (error, response, body) {
         callback(body)
    });
}