/**
 * class AmazonCoUkParser
 */

function AmazonCoUkParser(){
    this.MainUrl = AmazonCoUkParser.MainUrl;
    this.Region = AmazonCoUkParser.Region;
    this.ParamUrlBestSellers = "154606011";
    this.AmazonBestSellersPattern = "Amazon Bestsellers Rank";
    this.AreYouAnAuthorPattern = "Are You an Author";
    this.CurrencySign = "&pound;";
    this.SearchResultsNumber = 48;
    this.BestSellersUrl = "Best-Sellers-Kindle-Store"
}

AmazonCoUkParser.MainUrl = "http://www.amazon.co.uk";
AmazonCoUkParser.Region = "UK";

AmazonCoUkParser.prototype.GetTitle = function(responseText){
    return ParseString(responseText, "id=\"btAsinTitle\"", "<span style=\"padding-left: 0\">", '<span');
}

AmazonCoUkParser.prototype.GetKindleEditionRow = function(resultItem) {
    var retval;
    $(resultItem).find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle Purchase")>0)
            retval= $(this);
    });

    return retval;
}

AmazonCoUkParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
}

AmazonCoUkParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
}

AmazonCoUkParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
}

AmazonCoUkParser.prototype.ParsePrice = function(price) {
    return price.substr(1);
}

AmazonCoUkParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
}
