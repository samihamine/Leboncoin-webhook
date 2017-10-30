var request = require('request');
var cheerio = require('cheerio');

var list_scraper = require('./src/list_scraper');
var ad_scraper   = require('./src/ad_scraper');
var constants    = require('./src/constants')

/*
 * Search ad from params and return a list of ads.
 */
const search = params => {

    return new Promise((resolve, reject)=>{

        list_scraper(params).then(
            result=>{ resolve( result ) } 
        );
    });
}

/*
 * Get ad data from an id.
 */
const getAd = id => {
    return ad_scraper( id );
}

module.exports = Object.assign({
    search,
    getAd
},constants);
