/**
 * Created by Andrey Klochkov on 22.10.2015.
 * class AmazonInParser
 */

function AmazonInParser(){
    this.mainUrl = "//www.amazon." + AmazonInParser.zone;
    // Amazon.in uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=44571";
    this.region = AmazonInParser.region;
    this.free = 'free';
    this.currencySign = "\u20A8";
    this.currencySignForExport = "\u20A8";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankDiv').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 12;
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
    var dataImage = responseText.find('#imgBlkFront').length !== 0 ?
        responseText.find('#imgBlkFront').attr('data-a-dynamic-image') :
        responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonInParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonInParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('out of')");
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
    var priceNodes = $(jqNodes.find('#buybox .kindle-price td')[1]).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length > 0) return priceNodes[1].nodeValue.trim();

    priceNodes = jqNodes.find('#priceBlock b.priceLarge span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return '';
    return priceNodes[0].nodeValue.trim();
};