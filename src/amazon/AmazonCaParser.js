/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCaParser
 */

function AmazonCaParser(){
    this.mainUrl = "//www.amazon." + AmazonCaParser.zone;
    // Amazon.ca uses api from amazon.com
    this.completionUrl = "//completion.amazon." + AmazonComParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=7";
    this.region = AmazonCaParser.region;
    this.free = 'free';
    this.currencySign = "$";
    this.currencySignForExport = "$";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankDiv').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 13;
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
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonCaParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCaParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonCaParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonCaParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCaParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1);
};

AmazonCaParser.prototype.getPrintLength = function(jqNodes) {
    var text = jqNodes.find('#productDetailsTable .content li:contains(Print Length)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }

    return null;
};
