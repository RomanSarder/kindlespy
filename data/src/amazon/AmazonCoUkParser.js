/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCoUkParser
 */

function AmazonCoUkParser(){
    this.mainUrl = "http://www.amazon." + AmazonCoUkParser.zone;
    this.completionUrl = "http://completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=3";
    this.region = AmazonCoUkParser.region;
    this.areYouAnAuthorPattern = "Are You an Author";
    this.free = 'free';
    this.currencySign = "&pound;";
    this.currencySignForExport = "\u00A3";
    this.thousandSeparator = ",";
    this.decimalSeparator = ".";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 60000},
        {min: 6, max: 10, estSale: 52500},
        {min: 11, max: 20, estSale: 45000},
        {min: 21, max: 35, estSale: 37500},
        {min: 36, max: 100, estSale: 27500},
        {min: 101, max: 200, estSale: 15000},
        {min: 201, max: 350, estSale: 6000},
        {min: 351, max: 500, estSale: 3000},
        {min: 501, max: 750, estSale: 2250},
        {min: 751, max: 1500, estSale: 1650},
        {min: 1501, max: 3000, estSale: 1275},
        {min: 3001, max: 4000, estSale: 1050},
        {min: 4001, max: 5000, estSale: 850},
        {min: 5001, max: 6000, estSale: 750},
        {min: 6001, max: 7000, estSale: 625},
        {min: 7001, max: 8000, estSale: 500},
        {min: 8001, max: 9000, estSale: 375},
        {min: 9001, max: 10000, estSale: 300},
        {min: 10001, max: 12000, estSale: 215},
        {min: 12001, max: 15000, estSale: 175},
        {min: 15001, max: 17500, estSale: 155},
        {min: 17501, max: 20000, estSale: 143},
        {min: 20001, max: 25000, estSale: 123},
        {min: 25001, max: 30000, estSale: 100},
        {min: 30001, max: 35000, estSale: 70},
        {min: 35001, max: 50000, estSale: 55},
        {min: 50001, max: 65000, estSale: 25},
        {min: 65001, max: 80000, estSale: 13},
        {min: 80001, max: 100000, estSale: 8},
        {min: 100001, max: 200000, estSale: 2},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonCoUkParser.zone = "co.uk";
AmazonCoUkParser.region = "UK";

AmazonCoUkParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonCoUkParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonCoUkParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle Purchase")>0)
            retval= $(this);
    });

    return retval;
};

AmazonCoUkParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonCoUkParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonCoUkParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonCoUkParser.prototype.parsePrice = function(price) {
    if(price == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonCoUkParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCoUkParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var path = url.split("/");
    if(path.length > 5){
        this.GetResponseTextFromAmazonComParser(path[5], function(htmlFromAmazonCom){
            var jqHtml = Helper.parseHtmlToJquery(htmlFromAmazonCom);
             return callback((jqHtml!==null) ? jqHtml.find('#main-image').attr('rel') : '');
        });
        return;
    }

    return callback("");
};

AmazonCoUkParser.prototype.GetResponseTextFromAmazonComParser = function(bookCode, callback) {
    var urlAmazonCom = "http://www.amazon.com/product/dp/" + bookCode;
    Api.sendMessageToActiveTab({type:'http-get', url: urlAmazonCom}, callback);
};

AmazonCoUkParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonCoUkParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('reviews','').replace('review','').trim();
    else
        return  "0";
};

AmazonCoUkParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCoUkParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("of") != -1 ? totalSearchResult.indexOf("of") + 3 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("results") - 1).replace(/[^0-9]/g, '');
};
