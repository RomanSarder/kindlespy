/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonDeParser(){
    this.mainUrl = "http://www.amazon." + AmazonDeParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "http://completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=4";
    this.region = AmazonDeParser.region;
    this.areYouAnAuthorPattern = "Sind Sie ein Autor";
    this.free = 'gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Verlag";
    this.searchKeys = ["kaufen","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 20400},
        {min: 6, max: 10, estSale: 17850},
        {min: 11, max: 20, estSale: 15300},
        {min: 21, max: 35, estSale: 12750},
        {min: 36, max: 100, estSale: 9350},
        {min: 101, max: 200, estSale: 5100},
        {min: 201, max: 350, estSale: 2040},
        {min: 351, max: 500, estSale: 1020},
        {min: 501, max: 750, estSale: 765},
        {min: 751, max: 1500, estSale: 561},
        {min: 1501, max: 3000, estSale: 433},
        {min: 3001, max: 4000, estSale: 357},
        {min: 4001, max: 5000, estSale: 289},
        {min: 5001, max: 6000, estSale: 255},
        {min: 6001, max: 7000, estSale: 212},
        {min: 7001, max: 8000, estSale: 170},
        {min: 8001, max: 9000, estSale: 127},
        {min: 9001, max: 10000, estSale: 102},
        {min: 10001, max: 12000, estSale: 73},
        {min: 12001, max: 15000, estSale: 59},
        {min: 15001, max: 17500, estSale: 53},
        {min: 17501, max: 20000, estSale: 49},
        {min: 20001, max: 25000, estSale: 42},
        {min: 25001, max: 30000, estSale: 34},
        {min: 30001, max: 35000, estSale: 24},
        {min: 35001, max: 50000, estSale: 18},
        {min: 50001, max: 65000, estSale: 8},
        {min: 65001, max: 80000, estSale: 4},
        {min: 80001, max: 100000, estSale: 2},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonDeParser.zone = "de";
AmazonDeParser.region = "DE";

AmazonDeParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonDeParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};
AmazonDeParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0 && $(this).text().indexOf("andere Formate")<0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle-Kauf")>0)
            retval= $(this);
    });

    return retval;
};

AmazonDeParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonDeParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonDeParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonDeParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonDeParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonDeParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonDeParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonDeParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('Rezensionen','').replace('Rezension','').trim();
    else
        return "0";
};

AmazonDeParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('von')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("von")[0].trim();
};

AmazonDeParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("von") != -1 ? totalSearchResult.indexOf("von") + 4 : 0;
    var positionEnd = totalSearchResult.indexOf("Ergebnissen") != -1 ? totalSearchResult.indexOf("Ergebnissen") - 1 : totalSearchResult.indexOf("Ergebnisse") - 1;
    return totalSearchResult.substring(positionStart, positionEnd);
};
