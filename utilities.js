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
