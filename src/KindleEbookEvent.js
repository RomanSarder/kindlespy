/**
 * Created by Jang on 4/28/14.
 */

var ParentUrl;
var SiteParser;

$(window).ready(function () {
    var Url = location.href;
    ParentUrl = Url;
    SiteParser = GetSiteParser(Url);
    if (ParentUrl.indexOf("/ref=") >= 0)
    {
        var _Pos = Url.lastIndexOf('/');
        ParentUrl = Url.substr(0, _Pos);
    }
    if(typeof  SiteParser=="undefined"){
        //setInterval("saveToLocalStorage()",10000);
    }
    if (Url.indexOf(SiteParser.MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0){

       return;
    }

    $("#nav-searchbar").submit(function()
    {
        chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false});
        chrome.runtime.sendMessage({type: "remove-settings", ParentUrl: ParentUrl});
        setTimeout("processWhenDone()", 1500);
    });

    if (IsAuthorPage()){
        scrapeAuthorPage(Url);
    }

    else if (IsSearchPage(Url)) {
        scrapeSearchPage(Url);
    }

    else if (IsBestSellersPage(Url)){
        scrapeBestSellersPage(Url);
    }
});
function saveToLocalStorage(){
    var d = new Date();
    var t = d.getTime();
    var storage = chrome.storage.local;

    storage.get({KeyIds: []}, function (result) {
       var KeyIds = result.KeyIds;
        KeyIds.push({timeValue: t});
        storage.set({KeyIds: KeyIds}, function () {
            storage.get('KeyIds', function (result) {
                console.log(result.KeyIds)
            });
        });
    });
    /*var myKey = 'myKey';

    var obj= {};

    obj[myKey] = t;

    storage.set(obj);

    storage.get(myTestVar,function(result){
        console.log(myTestVar,result);
        //console output = myVariableKeyName {myTestVar:'my test var'}
    });

    storage.get('myTestVar',function(result){
        console.log(result);
        //console output = {myTestVar:'my test var'}
    })*/
}
function IsAuthorPage(){
    return document.documentElement.innerHTML.indexOf(SiteParser.AreYouAnAuthorPattern) >= 0;
}

function IsSearchPage(Url){
    return Url.indexOf(SiteParser.MainUrl +"/s/")==0 && Url.indexOf("digital-text") > 0;
}

function IsBestSellersPage(Url){
    return (Url.indexOf(SiteParser.MainUrl +"/Best-Sellers-Kindle-Store") >= 0 && Url.indexOf("digital-text") > 0)
        || (Url.indexOf(SiteParser.MainUrl +"/gp/bestsellers") >= 0 && Url.indexOf("digital-text") > 0);
}

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
        if (typeof review !== "undefined" && review.length > 0)
            return review;

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

    $(responseText).find(".results").each(function() {
	    while( (result = $(this).find("#result_"+(startIndex+index))).length>0 ) {
            if(counter>=maxResults) break;
		    No[index] = startIndex + index + 1;
		    url[index] = $(result).find(".newaps a:first").attr("href");
		    if(!url[index]) url[index] = "";
            var kprice = $(result).find(".red.bld");

            price[index] = SiteParser.CurrencySign + "0.00";
            if($(kprice).next('span.sprKindleUnlimited').length>0 || ( $(kprice).length>0)){
                $.each(kprice, function( ind, elprice ) {
                    if($(elprice).next('span.sprKindleUnlimited').length>0) return;
                    var kindleprice = $(elprice).text().trim();
                    if(kindleprice!=undefined || kindleprice != null || kindleprice!=''){
                        price[index] = kindleprice;
                        return false;
                    }
                });
            }

		    review[index] = undefined; 

		    url[index] = url[index].replace("&amp;", "&");
		    url[index] = url[index].replace(" ", "%20");
		    index++;
            counter++;
	    }
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

            LoadAuthorResultPage(function(){
                LoadAuthorResultPage();
            });
        }
    });
}

function scrapeSearchPage(Url) {

	var Url = location.href;
	ParentUrl = Url;

	if (ParentUrl.indexOf("/s/") < 0) return;

	ParentUrl = Url.replace(/\&page=[0-9]*/i, "");

	chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

    LoadSearchResultsPage(function(){
        LoadSearchResultsPage();
    });
}

function scrapeBestSellersPage(Url){
    $.get(Url, function(responseText){
        if (responseText.indexOf("Kindle-Store-eBooks/") >= 0
            || (Url.indexOf(SiteParser.MainUrl + "/" + SiteParser.BestSellersUrl) >= 0
            && Url.indexOf("/digital-text/") >=0 ))
        {
            if (Url.indexOf("ref=zg_bs_fvp_p_f") < 0 && Url.indexOf("&tf=") < 0)
            {
                chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: true});
            }

            ParseBestSellersPage(responseText, ParentUrl, false);
            for (var i = 2; i <= 2; i++)
            {
                LoadBestSellersPage(i, 3000*i);
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
    var parser = new BookPageParser();
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
                    GoogleImageSearchUrl: pageData.googleImageSearchUrl
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


