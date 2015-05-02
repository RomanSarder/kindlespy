/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCaParser
 */

function AmazonCaParser(){
    this.mainUrl = "http://www.amazon." + AmazonCaParser.zone;
    // Amazon.ca uses api from amazon.com
    this.completionUrl = "http://completion.amazon." + AmazonComParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=7";
    this.region = AmazonCaParser.region;
    this.free = 'free';
    this.currencySign = "$";
    this.currencySignForExport = "$";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 67200},
        {min: 6, max: 10, estSale: 58800},
        {min: 11, max: 20, estSale: 50400},
        {min: 21, max: 35, estSale: 42000},
        {min: 36, max: 100, estSale: 30800},
        {min: 101, max: 200, estSale: 16800},
        {min: 201, max: 350, estSale: 6720},
        {min: 351, max: 500, estSale: 3360},
        {min: 501, max: 750, estSale: 2520},
        {min: 751, max: 1500, estSale: 1848},
        {min: 1501, max: 3000, estSale: 1428},
        {min: 3001, max: 4000, estSale: 1176},
        {min: 4001, max: 5000, estSale: 952},
        {min: 5001, max: 6000, estSale: 840},
        {min: 6001, max: 7000, estSale: 700},
        {min: 7001, max: 8000, estSale: 560},
        {min: 8001, max: 9000, estSale: 420},
        {min: 9001, max: 10000, estSale: 336},
        {min: 10001, max: 12000, estSale: 241},
        {min: 12001, max: 15000, estSale: 196},
        {min: 15001, max: 17500, estSale: 174},
        {min: 17501, max: 20000, estSale: 160},
        {min: 20001, max: 25000, estSale: 137},
        {min: 25001, max: 30000, estSale: 112},
        {min: 30001, max: 35000, estSale: 78},
        {min: 35001, max: 50000, estSale: 62},
        {min: 50001, max: 65000, estSale: 28},
        {min: 65001, max: 80000, estSale: 14},
        {min: 80001, max: 100000, estSale: 8},
        {min: 100001, max: 200000, estSale: 2},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonCaParser.zone = "ca";
AmazonCaParser.region = "CA";

AmazonCaParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonCaParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find(".productDescriptionWrapper").text().trim();
};

// functions are used only on author page which doesn't exist on amazon.ca site.
AmazonCaParser.prototype.getKindleEditionRow = function() {};
AmazonCaParser.prototype.getUrlFromKindleEditionRow = function() {};
AmazonCaParser.prototype.getPriceFromKindleEditionRow = function() {};
AmazonCaParser.prototype.getReviewsCountFromResult = function() {};

AmazonCaParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return price.substr(4);
};

AmazonCaParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCaParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonCaParser.prototype.getImageUrlSrc = function(responseText) {
    return Helper.parseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonCaParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('reviews','').replace('review','').trim();
    else
        return  "0";
};

AmazonCaParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCaParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};
