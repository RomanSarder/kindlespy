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
        {min: 1, max: 5, estSale: 24480},
        {min: 6, max: 10, estSale: 21420},
        {min: 11, max: 20, estSale: 18360},
        {min: 21, max: 35, estSale: 15300},
        {min: 36, max: 100, estSale: 11220},
        {min: 101, max: 200, estSale: 6120},
        {min: 201, max: 350, estSale: 2448},
        {min: 351, max: 500, estSale: 1224},
        {min: 501, max: 750, estSale: 918},
        {min: 751, max: 1500, estSale: 673},
        {min: 1501, max: 3000, estSale: 520},
        {min: 3001, max: 4000, estSale: 428},
        {min: 4001, max: 5000, estSale: 347},
        {min: 5001, max: 6000, estSale: 306},
        {min: 6001, max: 7000, estSale: 255},
        {min: 7001, max: 8000, estSale: 204},
        {min: 8001, max: 9000, estSale: 153},
        {min: 9001, max: 10000, estSale: 122},
        {min: 10001, max: 12000, estSale: 88},
        {min: 12001, max: 15000, estSale: 71},
        {min: 15001, max: 17500, estSale: 63},
        {min: 17501, max: 20000, estSale: 58},
        {min: 20001, max: 25000, estSale: 50},
        {min: 25001, max: 30000, estSale: 41},
        {min: 30001, max: 35000, estSale: 29},
        {min: 35001, max: 50000, estSale: 23},
        {min: 50001, max: 65000, estSale: 10},
        {min: 65001, max: 80000, estSale: 5},
        {min: 80001, max: 100000, estSale: 3},
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
    return callback(responseText.find('#imgBlkFront').attr('rel'));
};

AmazonEsParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#imgBlkFront').attr('data-src');
};

AmazonEsParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find('#summaryStars a').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('opiniones','').replace(decodeURI("opini%C3%B3n"),'').trim();
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

AmazonEsParser.prototype.getPrintLength = function(jqNodes) {
    var printLength = jqNodes.find('#productDetailsTable .content li:contains(Longitud de impresi)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(printLength.length > 0){
        return parseInt(printLength[0].nodeValue).toString();
    }
    return null;
};

AmazonEsParser.prototype.getPrice = function(jqNodes) {
    var priceNodes = $(jqNodes.find('#buybox .kindle-price td')[1]).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length > 0) return priceNodes[0].nodeValue.trim();

    priceNodes = $(jqNodes.find('#tmmSwatches .a-button-text span:contains("Kindle")').next().next().find('.a-color-price')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes === 'undefined' || priceNodes.length == 0) return null;
    return priceNodes[0].nodeValue.trim();
};

