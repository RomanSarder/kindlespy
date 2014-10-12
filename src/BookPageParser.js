/**
 * Created by Andrey on 12.10.2014.
 */

function BookPageParser(){

}

BookPageParser.prototype.GetReviews = function(responseText) {
    var rl_reviews = $(responseText).find("#acr .acrCount a:first");
    return rl_reviews.length ? $(rl_reviews).text().trim() : "0";
};

BookPageParser.prototype.GetPrice = function(responseText) {
    //TODO: parse price from book page
    var priceBlock = $(responseText).find('#priceBlock b.priceLarge');
    return priceBlock ? priceBlock.text().trim() : "";
};

BookPageParser.prototype.GetSalesRank = function(responseText) {
    if (typeof responseText === "undefined" || responseText === "") return '0';

    var szPattern = SiteParser.AmazonBestSellersPattern;
    var pos = responseText.indexOf(szPattern);

    if (typeof pos === "undefined" || pos < 0)
        return '0';

    var szSalesRank = responseText.substr(pos + szPattern.length);
    szPattern = '>';
    pos = szSalesRank.indexOf(szPattern);

    if (typeof pos === "undefined" || pos < 0)
        return "0";

    var szSalesRank = szSalesRank.substr(pos + szPattern.length);
    szSalesRank = szSalesRank.trim();
    var szTmp = szSalesRank.split(' ');
    for (var i = 0; i < szTmp.length; i++) {
        if (szTmp[i].indexOf('#') >= 0) {
            szSalesRank = szTmp[i].substr(szTmp[i].indexOf('#') + 1);
            return szSalesRank;
        }
    }

    return '0';
};

BookPageParser.prototype.GetEstSale = function(salesRank) {
    var data = SiteParser.EstSalesScale;
    if (typeof salesRank === "undefined") return 1;
    var sale = salesRank.replace(SiteParser.ThousandSeparator, "");

    for (var i = 0; i < data.length; i++) {
        if (sale >= data[i].min && sale <= data[i].max) return data[i].EstSale;
    }

    return "0";
};

BookPageParser.prototype.GetSalesRecv = function(estsales, price) {
    if (typeof estsales === "undefined") return price;

    return estsales * price;
};

BookPageParser.prototype.GetPrintLength = function(responseText) {
    return parseInt($(responseText).find('#pageCountAvailable span').text()).toString();
};


BookPageParser.prototype.GetAuthor = function(responseText) {
    var tmpResponseText = ParseString(responseText, 'contributorNameTrigger', '>', '/a>');
    var author = ParseString(tmpResponseText, 'contributorNameTrigger', '>', '<');
    if ((author == '')||(author == 'undefined')){
        tmpResponseText = ParseString(responseText, "<div class=\"buying\">", 'parseasinTitle', "<span class=\"byLinePipe\">");
        author = ParseString(tmpResponseText , "<a", '>', '</a>');
    }
    return author;
};

BookPageParser.prototype.GetBookData = function(url, price, reviews, callback) {
    var siteParser = GetSiteParser(url);
    var _this = this;

    $.get(url, function (responseText) {
        var entryTitle = GetTitle(responseText);
        if (typeof entryTitle === "undefined" || entryTitle === "") entryTitle = GetAuthorTitle(responseText);
        if (typeof entryTitle === "undefined") return;
        if (typeof reviews === "undefined") reviews = _this.GetReviews(responseText);
        if (typeof price === "undefined") price = _this.GetPrice(responseText);

        var entrySalesRank = _this.GetSalesRank(responseText);
        var entryEstSale = _this.GetEstSale(entrySalesRank);
        var entryPrice = price;
        var realPrice = siteParser.ParsePrice(price);
        var entrySalesRecv = _this.GetSalesRecv(entryEstSale, realPrice);
        var entryPrintLength = _this.GetPrintLength(responseText);
        var entryAuthor = GetAuthor(responseText);
        var entryGoogleSearchUrl = GetGoogleSearchUrlByTitleAndAuthor(entryTitle, entryAuthor);
        GetGoogleImageSearchUrl(responseText, url, function (entryGoogleImageSearchUrl) {
            GetDateOfPublication(responseText, function (entryDateOfPublication) {
                if (typeof entryPrice === "undefined") entryPrice = "0";
                if (typeof entryEstSale === "undefined") entryPrice = "0";
                if (typeof entrySalesRecv == "undefined") entrySalesRecv = "0";
                if (typeof reviews === "undefined") reviews = "0";
                if (typeof entrySalesRank === "undefined" || entrySalesRank.length < 1) entrySalesRank = "1";
                if (typeof entryPrintLength === "undefined" || entryPrintLength == '' || entryPrintLength == "NaN") entryPrintLength = "n/a";
                if (typeof entryAuthor === "undefined" || entryAuthor.length < 1) entryAuthor = "n/a";

                callback({
                    title: entryTitle,
                    price: SiteParser.FormatPrice(realPrice),
                    estSale: entryEstSale,
                    salesRecv: entrySalesRecv,
                    reviews: reviews,
                    salesRank: entrySalesRank,
                    printLength: entryPrintLength,
                    author: entryAuthor,
                    dateOfPublication: entryDateOfPublication,
                    googleSearchUrl: entryGoogleSearchUrl,
                    googleImageSearchUrl: entryGoogleImageSearchUrl
                });
            });
        });
    });
};