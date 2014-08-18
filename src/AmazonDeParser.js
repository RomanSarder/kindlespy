/**
 * class AmazonComParser
 */

function AmazonDeParser(){
    this.MainUrl = AmazonDeParser.MainUrl;
    this.Region = AmazonDeParser.Region;
    this.ParamUrlBestSellers = "530886031";
    this.AmazonBestSellersPattern = "Amazon Bestseller-Rang";
    this.AreYouAnAuthorPattern = "Sind Sie ein Autor";
    this.CurrencySign = "&euro;";
    this.SearchResultsNumber = 48;
    this.BestSellersUrl = "gp/bestsellers"
}

AmazonDeParser.MainUrl = "http://www.amazon.de";
AmazonDeParser.Region = "DE";

AmazonDeParser.prototype.GetTitle = function(responseText){
    return ParseString(responseText, "id=\"btAsinTitle\"", "<span style=\"padding-left: 0\">", '<span');
}

AmazonDeParser.prototype.GetKindleEditionRow = function(resultItem) {
    var retval;
    $(resultItem).find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0 && $(this).text().indexOf("andere Formate")<0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle-Kauf")>0)
            retval= $(this);
    });

    return retval;
}

AmazonDeParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
}

AmazonDeParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
}

AmazonDeParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
}

AmazonDeParser.prototype.ParsePrice = function(price) {
    return price.substr(4).replace(/\./g,'').replace(',', '.');
}

AmazonDeParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
}
