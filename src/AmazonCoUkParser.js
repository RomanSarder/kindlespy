/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCoUkParser
 */

function AmazonCoUkParser(){
    this.MainUrl = AmazonCoUkParser.MainUrl;
    this.Region = AmazonCoUkParser.Region;
    this.ParamUrlBestSellers = "154606011";
    this.AmazonBestSellersPattern = "Amazon Bestsellers Rank";
    this.AreYouAnAuthorPattern = "Are You an Author";
    this.CurrencySign = "&pound;";
    this.CurrencySignForExport = "\u00A3";
    this.ThousandSeparator = ",";
    this.SearchResultsNumber = 16;
    this.AuthorResultsNumber = 16;
    this.BestSellersUrl = "Best-Sellers-Kindle-Store";
    this.Publisher = "Publisher";
    this.EstSalesScale = [
        {"min": 1, "max": 5, "EstSale": 60000},
        {"min": 6, "max": 10, "EstSale": 52500},
        {"min": 11, "max": 20, "EstSale": 45000},
        {"min": 21, "max": 35, "EstSale": 37500},
        {"min": 36, "max": 100, "EstSale": 27500},
        {"min": 101, "max": 200, "EstSale": 15000},
        {"min": 201, "max": 350, "EstSale": 6000},
        {"min": 351, "max": 500, "EstSale": 3000},
        {"min": 501, "max": 750, "EstSale": 2250},
        {"min": 751, "max": 1500, "EstSale": 1650},
        {"min": 1501, "max": 3000, "EstSale": 1275},
        {"min": 3001, "max": 4000, "EstSale": 1050},
        {"min": 4001, "max": 5000, "EstSale": 850},
        {"min": 5001, "max": 6000, "EstSale": 750},
        {"min": 6001, "max": 7000, "EstSale": 625},
        {"min": 7001, "max": 8000, "EstSale": 500},
        {"min": 8001, "max": 9000, "EstSale": 375},
        {"min": 9001, "max": 10000, "EstSale": 300},
        {"min": 10001, "max": 12000, "EstSale": 215},
        {"min": 12001, "max": 15000, "EstSale": 175},
        {"min": 15001, "max": 17500, "EstSale": 155},
        {"min": 17501, "max": 20000, "EstSale": 143},
        {"min": 20001, "max": 25000, "EstSale": 123},
        {"min": 25001, "max": 30000, "EstSale": 100},
        {"min": 30001, "max": 35000, "EstSale": 70},
        {"min": 35001, "max": 50000, "EstSale": 55},
        {"min": 50001, "max": 65000, "EstSale": 25},
        {"min": 65001, "max": 80000, "EstSale": 13},
        {"min": 80001, "max": 100000, "EstSale": 8},
        {"min": 100001, "max": 200000, "EstSale": 2},
        {"min": 200001, "max": 500000, "EstSale": 1},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];
}

AmazonCoUkParser.MainUrl = "http://www.amazon.co.uk";
AmazonCoUkParser.Region = "UK";

AmazonCoUkParser.prototype.GetTitle = function(responseText){
    return ParseString(responseText, "id=\"btAsinTitle\"", "<span style=\"padding-left: 0\">", '<span');
};

AmazonCoUkParser.prototype.GetKindleEditionRow = function(resultItem) {
    var retval;
    $(resultItem).find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle Purchase")>0)
            retval= $(this);
    });

    return retval;
};

AmazonCoUkParser.prototype.GetUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonCoUkParser.prototype.GetPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonCoUkParser.prototype.GetReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonCoUkParser.prototype.ParsePrice = function(price) {
    if(!price) return 0;
    return price.substr(1);
};

AmazonCoUkParser.prototype.FormatPrice = function(price) {
    return this.CurrencySign + price;
};

AmazonCoUkParser.prototype.GetGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var path = url.split("/");
    if(path.length > 5)
         this.GetResponseTextFromAmazonComParser(path[5], function(responseText){
             callback((responseText!==null)?$(responseText).find('#main-image').attr('rel'):"");
        });
    callback("");
};

AmazonCoUkParser.prototype.GetResponseTextFromAmazonComParser = function(bookCode, callback) {
    var urlAmazonCom = "http://www.amazon.com/product/dp/" + bookCode;
    $.get(urlAmazonCom, callback);
};

AmazonCoUkParser.prototype.GetImageUrlSrc = function(responseText) {
    return $(responseText).find('#prodImage').attr('src');
};