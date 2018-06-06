/**
 * Created by Andrey Klochkov on 30.04.2015.
 * class AmazonItParser
 */

function AmazonItParser(){
    this.mainUrl = "//www.amazon." + AmazonItParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=35691";
    this.region = AmazonItParser.region;
    this.free = 'gratuito';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankDiv').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editore";
    this.searchKeys = ["da acquistare","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Formato Kindle";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 8;
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
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonItParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find('#summaryStars a').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof rl_reviews === 'undefined' || rl_reviews.length == 0) return '0';
    return rl_reviews[1].nodeValue.replace('recensioni','').replace('recensione','').trim();
};

AmazonItParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('su')");
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