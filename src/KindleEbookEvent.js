/**
 * Created by Jang on 4/28/14.
 */

var ParentUrl;
var SiteParser;
var BookStore;

$(window).ready(function () {
    var Url = location.href;
    ParentUrl = Url;
    SiteParser = GetSiteParser(Url);
    BookStore = new BookStorage();
    BookStore.TrackData();
    setInterval("BookStore.TrackData()", 2*60*60*1000);

    if (SiteParser === undefined) return;
    if (Url.indexOf(SiteParser.MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0) return;

    if (ParentUrl.indexOf("/ref=") >= 0)
    {
        var _Pos = Url.lastIndexOf('/');
        ParentUrl = Url.substr(0, _Pos);
    }

    $("#nav-searchbar").submit(function()
    {
        chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false});
        chrome.runtime.sendMessage({type: "remove-settings", ParentUrl: ParentUrl});
        SearchResultsPager = undefined;
        setTimeout("processWhenDone()", 1500);
    });
    chrome.runtime.sendMessage({type: "set-type-page", TYPE: ''});
    if (IsAuthorPage()){
        scrapeAuthorPage(Url);
    }
    else if (IsSearchPage(Url)) {
        scrapeSearchPage(Url);
    }
    else if (IsBestSellersPage(Url)){
        scrapeBestSellersPage(Url);
    }
    else if (IsSingleBookPage(Url)){
        chrome.runtime.sendMessage({type: "set-type-page", TYPE: 'single'});
    }
});

function GetNoInfo(responseText)
{
    return ParseString(responseText, 'class="zg_rankNumber"', ">", ".");
}

function GetPriceInfo(responseText)
{
    return ParseString(responseText,'class="price"', ">", "<");
}

function GetPageUrl(responsneText)
{
    return ParseString(responsneText, 'class="zg_title"', 'href="', '"');
}

function GetReviewrInfo(responseText)
{
    var pattern = "a href";
    var str = responseText;
    var pos = str.indexOf(pattern);

    var review = "";

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        review = ParseString(str, "product-reviews", '>', '<');
        if (typeof review !== "undefined" && review.length > 0) return review;

        pos = str.indexOf(pattern);
    }

    return "0";
}

function GetCategoryInfo(responseText)
{
    return ParseString(responseText, 'class="category"', '>', '<');
}

function ParseBestSellersPage(responseText, parentUrl, IsFree)
{
    var pattern = 'class="zg_itemImmersion"';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var index = 0;
    var bIsExist = [];
    category = GetCategoryInfo(str).trim();

    while (pos >= 0)
    {
        str = str.substr(pos + pattern.length);

        No[index] = GetNoInfo(str);
        url[index] = GetPageUrl(str);
        price[index] = GetPriceInfo(str);
        review[index] = GetReviewrInfo(str);

        pos = str.indexOf(pattern);
        index++;
    }

    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                continue;
            if (response.settings.PullStatus)
                setTimeout(parseDataFromBookPageAndSend.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Seller"), 500*i); //continue to try other sizes after 0.5 sec
        }
    });
}

function LoadBestSellersUrl(url, parentUrl, IsFree)
{
    $.get(url, function(responseText){
        setTimeout(ParseBestSellersPage.bind(null, responseText, parentUrl, IsFree), 1000);
    });
}

function GetAuthorCategory(responseText)
{
    return ParseString(responseText, 'EntityName', '<b>', '</b>');
}

function ParseAuthorPage(startIndex, maxResults, responseText, parentUrl)
{
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var counter = 0;
    var index = 0;

    $(responseText).find(".results").children().each(function() {
        if(this.id == "result_"+(startIndex+counter)) {
            if(counter>=maxResults) return;
            var krow = SiteParser.GetKindleEditionRow($(this));
            No[index] = parseInt(index) + 1 + parseInt(startIndex);
            if(typeof krow == "undefined"){
                counter++;
                return;
            }

            url[index] = SiteParser.GetUrlFromKindleEditionRow(krow);
            review[index] = SiteParser.GetReviewsCountFromResult($(this));
            if(!review[index]) review[index] = "0";
		    var kprice = SiteParser.GetPriceFromKindleEditionRow(krow);
		    if(kprice.length<1) {
			    kprice = $(krow).find(".toePrice a#buyPrice:first");
	    	}
	    	price[index] = $(kprice).text().trim();
            url[index] = url[index].replace("&amp;", "&");
            url[index] = url[index].replace(" ", "%20");
            counter++;
            index++;
        }
    });
    if(counter == 0) return undefined;

    category = GetAuthorCategory(responseText).trim();

    if (typeof category === "undefined" || category.length < 1)
    {
        category = $(responseText).find("#entityHeader").text().trim();
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }

    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                 continue;

            if (typeof price[i] === "undefined" || price[i].length < 1)
                continue;

            if (response.settings.PullStatus)
            {
                setTimeout(parseDataFromBookPageAndSend.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Author"), 500*i); //continue to try other sizes after 0.5 sec
            }
        }
    });

    return index;
}

function ParseSearchPage(startIndex, maxResults, responseText, parentUrl, search)
{
    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category=search;

    var index = 0;
    var counter = 0;
    var result;

    var listItems = $.merge($(responseText).find("#centerPlus").has('.a-fixed-left-grid-inner'),
        $(responseText).find("#atfResults li").has('.a-fixed-left-grid-inner'));
    listItems = $.merge(listItems, $(responseText).find("#btfResults li").has('.a-fixed-left-grid-inner'));

    listItems.each(function() {
        if($(this).attr('id') !== 'result_'+(startIndex+index)
            && $(this).attr('id') !== 'centerPlus') return;
        result = $(this).find('.a-fixed-left-grid-inner');
        if(counter>=maxResults) return;
        No[index] = startIndex + index + 1;
        url[index] = $(result).find("a:first").attr("href");
        if(!url[index]) url[index] = "";
        var kprice = $(result).find('div').filter(function () {
            return $(this).text() == 'Kindle Edition' || $(this).children("a:contains('Kindle Edition')").length > 0;
        }).parent();
        price[index] = SiteParser.CurrencySign + "0" + SiteParser.DecimalSeparator + "00";
        if($(kprice).length > 0)
        var prices = kprice.find('span.s-price');
        var el_price;
        if (prices != undefined) {
            if ((prices.parent().parent().has('span.s-icon-kindle-unlimited').length > 0)
                || (prices.parent().has("span:contains('" + SiteParser.searchKeys[1] + "')").length > 0)) {
                el_price = $.grep(kprice.find('span.s-price'), function (element) {
                    return ($(element).parent().has("span:contains('" + SiteParser.searchKeys[0] + "')").length > 0);
                });
            }else if(prices.parent().parent().parent().has("h3:contains('Audible Audio Edition')").length > 0){ //Amazon Added Audible Audio Edition block
                el_price = $(prices[0]);
            }else if($(prices).length > 1){
                el_price = $(prices[0]);
            }else {
                el_price = kprice.find('span.s-price');
            }

            if( el_price.length > 0) price[index] = $(el_price).text().trim();
        }

        review[index] = undefined;

        url[index] = url[index].replace("&amp;", "&");
        url[index] = url[index].replace(" ", "%20");
        index++;
        counter++;
    });
    if(counter == 0) return undefined;

    if (typeof category === undefined /*|| category.length < 1*/)
    {
        category = ParseString(responseText, 'entityHeader', '>', '<');
        var tmpSplit =category.split("by");
        if (tmpSplit.length > 1)
            category = tmpSplit[1];
    }

    chrome.runtime.sendMessage({type:"get-settings"}, function(response){
        for (var i = 0; i < url.length; i++)
        {
            if (typeof url[i] === "undefined" || url[i].length < 1)
                 continue;

            if (typeof price[i] === "undefined" || price[i].length < 1)
                continue;

	    var purl = location.href;
    	    purl = purl.replace(/\&page=[0-9]+/, "");

            if (response.settings.PullStatus && parentUrl === purl)
            {
                setTimeout(parseDataFromBookPageAndSend.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Search"), 1000*i); //continue to try other sizes after 0.5 sec
            }
        }
    });

    return index;
}

function scrapeAuthorPage(Url){
    $.get(Url, function(responseText){
        if (responseText.indexOf(SiteParser.AreYouAnAuthorPattern) >= 0)
        {
            chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

            LoadAuthorResultPage(function(){});
        }
    });
}

function scrapeSearchPage(Url) {

	var Url = location.href;
	ParentUrl = Url;

	if (ParentUrl.indexOf("/s/") < 0) return;

	ParentUrl = Url.replace(/\&page=[0-9]*/i, "");

	chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

    LoadSearchResultsPage(function(){});
}

function scrapeBestSellersPage(Url){
    var flag = false;
    $.get(Url, function(responseText){
        for(var bestSellerUrlKey in SiteParser.BestSellersUrls ){
            if (flag) break;
            if ((responseText.indexOf("Kindle-Store-eBooks/") >= 0)
                || (Url.indexOf(SiteParser.MainUrl + "/" + SiteParser.BestSellersUrls[bestSellerUrlKey]) >= 0 && Url.indexOf("/digital-text/") >=0 ))
            {
                flag = true;
                if (Url.indexOf("ref=zg_bs_fvp_p_f") < 0 && Url.indexOf("&tf=") < 0)
                {
                    chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: true});
                }

                ParseBestSellersPage(responseText, ParentUrl, false);
            }
        }
    });
}

function processWhenDone() {
	var search = GetParameterByName(location.href, "field-keywords");
	if(search.trim()=="" || $("#bcKwText").text() !== '"'+search+'"' || 
		$("#bcKwText").css("visibility")!= "visible")
		setTimeout("processWhenDone()", 500);
	else {
		var Url = location.href;
		ParentUrl = Url;
		if (ParentUrl.indexOf("/s/") >= 0)
		{
			var _Pos = Url.lastIndexOf('/');
			ParentUrl = Url.replace(/\&page=[0-9]+/, "");
		}

		scrapeSearchPage(Url);
	}
}

function parseDataFromBookPageAndSend(num, url, price, parenturl, nextUrl, reviews, category, categoryKind)
{
    var parser = new BookPageParser(url);
    parser.GetBookData(url, price, reviews, function(pageData) {
        chrome.runtime.sendMessage({type: "get-settings"}, function (response) {
            if (response.settings.PullStatus) {
                chrome.runtime.sendMessage({
                    type: "save-settings",
                    No: num,
                    URL: url,
                    ParentURL: parenturl,
                    NextUrl: nextUrl,
                    Title: pageData.title,
                    Description: pageData.description,
                    Price: pageData.price,
                    EstSales: pageData.estSale,
                    SalesRecv: pageData.salesRecv,
                    Reviews: pageData.reviews,
                    SalesRank: pageData.salesRank,
                    Category: category,
                    CategoryKind: categoryKind,
                    PrintLength: pageData.printLength,
                    Author: pageData.author,
                    DateOfPublication: pageData.dateOfPublication,
                    GoogleSearchUrl: pageData.googleSearchUrl,
                    GoogleImageSearchUrl: pageData.googleImageSearchUrl,
                    Rating: pageData.rating
                });
            }
        });
    });
}

function LoadBestSellersPage(pageNumber, delay){
    delay = ValueOrDefault(delay, 0);
    var pageUrl = ParentUrl + "?pg=" + pageNumber;
    setTimeout(LoadBestSellersUrl.bind(null, pageUrl, ParentUrl, false), delay);
}

var SearchResultsPager;
function LoadSearchResultsPage(callback){
    var itemsPerPage = SiteParser.SearchResultsNumber;
    var search = GetParameterByName(ParentUrl, "field-keywords");

    if(SearchResultsPager === undefined) {
        SearchResultsPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, ParentUrl){
            return ParseSearchPage(startFromIndex, maxResults, responseText, ParentUrl, search);
        }, function(url, page){
            return url + '&page=' + page;
        });
    }

    setTimeout(SearchResultsPager.LoadNextPage.bind(SearchResultsPager, callback), 1000);
}

var AuthorPager;
function LoadAuthorResultPage(callback){
    var itemsPerPage = SiteParser.AuthorResultsNumber;

    if(AuthorPager === undefined) {
        AuthorPager = new Pager(itemsPerPage, function(startFromIndex, maxResults, responseText, ParentUrl){
            return ParseAuthorPage(startFromIndex, maxResults, responseText, ParentUrl);
        }, function(url, page){
            return url + '?page=' + page;
        });
    }

    AuthorPager.LoadNextPage(callback);
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var pageNumber = request.page;
        if(IsAuthorPage()){
            LoadAuthorResultPage();
        }
        else if (IsBestSellersPage(ParentUrl)){
            LoadBestSellersPage(pageNumber);
        }
        else if(IsSearchPage(ParentUrl)){
            LoadSearchResultsPage();
        }
    });


