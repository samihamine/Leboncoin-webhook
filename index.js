const express = require('express');
const bodyParser = require('body-parser');

const restService = express();

var leboncoin = require('./leboncoin');

restService.use(bodyParser.urlencoded({
    extended: true
}));

restService.use(bodyParser.json());

restService.post('/webhook', function(req, res) {
    //var speech = req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ? req.body.result.parameters.echoText : "Oups quleques problèmes de connexion, peux-tu répéter s'il te plaît ?"
    if( req.body.result && req.body.result.parameters && req.body.result.parameters.echoText ){
        leboncoin.search({ category:leboncoin.CATEGORIES.LOCATION }).then( result => {
                //console.log( result );
                //var speech = result;
                var speech = "test ok ";
        })
    } else {
        var speech =  "Oups quleques problèmes de connexion, peux-tu répéter s'il te plaît ?";       
    }

    return res.json({
        speech: speech,
        displayText: speech,
        source: 'webhook-leboncoin'
    });
});

restService.listen((process.env.PORT || 8000), function() {
    console.log("Server up and listening");
});
