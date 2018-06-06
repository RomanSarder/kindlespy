/**
 * Created by Andrey Klochkov on 11.09.2014.
 * class AmazonComParser
 */

function AmazonDeParser(){
    this.mainUrl = "//www.amazon." + AmazonDeParser.zone;
    // Amazon.de uses api from amazon.co.uk
    this.completionUrl = "//completion.amazon." + AmazonCoUkParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=4";
    this.region = AmazonDeParser.region;
    this.areYouAnAuthorPattern = "Sind Sie ein Autor";
    this.free = 'gratis';
    this.currencySign = "&euro;";
    this.currencySignForExport = "\u20AC";
    this.thousandSeparator = ".";
    this.decimalSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankDiv').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 16;
    this.publisher = "Verlag";
    this.searchKeys = ["kaufen","to rent"];
    this.numberSign = "#";
    this.searchPattern = "Kindle Edition";
    this.bestSellersPatternStart = 'class="zg_itemImmersion"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 14;
}

AmazonDeParser.zone = "de";
AmazonDeParser.region = "DE";

AmazonDeParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle>span').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
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
    if(price.toLowerCase() == this.free) return 0;
    if(!price) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonDeParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonDeParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#ebooksImgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonDeParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#summaryStars a").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (!(typeof rl_reviews === 'undefined' || rl_reviews.length == 0)) {
        return rl_reviews[1].nodeValue.replace('Rezensionen', '').replace('Rezension', '').trim();
    }
    rl_reviews = responseText.find("#acrCustomerReviewText");
    if(!(typeof rl_reviews === 'undefined' || rl_reviews.length == 0)) {
        return $(rl_reviews).text().replace('Kundenrezensionen', '').replace('Kundenrezension', '').trim();
    }
    rl_reviews = responseText.find("#cmrs-atf");
    return rl_reviews.length ? $(rl_reviews).text().replace('Kundenrezensionen auf Amazon.com', '').trim() : "0";
};

AmazonDeParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span:contains('von')");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    return ratingString.text().split("von")[0].trim();
};

AmazonDeParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("von") != -1 ? totalSearchResult.indexOf("von") + 4 : 0;
    var positionEnd = totalSearchResult.indexOf("Ergebnissen") != -1 ? totalSearchResult.indexOf("Ergebnissen") - 1 : totalSearchResult.indexOf("Ergebnisse") - 1;
    return totalSearchResult.substring(positionStart, positionEnd);
};

AmazonDeParser.prototype.getPrintLength = function(responseText){
    var printLengthNodes = responseText.find("#productDetailsTable li:contains('Print-Ausgabe:')").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof printLengthNodes === 'undefined' || printLengthNodes.length == 0) return '';
    return printLengthNodes[0].nodeValue.replace('Seiten','').trim();
};

AmazonDeParser.prototype.getPrice = function(responseText){
    var price = responseText.find(".swatchElement:contains('Kindle Edition') .a-button-inner .a-color-price");
    if(typeof price === 'undefined' || price.length == 0) return '';
    return price.text().trim();
};

AmazonDeParser.prototype.getAuthor = function(responseText){
    var author = responseText.find(".author .contributorNameID");
    if(author.length === 0) author = responseText.find(".author .a-link-normal");
    if(typeof author === 'undefined' || author.length == 0) return '';
    return author.text().trim();
};
