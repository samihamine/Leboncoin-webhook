var leboncoin = require('./index');

var express = require('express');
const app = express()

app.get('/ad/:id', function (req, res) {

    res.setHeader('Content-Type','application/json')

    leboncoin.getAd( req.params.id ).then( result => 
    res.send(JSON.stringify(result)) );

});

app.get('/search', function (req, res) {

    res.setHeader('Content-Type','application/json')

    leboncoin.search({

        category: leboncoin.CATEGORIES.LOCATION
        
    }).then( result => {

        res.end( JSON.stringify( result ) );
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
