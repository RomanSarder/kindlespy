/**
 * Created by Andrey Klochkov on 01.05.2015.
 * class AmazonEsParser
 */

function AmazonEsParser(){
    this.mainUrl = "http://www.amazon." + AmazonEsParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "http://t1-completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=44551";
    this.region = AmazonEsParser.region;
    this.free = 'gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editor";
    this.searchKeys = ["para comprar","to rent"];
    this.numberSign = decodeURI("n%C2%B0");
    this.searchPattern = decodeURI(encodeURI("Versión Kindle"));
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 28800},
        {min: 6, max: 10, estSale: 25200},
        {min: 11, max: 20, estSale: 21600},
        {min: 21, max: 35, estSale: 18000},
        {min: 36, max: 100, estSale: 13200},
        {min: 101, max: 200, estSale: 7200},
        {min: 201, max: 350, estSale: 2880},
        {min: 351, max: 500, estSale: 1440},
        {min: 501, max: 750, estSale: 1080},
        {min: 751, max: 1500, estSale: 792},
        {min: 1501, max: 3000, estSale: 612},
        {min: 3001, max: 4000, estSale: 504},
        {min: 4001, max: 5000, estSale: 408},
        {min: 5001, max: 6000, estSale: 360},
        {min: 6001, max: 7000, estSale: 300},
        {min: 7001, max: 8000, estSale: 240},
        {min: 8001, max: 9000, estSale: 180},
        {min: 9001, max: 10000, estSale: 144},
        {min: 10001, max: 12000, estSale: 103},
        {min: 12001, max: 15000, estSale: 84},
        {min: 15001, max: 17500, estSale: 74},
        {min: 17501, max: 20000, estSale: 68},
        {min: 20001, max: 25000, estSale: 59},
        {min: 25001, max: 30000, estSale: 48},
        {min: 30001, max: 35000, estSale: 34},
        {min: 35001, max: 50000, estSale: 27},
        {min: 50001, max: 65000, estSale: 12},
        {min: 65001, max: 80000, estSale: 6},
        {min: 80001, max: 100000, estSale: 4},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonEsParser.zone = "es";
AmazonEsParser.region = "ES";

AmazonEsParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonEsParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

// functions are used only on author page which doesn't exist on amazon.it site.
AmazonEsParser.prototype.getKindleEditionRow = function(jqNode) {};
AmazonEsParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {};
AmazonEsParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {};
AmazonEsParser.prototype.getReviewsCountFromResult = function(resultItem) {};

AmazonEsParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonEsParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonEsParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonEsParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonEsParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('opiniones','').replace(decodeURI("opini%C3%B3n"),'').trim();
    else
        return "0";
};

AmazonEsParser.prototype.getRating = function(responseText){
    var pattern = decodeURI(encodeURI("de un máximo de"));
    var ratingString = responseText.find("#revSum .acrRating:contains('" + pattern + "')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split(pattern)[0].trim();
};

AmazonEsParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("de") != -1 ? totalSearchResult.indexOf("de") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("resultados para") - 1);
};
