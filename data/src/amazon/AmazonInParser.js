/**
 * Created by Andrey Klochkov on 22.10.2015.
 * class AmazonInParser
 */

function AmazonInParser(){
    this.mainUrl = "http://www.amazon." + AmazonInParser.zone;
    // Amazon.in uses api from amazon.co.uk
    this.completionUrl = "http://completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=44571";
    this.region = AmazonInParser.region;
    this.free = 'free';
    this.currencySign = "&#8377;";
    this.currencySignForExport = "\u20A8";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 30000},
        {min: 6, max: 10, estSale: 26250},
        {min: 11, max: 20, estSale: 22500},
        {min: 21, max: 35, estSale: 18750},
        {min: 36, max: 100, estSale: 13750},
        {min: 101, max: 200, estSale: 7500},
        {min: 201, max: 350, estSale: 3000},
        {min: 351, max: 500, estSale: 1500},
        {min: 501, max: 750, estSale: 1125},
        {min: 751, max: 1500, estSale: 825},
        {min: 1501, max: 3000, estSale: 638},
        {min: 3001, max: 4000, estSale: 525},
        {min: 4001, max: 5000, estSale: 425},
        {min: 5001, max: 6000, estSale: 375},
        {min: 6001, max: 7000, estSale: 313},
        {min: 7001, max: 8000, estSale: 250},
        {min: 8001, max: 9000, estSale: 188},
        {min: 9001, max: 10000, estSale: 150},
        {min: 10001, max: 12000, estSale: 108},
        {min: 12001, max: 15000, estSale: 88},
        {min: 15001, max: 17500, estSale: 78},
        {min: 17501, max: 20000, estSale: 71},
        {min: 20001, max: 25000, estSale: 61},
        {min: 25001, max: 30000, estSale: 50},
        {min: 30001, max: 35000, estSale: 35},
        {min: 35001, max: 50000, estSale: 28},
        {min: 50001, max: 65000, estSale: 13},
        {min: 65001, max: 80000, estSale: 6},
        {min: 80001, max: 100000, estSale: 4},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonInParser.zone = "in";
AmazonInParser.region = "IN";

AmazonInParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonInParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

AmazonInParser.prototype.getKindleEditionRow = function(jqNode) { //??
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonInParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonInParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonInParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonInParser.prototype.parsePrice = function(price) {
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonInParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonInParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonInParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonInParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length > 0) return $(rl_reviews).text().replace('reviews','').replace('review','').trim();
    return "0";
};

AmazonInParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonInParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonInParser.prototype.getPrintLength = function(jqNodes) {
    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }
    return null;
};

AmazonInParser.prototype.getPrice = function(jqNodes) {
    var priceNodes = jqNodes.find('#priceBlock b.priceLarge span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return '';
    return priceNodes[0].nodeValue.trim();
};