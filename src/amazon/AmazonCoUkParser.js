/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonCoUkParser
 */

function AmazonCoUkParser(){
    this.mainUrl = "//www.amazon." + AmazonCoUkParser.zone;
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=3";
    this.region = AmazonCoUkParser.region;
    this.areYouAnAuthorPattern = "Are You an Author";
    this.free = 'free';
    this.currencySign = "&pound;";
    this.currencySignForExport = "\u00A3";
    this.thousandSeparator = ",";
    this.decimalSeparator = ".";
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
    this.estSalesPercentage = 23;
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
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonCoUkParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonCoUkParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonCoUkParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#summaryStars a").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (!(typeof rl_reviews === 'undefined' || rl_reviews.length == 0)) {
        return rl_reviews[1].nodeValue.replace('reviews','').replace('review','').replace('customer','').trim();
    }

    rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('customer reviews','').replace('customer review','').trim() : "0";
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

AmazonCoUkParser.prototype.getPrintLength = function(responseText){
    var printLengthNodes = responseText.find("#productDetailsTable li:contains('Print Length:')").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes === 'undefined' || printLengthNodes.length == 0) return '';
    return printLengthNodes[0].nodeValue.replace('pages','').trim();
};

AmazonCoUkParser.prototype.getPrice = function(responseText){
    var price = responseText.find(".swatchElement:contains('Kindle Edition') .a-button-inner .a-color-price");
    if(typeof price === 'undefined' || price.length == 0) return '';
    return price.text().trim();
};

AmazonCoUkParser.prototype.getAuthor = function(responseText){
    var author = responseText.find(".author .contributorNameID");
    if(typeof author === 'undefined' || author.length == 0) return '';
    return author.text().trim();
};