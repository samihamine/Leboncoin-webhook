var request          = require('request');
var cheerio          = require('cheerio');
var removeDiacritics = require('diacritics').remove;
var removeAccents    = require('remove-accents');

const LEBONCOIN_URL = 'https://www.leboncoin.fr';

const ignore_properties = [
    'reference',
    'loyermensuel'
];

/*
 * Somewhere in the page, there is an interesting variable called utag_data.
 * We eval here this variable.
 */
const eval_utag_data = $ => {

    var text = $('script')[9].children;

    let data_script = text[0].data
        .replace('getDevice()','0')
        .replace('getDisplay($(window).innerWidth())','0')
        .replace("window.abp ? 'true' : 'false'", "true")

    eval( data_script );

    // Delete useless attributes.
    delete utag_data.environnement;
    delete utag_data.device;
    delete utag_data.displaytype;
    delete utag_data.pagename;
    delete utag_data.compte;
    delete utag_data.uab;
    delete utag_data.cat_id;
    delete utag_data.subcat_id;
    delete utag_data.options;
    delete utag_data.photosup;
    delete utag_data.pagetype;
    delete utag_data.eventname;

    return utag_data;
}

/*
 * TODO : only extract one image :/
 */
const extract_item_images = $ => {

    let images = [];

    $('.item_image').each( (i,e)=>{

        images.push($(e).attr('data-popin-content'))
    });

    return images;
}

/*
 *
 */
const extract_properties = $ => {

    let properties = {};

    $('.properties .line').each( (i,e)=>{

        let property = removeDiacritics(removeAccents( $(e).find('.property').text().trim()) )
            .toLowerCase()
            .replace(/[^a-z_]/g,'');
        
        let value = $(e).find('.value').text().trim();

        if(
            property!='' &&
            !ignore_properties.includes( property )
        )
            properties[property] = value;

        if( properties['pieces'] )
            properties['pieces'] = parseInt( properties['pieces'] );
        if( properties['ges'] )
            properties['ges'] = properties['ges'].split(' ')[0];
        if( properties['classeenergie'] )
            properties['classeenergie'] = properties['classeenergie'].split(' ')[0];
        if( properties['surface'] )
            properties['surface'] = parseInt( properties['surface'] )
        if( properties['typedebien'] )
            properties['typedebien'] = properties['typedebien'].toLowerCase()
        if( properties['meublenonmeuble'] ){
            properties['meuble'] = properties['meublenonmeuble'] != "Non meublé"
            delete properties['meublenonmeuble'];
        }
    });

    return properties;
}

/*
 *
 */
module.exports = id => {

    return new Promise( (resolve, reject) => {

        let uri = `${LEBONCOIN_URL}/annonces/${id}.htm`;

        request( {uri, encoding: 'binary'}, ( error, response, html ) => {

            var $ = cheerio.load( html );
            
            let title       = $('[itemprop=name]').text().trim();
            let date        = new Date( $('[itemprop=availabilityStarts]').attr('content') );
            let price       = $('[itemprop=price]').attr('content');
            let address     = $('[itemprop=address]').text().trim();

            let images      = extract_item_images( $ );

            let properties = extract_properties( $ ); // TODO
            let description = properties.description;

            // Get the variable from a <script> in the sourcecode
            // TODO ne marche plus let utag_data = eval_utag_data( $ );

            resolve(Object.assign({}, {
                id,
                uri,
                title,
                date,
                location:{
                    raw: address
                },
                price:price?parseInt(price):null,
                images,
                description,
                properties
            }));
        });
    });
}
