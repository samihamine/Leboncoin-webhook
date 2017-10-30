var request = require('request');
var cheerio = require('cheerio');

var ad_scraper = require('./ad_scraper');

const LEBONCOIN_URL  = 'https://www.leboncoin.fr';
const NB_AD_PER_PAGE = 35;

const generateURL = params => {
    
    let category = params.category ? `${params.category}/offres` : 'annonces';
    let location = params.location ? params.location : ''

    let page = 1;

    let url = `${LEBONCOIN_URL}/${category}/?location=${location}`;

    // Location parameters

    if( params.price_min ) 
        url += `&mrs=${params.price_min}`;

    if( params.price_max )
        url += `&mre=${params.price_max}`;

    if( params.type ){
        if( Array.isArray( params.type ) ){
            url += params.type.map( e=>`&ret=${e}` );
        }
        else
            url += `&ret=${params.type}`
    }

    let n_pages = 1;

    if( params.limit ){
        n_pages = Math.ceil( params.limit / NB_AD_PER_PAGE );
    }

    if( params.sellerType ){
        url += `&f=${params.sellerType}`
    }

    let urls = [];

    for( let i=1; i<=n_pages; i++ ){
        urls.push( url + '&o=' + i )
    }

    return urls;
}

/*
 *
 */
const extractPageData = html => {
    
    var $ = cheerio.load( html );
    var data = [];
    
    $('.list_item').each( (i,e)=>{

        let datainfo = JSON.parse( $(e).attr( 'data-info' ) );
        let id       = datainfo.ad_listid;
        let date     = new Date( $(e).find('[itemprop=availabilityStarts]').attr('content') );
        let title    = $(e).attr('title') || null;
        let price    = $(e).find('[itemprop=price]').attr('content') || null;
        let uri      = $(e).attr('href');
        let address_raw = [];
        
        $(e).find('[itemprop=address]').each( (i,e) => {
            address_raw.push( $(e).attr('content'));
        } )
        
        let image    = $(e).find('.lazyload').attr('data-imgsrc') || null;

        if( date ) data.push({
            id,
            uri,
            title,
            date,
            price:price?parseInt(price):null,
            location:{
                raw: address_raw.join(' ')
            },
            images: image?[image]:[]
        });
    });

    return data;
}

const pageRequestPromise = (uri, params) => {

    return new Promise( (resolve, reject) => {

        request( {uri, encoding: 'binary'} , ( error, response, html ) => {

            var data = extractPageData( html );

            if( params.details ){
                /*
                 * With details=true, with have to load each ad page to get mode data.
                 */

                let promises = data.map( e=>ad_scraper( e.id ) );

                Promise.all( promises ).then( detailedData => resolve( detailedData ));

            } else {

                resolve( data );
            }
        })
    });
}

/*
 *
 */
module.exports = params => {

    return new Promise( (resolve, reject) => {

        let urls = generateURL( params );

        let promises = urls.map( url => {
            return pageRequestPromise( url, params )
        });

        return Promise.all( promises ).then( result => {

            resolve( result.reduce( (a,b) => {return a.concat(b)} ).slice(0,params.limit) )
        });
    });
}
