/**
 * Created by Andrey Klochkov on 09.03.2015.
 * class AmazonFrParser
 */

function AmazonFrParser(){
    this.mainUrl = "http://www.amazon." + AmazonFrParser.zone;
    // Amazon.fr uses api from amazon.co.uk
    this.completionUrl = "http://t1-completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=5";
    this.region = AmazonFrParser.region;
    this.paramUrlBestSellers = "695398031";
    this.areYouAnAuthorPattern = "Etes-vous un auteur";
    this.free = 'Gratuit';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Editeur";
    this.searchKeys = ["à acheter","louer"];
    this.numberSign = decodeURI("n%C2%B0");
    this.searchPattern = "Format Kindle";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 32800},
        {min: 6, max: 10, estSale: 28700},
        {min: 11, max: 20, estSale: 24600},
        {min: 21, max: 35, estSale: 20500},
        {min: 36, max: 100, estSale: 15033},
        {min: 101, max: 200, estSale: 8200},
        {min: 201, max: 350, estSale: 3280},
        {min: 351, max: 500, estSale: 1640},
        {min: 501, max: 750, estSale: 1230},
        {min: 751, max: 1500, estSale: 902},
        {min: 1501, max: 3000, estSale: 697},
        {min: 3001, max: 4000, estSale: 574},
        {min: 4001, max: 5000, estSale: 465},
        {min: 5001, max: 6000, estSale: 410},
        {min: 6001, max: 7000, estSale: 342},
        {min: 7001, max: 8000, estSale: 273},
        {min: 8001, max: 9000, estSale: 205},
        {min: 9001, max: 10000, estSale: 164},
        {min: 10001, max: 12000, estSale: 117},
        {min: 12001, max: 15000, estSale: 96},
        {min: 15001, max: 17500, estSale: 85},
        {min: 17501, max: 20000, estSale: 78},
        {min: 20001, max: 25000, estSale: 67},
        {min: 25001, max: 30000, estSale: 55},
        {min: 30001, max: 35000, estSale: 39},
        {min: 35001, max: 50000, estSale: 30},
        {min: 50001, max: 65000, estSale: 14},
        {min: 65001, max: 80000, estSale: 21},
        {min: 80001, max: 100000, estSale: 7},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonFrParser.zone = "fr";
AmazonFrParser.region = "FR";

AmazonFrParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (titleNodes === undefined || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonFrParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};

AmazonFrParser.prototype.getKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonFrParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonFrParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonFrParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonFrParser.prototype.parsePrice = function(price) {
    if(price == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonFrParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonFrParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    callback(responseText.find('#main-image').attr('rel'));
};

AmazonFrParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('data-src');
};

AmazonFrParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('commentaires','').replace('commentaire','').trim();
    else
        return "0";
};

AmazonFrParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum span:contains('étoiles sur')");
    if(ratingString === undefined && ratingString =='') return undefined;
    return ratingString.text().split("étoiles sur")[0].trim();
};

AmazonFrParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    return totalSearchResult.substring(totalSearchResult.indexOf("sur") + 4, totalSearchResult.indexOf("résultats") - 1);
};
