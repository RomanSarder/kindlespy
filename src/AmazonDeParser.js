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
    this.CurrencySignForExport = "\u20AC";
    this.ThousandSeparator = ".";
    this.SearchResultsNumber = 48;
    this.BestSellersUrl = "gp/bestsellers";
    this.EstSalesScale = [
        {"min": 1, "max": 5, "EstSale": 40000},
        {"min": 6, "max": 10, "EstSale": 35000},
        {"min": 11, "max": 20, "EstSale": 30000},
        {"min": 21, "max": 35, "EstSale": 25000},
        {"min": 36, "max": 100, "EstSale": 18333},
        {"min": 101, "max": 200, "EstSale": 10000},
        {"min": 201, "max": 350, "EstSale": 4000},
        {"min": 351, "max": 500, "EstSale": 2000},
        {"min": 501, "max": 750, "EstSale": 1500},
        {"min": 751, "max": 1500, "EstSale": 1100},
        {"min": 1501, "max": 3000, "EstSale": 850},
        {"min": 3001, "max": 4000, "EstSale": 700},
        {"min": 4001, "max": 5000, "EstSale": 567},
        {"min": 5001, "max": 6000, "EstSale": 500},
        {"min": 6001, "max": 7000, "EstSale": 417},
        {"min": 7001, "max": 8000, "EstSale": 333},
        {"min": 8001, "max": 9000, "EstSale": 250},
        {"min": 9001, "max": 10000, "EstSale": 200},
        {"min": 10001, "max": 12000, "EstSale": 143},
        {"min": 12001, "max": 15000, "EstSale": 117},
        {"min": 15001, "max": 17500, "EstSale": 103},
        {"min": 17501, "max": 20000, "EstSale": 95},
        {"min": 20001, "max": 25000, "EstSale": 82},
        {"min": 25001, "max": 30000, "EstSale": 67},
        {"min": 30001, "max": 35000, "EstSale": 47},
        {"min": 35001, "max": 50000, "EstSale": 37},
        {"min": 50001, "max": 65000, "EstSale": 17},
        {"min": 65001, "max": 80000, "EstSale": 25},
        {"min": 80001, "max": 100000, "EstSale": 8},
        {"min": 100001, "max": 200000, "EstSale": 1},
        {"min": 200001, "max": 500000, "EstSale": 1},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];
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
