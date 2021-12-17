exports.getFromAddress = function(req){
    var host = req.get('host')
    var parts = host.split(".");
    var fromAddress = null;
    var domain = null;
    if (parts.length > 2){
        domain = parts[1]+"."+parts[2]; 
    }

    var name = "";
    if (domain === "sabresw.com"){
        name = "SabreSW";
    } else if (domain === "phowma.com"){
        name = "Phowma";
    } else if (domain === "findingcre.com"){
        name = "FindingCRE";
    }

    if (domain){
        fromAddress = name+" <support@" + domain + ">";
    }
    return fromAddress;
}

exports.convertFindingcreData = function(body){
    var newBody = {}
    var listings = [];
    for (var i=0; i<body.listItems.rows.length; i++){
        var listing = {};
        var l = body.listItems.rows[i].listing.versions[0];
        listing.p_address = l.address;
        listing.p_city = l.city + ", " + l.state;
        listing.p_name = l.shortDescription;
        if (l.images.length > 0){
            listing.p_image = l.images[0].url
        }
        listings.push(listing);
    }
    newBody.listings = listings;
    newBody.profile = {};
    return(newBody);
}

