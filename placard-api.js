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

const month_mapping = {january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10,
    november: 11, december: 12}

var con = mysql.createConnection({
    host: "eu-cdbr-west-01.cleardb.com",
    user: "bfa556a9934796",
    password: "da9d7209",
    database: "heroku_98a5fdc87d62a3c"
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

visitPage(url + matches_url, async function (body) {
    var $ = cheerio.load(body);
    let matches = $('.match.a-reset')
    for (var j = 0; j < matches.length; j++) {
        await delay(4000)
        let link_for_next_request = matches[j]['attribs']['href']
        visitPage(url + link_for_next_request, function (body) {
            var $ = cheerio.load(body);
            let first_team_name = $('.team-cell')[0].children[0].data
            let second_team_name = $('.team-cell')[2].children[0].data
            let game_date = $('.date')[0].children[0].data
            let biggest_first_odd_and_provider = {biggest_odd: 0, provider: ''}
            let biggest_second_odd_and_provider = {biggest_odd: 0, provider: ''}
            let cs_game = {first_team_name: first_team_name, second_team_name: second_team_name, cs_odds_list: [], game_date: game_date}
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
                    biggest_first_odd_and_provider['provider'] = bet_websites_classes[bet_class_index]['name']
                }
                if (second_odd > biggest_second_odd_and_provider['biggest_odd']) {
                    biggest_second_odd_and_provider['biggest_odd'] = second_odd
                    biggest_second_odd_and_provider['provider'] = bet_websites_classes[bet_class_index]['name']
                }
                cs_game['cs_odds_list'].push({provider: bet_websites_classes[bet_class_index]['name'], first_odd: first_odd, second_odd: second_odd})
            }
            let arbitrage_betting = calculate_arbitrage_betting(biggest_first_odd_and_provider, biggest_second_odd_and_provider)
            cs_game = Object.assign({}, cs_game, arbitrage_betting)
            save_to_database(cs_game)
        })
    }
    //con.end()
})

function calculate_arbitrage_betting(biggest_first_odd_and_provider, biggest_second_odd_and_provider) {
    let first_betting_percentage = 1 / biggest_first_odd_and_provider['biggest_odd'] * 100
    let second_betting_percentage = 1 / biggest_second_odd_and_provider['biggest_odd'] * 100
    let percentage = (first_betting_percentage + second_betting_percentage)
    if(percentage < 98) {
        let amount_to_bet_first = (AMOUNT_AVAILABLE * first_betting_percentage) / percentage
        let amount_to_bet_second = (AMOUNT_AVAILABLE * second_betting_percentage) / percentage

        let profit_first = (amount_to_bet_first * biggest_first_odd_and_provider['biggest_odd']) - amount_to_bet_second - amount_to_bet_first
        let profit_second = (amount_to_bet_second * biggest_second_odd_and_provider['biggest_odd']) - amount_to_bet_first - amount_to_bet_second
        return { eligible_for_betting: true, amount_to_bet_first: amount_to_bet_first, amount_to_bet_second: amount_to_bet_second,
            profit_first: profit_first, profit_second, profit_second, biggest_first_odd: biggest_first_odd_and_provider['biggest_odd'],
            biggest_second_odd: biggest_second_odd_and_provider['biggest_odd'], biggest_first_provider: biggest_first_odd_and_provider['provider'],
            biggest_second_provider: biggest_second_odd_and_provider['provider'] }
    }
    return {eligible_for_betting: false}
}


function visitPage(url, callback) {
    // Make the request
    console.log("Visiting page " + url);
    request(url, function (error, response, body) {
         callback(body)
    });
}

function save_to_database(cs_game) {
    var sql = build_insert_string(cs_game);
    console.log("Query:" + sql);
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });
}

function build_insert_string(cs_game) {
    return "INSERT INTO arbitrage_betting_games (team1_name, team2_name, biggest_odd_1, " +
        "biggest_odd_2, biggest_provider_1, biggest_provider_2, eligible_for_betting, amount_to_bet_1, amount_to_bet_2, " +
        "profit_1_wins, profit_2_wins, game_date) VALUES ('" + cs_game['first_team_name'] + "', '" + cs_game['second_team_name'] + "', "
        + (cs_game['biggest_first_odd'] || null) + ", " + (cs_game['biggest_second_odd'] || null) + ", '" + (cs_game['biggest_first_provider'] || null)
        + "', '" + (cs_game['biggest_second_provider'] || null) + "', " + (cs_game['eligible_for_betting'] || null) + ", "
        + (cs_game['amount_to_bet_first'] || null) + ", " + (cs_game['amount_to_bet_second'] || null) + ", " + (cs_game['profit_first'] || null) + ", "
        + (cs_game['profit_second'] || null) + ", '" + (sanitize_date(cs_game['game_date']).toString() || null) + "')"
}

function sanitize_date(date) {
    let day = date.split('th')[0]
    let month = month_mapping[date.split('of ')[1].split(' ')[0].toLowerCase()]
    let year = date.split(' ')[3]
    return year + "/" + month + "/" + day
}