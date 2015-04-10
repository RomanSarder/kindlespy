/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCaParser
 */

function AmazonCaParser(){
    this.MainUrl = "http://www.amazon." + AmazonCaParser.Zone;
    // Amazon.ca uses api from amazon.com
    this.CompletionUrl = "http://completion.amazon." + AmazonComParser.Zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=7";
    this.Region = AmazonCaParser.Region;
    this.ParamUrlBestSellers = "2980423011";
    this.Free = 'Free';
    this.CurrencySign = "$";
    this.CurrencySignForExport = "$";
    this.DecimalSeparator = ".";
    this.ThousandSeparator = ",";
    this.SearchResultsNumber = 16;
    this.AuthorResultsNumber = 16;
    this.Publisher = "Publisher";
    this.searchKeys = ["to buy","to rent"];
    this.NumberSign = "#";
    this.SearchPattern = "Kindle Edition";
    this.EstSalesScale = [
        {"min": 1, "max": 5, "EstSale": 67200},
        {"min": 6, "max": 10, "EstSale": 58800},
        {"min": 11, "max": 20, "EstSale": 50400},
        {"min": 21, "max": 35, "EstSale": 42000},
        {"min": 36, "max": 100, "EstSale": 30800},
        {"min": 101, "max": 200, "EstSale": 16800},
        {"min": 201, "max": 350, "EstSale": 6720},
        {"min": 351, "max": 500, "EstSale": 3360},
        {"min": 501, "max": 750, "EstSale": 2520},
        {"min": 751, "max": 1500, "EstSale": 1848},
        {"min": 1501, "max": 3000, "EstSale": 1428},
        {"min": 3001, "max": 4000, "EstSale": 1176},
        {"min": 4001, "max": 5000, "EstSale": 952},
        {"min": 5001, "max": 6000, "EstSale": 840},
        {"min": 6001, "max": 7000, "EstSale": 700},
        {"min": 7001, "max": 8000, "EstSale": 560},
        {"min": 8001, "max": 9000, "EstSale": 420},
        {"min": 9001, "max": 10000, "EstSale": 336},
        {"min": 10001, "max": 12000, "EstSale": 241},
        {"min": 12001, "max": 15000, "EstSale": 196},
        {"min": 15001, "max": 17500, "EstSale": 174},
        {"min": 17501, "max": 20000, "EstSale": 160},
        {"min": 20001, "max": 25000, "EstSale": 137},
        {"min": 25001, "max": 30000, "EstSale": 112},
        {"min": 30001, "max": 35000, "EstSale": 78},
        {"min": 35001, "max": 50000, "EstSale": 62},
        {"min": 50001, "max": 65000, "EstSale": 28},
        {"min": 65001, "max": 80000, "EstSale": 14},
        {"min": 80001, "max": 100000, "EstSale": 8},
        {"min": 100001, "max": 200000, "EstSale": 2},
        {"min": 200001, "max": 500000, "EstSale": 1},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];
}

AmazonCaParser.Zone = "ca";
AmazonCaParser.Region = "CA";

AmazonCaParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (titleNodes === undefined || titleNodes.length == 0) return '';
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
    if(price == this.Free) return 0;
    if(!price) return 0;
    return price.substr(4);
};

AmazonCaParser.prototype.formatPrice = function(price) {
    return this.CurrencySign + price;
};

AmazonCaParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    return callback(responseText.find('#main-image').attr('rel'));
};

AmazonCaParser.prototype.getImageUrlSrc = function(responseText) {
    return ParseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonCaParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length)
        return $(rl_reviews).text().replace('reviews','').replace('review','').trim();
    else
        return  "0";
};

AmazonCaParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#revSum .acrRating:contains('out of')");
    if(ratingString === undefined && ratingString =='') return undefined;
    return ratingString.text().split("out of")[0].trim();
};

AmazonCaParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    return totalSearchResult.substring(totalSearchResult.indexOf("of") + 3, totalSearchResult.indexOf("results") - 1);
};
