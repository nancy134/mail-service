exports.getFromAddress = function(req){
    var host = req.get('host')
    var parts = host.split(".");
    var fromAddress = null;
    var domain = null;
    if (parts.length > 2){
        domain = parts[1]+"."+parts[2]; 
    }
    if (domain){
        fromAddress = "support@" + domain;
    }
    return fromAddress;
}
