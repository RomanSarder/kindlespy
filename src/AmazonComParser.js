/**
 * class AmazonComParser
 */

function AmazonComParser(){
    this.MainUrl = AmazonComParser.MainUrl;
    this.ParamUrlBestSellers = "341689031";
    this.AmazonBestSellersPattern = "Amazon Best Sellers Rank";
    this.CurrencySign = "$";
}

AmazonComParser.MainUrl = "http://www.amazon.com";

AmazonComParser.prototype.GetTitle = function(responseText){
    return ParseString(responseText, "id=\"btAsinTitle\"", '>', '<');
}

AmazonComParser.prototype.GetKindleEditionRow = function(resultItem) {
    var retval;
    $(resultItem).find(".tp").find("tr").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
    });

    return retval;
}

AmazonComParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".tpType > a:first").attr("href");
}

AmazonComParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".toeOurPrice > a:first");
}

AmazonComParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".reviewsCount > a:first").text();
}
