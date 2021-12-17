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


exports.formatSizeAndPrice = function (spaces){
    var size = null;
    var price = null;
    if (spaces.length === 1){
        size = numberWithCommas(spaces[0].size);

        var priceUnit = spaces[0].priceUnit;
        if (!priceUnit) priceUnit = "/sf/yr";

        if (spaces[0].price){
            price = numberWithCommas(spaces[0].price) + " " + priceUnit;
        }

        size += " sf for lease";
    } else if (spaces.length > 1){
        var minSize = numberWithCommas(getMinSize(spaces));
        var maxSize = numberWithCommas(getMaxSize(spaces));
        if (minSize === maxSize){
            size = minSize;
        } else {
            size = minSize+" - "+maxSize;
        }

        var minPriceIndex = getMinPriceIndex(spaces);
        var maxPriceIndex = getMaxPriceIndex(spaces);
        if (spaces[minPriceIndex].price !== null){
            if (minPriceIndex === maxPriceIndex){
                var minPrice =  numberWithCommas(spaces[minPriceIndex].price);
                priceUnit = spaces[minPriceIndex].priceUnit ?  spaces[minPriceIndex].priceUnit : "/sf/yr";
                if (minPrice){
                    price = minPrice + " " + priceUnit;
                }
            } else {

                minPrice = numberWithCommas(spaces[minPriceIndex].price);
                var maxPrice = numberWithCommas(spaces[maxPriceIndex].price);
                var minPriceUnit = spaces[minPriceIndex].priceUnit;
                var maxPriceUnit = spaces[maxPriceIndex].priceUnit;

                if (minPriceUnit === null) minPriceUnit = "/sf/yr";
                if (maxPriceUnit === null) maxPriceUnit = "/sf/yr";

                if (minPriceUnit === maxPriceUnit){
                    price = minPrice + " - " + maxPrice + " " + minPriceUnit;
                } else {
                    price = minPrice + " " + minPriceUnit + " - " +
                        maxPrice + " " + maxPriceUnit;
                }
            }
        }
        size += " sf (" + spaces.length + " spaces)";
    } else {
        return null;
    }
    if (price){
        price = "$"+price;
    }

    var ret = {
        size: size,
        price: price
    }
    return ret;
}


function numberWithCommas(x){
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        if (l.spaces.length > 0){
            var sizeAndPrice = exports.formatSizeAndPrice(l.spaces);
            listing.p_price = sizeAndPrice.price;
            listing.p_spec = sizeAndPrice.size;
        }
        if (l.listingPrice){
            var floatPrice = parseFloat(l.listingPrice);
            var listingPrice = floatPrice.toLocaleString(undefined, {maximumFractionDigits:0});
            listing.p_price = "For Sale at $"+listingPrice;
        }

        listing.p_url = "https://local.phowma.com/listing/" + l.id;
        listings.push(listing);
    }
    newBody.listings = listings;
    newBody.profile = {};
    return(newBody);
}

