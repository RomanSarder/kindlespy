/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonDeParser(){
    this.mainUrl = "http://www.amazon." + AmazonDeParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "http://completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=4";
    this.region = AmazonDeParser.region;
    this.paramUrlBestSellers = "530886031";
    this.areYouAnAuthorPattern = "Sind Sie ein Autor";
    this.free = 'Gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Verlag";
    this.searchKeys = ["kaufen","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.estSalesScale = [
        {min: 1, max: 5, estSale: 40000},
        {min: 6, max: 10, estSale: 35000},
        {min: 11, max: 20, estSale: 30000},
        {min: 21, max: 35, estSale: 25000},
        {min: 36, max: 100, estSale: 18333},
        {min: 101, max: 200, estSale: 10000},
        {min: 201, max: 350, estSale: 4000},
        {min: 351, max: 500, estSale: 2000},
        {min: 501, max: 750, estSale: 1500},
        {min: 751, max: 1500, estSale: 1100},
        {min: 1501, max: 3000, estSale: 850},
        {min: 3001, max: 4000, estSale: 700},
        {min: 4001, max: 5000, estSale: 567},
        {min: 5001, max: 6000, estSale: 500},
        {min: 6001, max: 7000, estSale: 417},
        {min: 7001, max: 8000, estSale: 333},
        {min: 8001, max: 9000, estSale: 250},
        {min: 9001, max: 10000, estSale: 200},
        {min: 10001, max: 12000, estSale: 143},
        {min: 12001, max: 15000, estSale: 117},
        {min: 15001, max: 17500, estSale: 103},
        {min: 17501, max: 20000, estSale: 95},
        {min: 20001, max: 25000, estSale: 82},
        {min: 25001, max: 30000, estSale: 67},
        {min: 30001, max: 35000, estSale: 47},
        {min: 35001, max: 50000, estSale: 37},
        {min: 50001, max: 65000, estSale: 17},
        {min: 65001, max: 80000, estSale: 25},
        {min: 80001, max: 100000, estSale: 8},
        {min: 100001, max: 200000, estSale: 1},
        {min: 200001, max: 500000, estSale: 1},
        {min: 500001, max: -1, estSale: 1}
    ];
}

AmazonDeParser.zone = "de";
AmazonDeParser.region = "DE";

AmazonDeParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (titleNodes === undefined || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonDeParser.prototype.getDescription = function(jqNodes){
    return jqNodes.find("#productDescription .content").text().trim();
};
AmazonDeParser.prototype.getKindleEditionRow = function(jqNode) {
    var retval;
    jqNode.find("li").each(function() {
        if($(this).text().indexOf("Kindle Edition")>0 && $(this).text().indexOf("andere Formate")<0)
            retval= $(this);
        else if($(this).text().indexOf("Kindle-Kauf")>0)
            retval= $(this);
    });

    return retval;
};

AmazonDeParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("a:first").attr("href");
};

AmazonDeParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find("span.bld");
};

AmazonDeParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".rvwCnt > a:first").text();
};

AmazonDeParser.prototype.parsePrice = function(price) {
    if(price == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonDeParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonDeParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonDeParser.prototype.getImageUrlSrc = function(responseText) {
    return responseText.find('#main-image').attr('src');
};

AmazonDeParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('Rezensionen','').replace('Rezension','').trim();
    else
        return "0";
};

AmazonDeParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('von')");
    if(ratingString === undefined && ratingString =='') return undefined;
    return ratingString.text().split("von")[0].trim();
};

AmazonDeParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    return totalSearchResult.substring(totalSearchResult.indexOf("von") + 4, totalSearchResult.indexOf("Ergebnissen") - 1);
};
