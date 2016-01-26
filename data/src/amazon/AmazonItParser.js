/**
 * Created by Andrey Klochkov on 30.04.2015.
 * class AmazonItParser
 */

function AmazonItParser(){
    this.mainUrl = "http://www.amazon." + AmazonItParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "http://t1-completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=35691";
    this.region = AmazonItParser.region;
    this.free = 'gratuito';
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
        {min: 1, max: 5, estSale: 26520},
        {min: 6, max: 10, estSale: 23205},
        {min: 11, max: 20, estSale: 19890},
        {min: 21, max: 35, estSale: 16575},
        {min: 36, max: 100, estSale: 12155},
        {min: 101, max: 200, estSale: 6630},
        {min: 201, max: 350, estSale: 2652},
        {min: 351, max: 500, estSale: 1326},
        {min: 501, max: 750, estSale: 994},
        {min: 751, max: 1500, estSale: 729},
        {min: 1501, max: 3000, estSale: 564},
        {min: 3001, max: 4000, estSale: 464},
        {min: 4001, max: 5000, estSale: 376},
        {min: 5001, max: 6000, estSale: 332},
        {min: 6001, max: 7000, estSale: 276},
        {min: 7001, max: 8000, estSale: 221},
        {min: 8001, max: 9000, estSale: 166},
        {min: 9001, max: 10000, estSale: 133},
        {min: 10001, max: 12000, estSale: 95},
        {min: 12001, max: 15000, estSale: 77},
        {min: 15001, max: 17500, estSale: 68},
        {min: 17501, max: 20000, estSale: 63},
        {min: 20001, max: 25000, estSale: 54},
        {min: 25001, max: 30000, estSale: 44},
        {min: 30001, max: 35000, estSale: 31},
        {min: 35001, max: 50000, estSale: 25},
        {min: 50001, max: 65000, estSale: 11},
        {min: 65001, max: 80000, estSale: 5},
        {min: 80001, max: 100000, estSale: 3},
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
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonItParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonItParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#imgBlkFront').attr('rel'));
};

AmazonItParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#imgBlkFront').attr('data-src');
};

AmazonItParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find('#summaryStars a').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('recensioni','').replace('recensione','').trim();
};

AmazonItParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('su')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("su")[0].trim();
};

AmazonItParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("dei") != -1 ? totalSearchResult.indexOf("dei") + 4 : 0;
    return totalSearchResult.substring(positionStart, totalSearchResult.indexOf("risultati") - 1);
};

AmazonItParser.prototype.getPrintLength = function(jqNodes) {
    var printLength = jqNodes.find('#productDetailsTable .content li:contains(Lunghezza stampa)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(printLength.length > 0){
        return parseInt(printLength[0].nodeValue).toString();
    }
    return null;
};

AmazonItParser.prototype.getPrice = function(jqNodes) {
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