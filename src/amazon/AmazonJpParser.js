﻿/**
 * Created by Andrey Klochkov on 03.10.2016.
 * class AmazonJpParser
 */

function AmazonJpParser(){
    this.mainUrl = "//www.amazon." + AmazonJpParser.zone;
    this.completionUrl = "//completion.amazon." + AmazonJpParser.zone + "/search/complete?method=completion&search-alias=digital-text&client=amazon-search-ui&mkt=6";
    this.region = AmazonJpParser.region;
    this.areYouAnAuthorPattern = "著者ページについて";
    this.free = '無料';
    this.currencySign = "￥";
    this.currencySignForExport = "￥";
    this.decimalSeparator = ".";
    this.thousandSeparator = ",";
    // dynamic number, depends on old or new design
    // should be 20 or 50 items per page
    this.bestSellerResultsNumber = $('.zg_rankLine').length || $('.zg-badge-text').length;
    this.searchResultsNumber = 16;
    this.authorResultsNumber = 24;
    this.publisher = "出版社";
    this.searchKeys = ["to buy","to rent"]; //?
    this.numberSign = "位";
    this.searchPattern = "Kindle版";
    this.bestSellersPatternStart = 'class="zg_item_compact"';
    this.bestSellersPatternEnd = 'class="zg_clear"';
    this.estSalesPercentage = 9;
}

AmazonJpParser.zone = "co.jp";
AmazonJpParser.region = "JP";

AmazonJpParser.prototype.getTitle = function(responseText){
    var titleNodes = responseText.find('#btAsinTitle').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof titleNodes === 'undefined' || titleNodes.length == 0) return '';
    return titleNodes[0].nodeValue.trim();
};

AmazonJpParser.prototype.getDescription = function(jqNodes){
    var description = jqNodes.find("#bookDescription_feature_div noscript");
    if (description.length > 0) return $(description.text()).text().trim();

    return jqNodes.find("#outer_postBodyPS").text().trim();
};

AmazonJpParser.prototype.getKindleEditionRow = function(jqNode) {
    var _this = this;
    var retval;
    jqNode.find(".tp").find("tr").each(function() {
        if($(this).text().indexOf(_this.searchPattern)>0)
            retval= $(this);
    });

    return retval;
};

AmazonJpParser.prototype.getUrlFromKindleEditionRow = function(kindleEditionRow) {
    return kindleEditionRow.find(".tpType > a:first").attr("href");
};

AmazonJpParser.prototype.getPriceFromKindleEditionRow = function(kindleEditionRow) {
    var priceTag = kindleEditionRow.find(".toeOurPrice > a:first");
    if (priceTag.length > 0) return priceTag;
    return kindleEditionRow.find(".toeOurPriceWithRent > a:first");
};

AmazonJpParser.prototype.getReviewsCountFromResult = function(resultItem) {
    return resultItem.find(".reviewsCount > a:first").text();
};

AmazonJpParser.prototype.parsePrice = function(price) {
    if(!price) return 0;
    if(price.toLowerCase() == this.free) return 0;
    return Helper.parseFloat(price, this.decimalSeparator);
};

AmazonJpParser.prototype.formatPrice = function(price) {
    return this.currencySign + price;
};

AmazonJpParser.prototype.getGoogleImageSearchUrlRel = function(responseText, url, callback) {
    var dataImage = responseText.find('#imgBlkFront').attr('data-a-dynamic-image');
    if(typeof dataImage === 'undefined') return callback('undefined');
    var jsonStringImage = JSON.parse(dataImage);
    var srcImageArray = Object.keys(jsonStringImage);
    return callback(srcImageArray.length > 0 ? srcImageArray[0]: 'undefined');
};

AmazonJpParser.prototype.getImageUrlSrc = function(responseText) {
    return Helper.parseString(responseText.find('#holderMainImage noscript').text(),"src=","\"", "\" ");
};

AmazonJpParser.prototype.getReviews = function(responseText) {
    var rl_reviews = responseText.find("#acr .acrCount a:first");
    if (rl_reviews.length > 0)
        return $(rl_reviews).text().trim();

    rl_reviews = responseText.find("#acrCustomerReviewText");
    return rl_reviews.length ? $(rl_reviews).text().replace('件のカスタマーレビュー','').replace('件カスタマーレビュー','').replace('customer reviews','').replace('customer review','').trim() : "0";
};

AmazonJpParser.prototype.getRating = function(responseText){
    var ratingString = responseText.find("#avgRating span");
    if (ratingString.length === 0)
        ratingString = responseText.find("#acrPopover");
    if (typeof ratingString === 'undefined' && ratingString =='') return undefined;
    var ratingStringRightPart = ratingString.text().split("つ星のうち")[1];
    return ratingStringRightPart == null ? null : ratingStringRightPart.trim();
};

AmazonJpParser.prototype.getTotalSearchResult = function(responseText){
    var totalSearchResult = responseText.find("#s-result-count").text();
    var positionStart = totalSearchResult.indexOf("検索結果") != -1 ? totalSearchResult.indexOf("検索結果") + 4 : 0;
    var result = totalSearchResult.substring(positionStart, totalSearchResult.indexOf("件中")).trim();
    if(result !== '') return result;
    return totalSearchResult.substring(0, totalSearchResult.indexOf("件の結果")).trim();
};

AmazonJpParser.prototype.getPrintLength = function(jqNodes) {
    var link = jqNodes.find('#aboutEbooksSection span a:first');
    if (link.length > 0)
        return parseInt(link.text()).toString();

    var text = jqNodes.find('#productDetailsTable .content li:contains(紙の本の長さ)').contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if(text.length > 0){
        return parseInt(text[0].nodeValue).toString();
    }

    return null;
};

AmazonJpParser.prototype.getAuthor = function(jqNodes) {
    var contributorNameId = jqNodes.find('#byline a.contributorNameID');
    if (contributorNameId.length > 0)
        return contributorNameId.text().trim();

    var link = jqNodes.find('#byline span.author a:first');
    if (link.length > 0)
        return link.text().trim();

    return null;
};

AmazonJpParser.prototype.getPrice = function(jqNodes) {
    var node = jqNodes.find('#tmmSwatches .a-button-text span:contains("Kindle")').next().next();
    var priceNodes = $(node.find('.a-color-price')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes !== 'undefined' && priceNodes.length !== 0) return priceNodes[0].nodeValue.trim();

    priceNodes = $(node.find('span')).contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });

    if (typeof priceNodes === 'undefined' || priceNodes.length === 0) return null;

    return priceNodes[0].nodeValue.trim();
};

AmazonJpParser.prototype.getSalesRank = function(jqNodes) {
    var salesRankNodes = jqNodes.find("#SalesRank").contents().filter(function(){
        return this.nodeType == Node.TEXT_NODE;
    });
    if (typeof salesRankNodes === 'undefined' || salesRankNodes.length < 2) return '0';
    var salesRankString = salesRankNodes[1].nodeValue.trim();
    if ((typeof salesRankString === 'undefined') || (salesRankString == "")) return '0';
    var parts = salesRankString.substring(0, salesRankString.indexOf(this.numberSign)).split('-');
    return parts[parts.length-1];
};
