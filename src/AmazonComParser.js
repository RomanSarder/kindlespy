/**
 * class AmazonComParser
 */

function AmazonComParser(){
    this.MainUrl = AmazonComParser.MainUrl;
    this.Region = AmazonComParser.Region;
    this.ParamUrlBestSellers = "341689031";
    this.AmazonBestSellersPattern = "Amazon Best Sellers Rank";
    this.AreYouAnAuthorPattern = "Are You an Author";
    this.CurrencySign = "$";
    this.SearchResultsNumber = 16;
    this.BestSellersUrl = "Best-Sellers-Kindle-Store"
}

AmazonComParser.MainUrl = "http://www.amazon.com";
AmazonComParser.Region = "USA";

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

AmazonComParser.prototype.ParsePrice = function(price) {
    return price.substr(1);
}

AmazonComParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
}
