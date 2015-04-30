/**
 * Created by Andrey Klochkov on 30.04.2015.
 * class AmazonItParser
 */

function AmazonItParser(){
    this.mainUrl = "http://www.amazon." + AmazonItParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "http://t1-completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=35691";
    this.region = AmazonItParser.region;
    this.free = 'Gratuito';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editore";
    this.searchKeys = ["da acquistare","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Formato Kindle";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 31200},
        {min: 6, max: 10, estSale: 27300},
        {min: 11, max: 20, estSale: 23400},
        {min: 21, max: 35, estSale: 19500},
        {min: 36, max: 100, estSale: 14300},
        {min: 101, max: 200, estSale: 7800},
        {min: 201, max: 350, estSale: 3120},
        {min: 351, max: 500, estSale: 1560},
        {min: 501, max: 750, estSale: 1170},
        {min: 751, max: 1500, estSale: 858},
        {min: 1501, max: 3000, estSale: 663},
        {min: 3001, max: 4000, estSale: 546},
        {min: 4001, max: 5000, estSale: 442},
        {min: 5001, max: 6000, estSale: 390},
        {min: 6001, max: 7000, estSale: 325},
        {min: 7001, max: 8000, estSale: 260},
        {min: 8001, max: 9000, estSale: 195},
        {min: 9001, max: 10000, estSale: 156},
        {min: 10001, max: 12000, estSale: 112},
        {min: 12001, max: 15000, estSale: 91},
        {min: 15001, max: 17500, estSale: 80},
        {min: 17501, max: 20000, estSale: 74},
        {min: 20001, max: 25000, estSale: 64},
        {min: 25001, max: 30000, estSale: 52},
        {min: 30001, max: 35000, estSale: 37},
        {min: 35001, max: 50000, estSale: 29},
        {min: 50001, max: 65000, estSale: 13},
        {min: 65001, max: 80000, estSale: 6},
        {min: 80001, max: 100000, estSale: 4},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonItParser.zone = "it";
AmazonItParser.region = "IT";

AmazonItParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonItParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

// functions are used only on author page which doesn't exist on amazon.it site.
AmazonItParser.prototype.getKindleEditionRow = function(jqNode) {};
AmazonItParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {};
AmazonItParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {};
AmazonItParser.prototype.getReviewsCountFromResult = function(resultItem) {};

AmazonItParser.prototype.parsePrice = function(price) {
    if(price == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonItParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonItParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonItParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonItParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('recensioni','').replace('recensione','').trim();
    else
        return "0";
};

AmazonItParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('su')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("su")[0].trim();
};

AmazonItParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    return totalSearchResult.substring(totalSearchResult.indexOf("dei") + 4, totalSearchResult.indexOf("risultati") - 1);
};
