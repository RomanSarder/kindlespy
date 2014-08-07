/**
 * Created by Jang on 4/28/14.
 */

var bDebug = false;

function ParseString(responseText, pattern, startchar, endchar)
{
    var pos = responseText.indexOf(pattern);
    if (pos < 0)
        return "";

    var str = responseText.substr(pos + pattern.length);

    pos = str.indexOf(startchar);

    if (pos < 0)
        return "";

    str = str.substr(pos + startchar.length);

    pos = str.indexOf(endchar);

    if (pos < 0)
        return "";

    return str.substr(0, pos).trim();
}

function getParameterByName(url, name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	    results = regex.exec(url);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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

function ParseEngine(responseText, parentUrl, IsFree)
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
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Seller"), 500*i); //continue to try other sizes after 1 sec
        }
    });
}

function LoadPage(url, parentUrl, IsFree)
{

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4){
            if (xhr.status == 200 && (typeof  xhr.responseText !== "undefined" || xhr.responseText.length > 1))
            {
                setTimeout(ParseEngine.bind(null, xhr.responseText, parentUrl, IsFree), 1000);
            }
        }
    }

    xhr.send();
}

function GetAuthorPageUrl(responseText)
{
    if(responseText.length<0) return "";
    var urls = responseText.match(/<a href=\"(.*)\".*><span .*>Kindle Edition<\/span>/);
    if(urls!=null) return urls[1];

    return ParseString(responseText, 'class="title"', 'href="', '">');
}	

function GetAuthorPrice(responseText)
{
    var str = responseText;
    var pos = 0;

    var strSplit = str.split("<tr class>");
    var bFind = false;
    for (var i = 0; i < strSplit.length; i++)
    {
        if (strSplit[i].toLowerCase().trim().indexOf("kindle edition") >= 0)
        {
            pos = strSplit[i].toLowerCase().trim().indexOf("kindle edition");

            str = strSplit[i].substr(pos);

            bFind = true;
            break;
        }
    }

    if (!bFind)
        return "0";

    pos = str.indexOf('$');

    while (pos >= 0)
    {
        str = str.substr(pos + 1);
        var _pos = str.indexOf('<');

        if (_pos >= 0)
        {
            var price = str.substr(0, _pos).trim();
            if (typeof price !== "undefined" && price.indexOf("0.00") < 0)
                return "$" + price;
        }

        pos = str.indexOf('$');
    }

    return "0";

}

function GetAuthorReview(responseText)
{
    return ParseString(responseText,'reviewsCount">', '">', '<');
}

function GetAuthorCategory(responseText)
{
    return ParseString(responseText, 'EntityName', '<b>', '</b>');
}

function GetKindleEditionRow(responseText) {
	var retval;
	$(responseText).find(".tp").find("tr").each(function() {
		if($(this).text().indexOf("Kindle Edition")>0)
		retval= $(this);
	});

	return retval;
}

function AuthorPageParse(startIndex, responseText, parentUrl)
{
    var pattern = 'id="result_';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category;

    var strResult;
    var nParagraph = 0;

    var index = 0;
    var bIsExist = [];

     
    $(responseText).find(".result").each(function() {
	    var krow = GetKindleEditionRow($(this));
	    if(typeof krow == "undefined") return;
	    No[index] = parseInt(index) + 1 + parseInt(startIndex);
            url[index] = $(krow).find(".tpType > a:first").attr("href");
	    review[index] = $(this).find(".reviewsCount > a:first").text();
	    if(!review[index]) review[index] = 0;
	    var kprice = $(krow).find(".toeOurPrice > a:first");
	    if(kprice.length<1) {
		    kprice = $(krow).find(".toePrice a#buyPrice:first");
	    }
	    price[index] = $(kprice).text();
	    url[index] = url[index].replace("&amp;", "&");
	    url[index] = url[index].replace(" ", "%20");
	    index++;
    });
    index=0;

    category = GetAuthorCategory(responseText).trim();

    if (typeof category === undefined || category.length < 1)
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
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Author"), 500*i); //continue to try other sizes after 1 sec
            }
        }
    });
}

function LoadAuthorPage(url, parentUrl)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4){
            if (xhr.status == 200 && (typeof  xhr.responseText !== "undefined" || xhr.responseText.length > 1))
            {
                setTimeout(AuthorPageParse.bind(null, 12, xhr.responseText, parentUrl), 1000);
            }
        }
    }

    xhr.send();
}


function ParseSearchPage(startIndex, responseText, parentUrl, search)
{
    var pattern = 'id="result_';
    var str = responseText;
    var pos = str.indexOf(pattern);

    var No = [];
    var url = [];
    var price = [];
    var review = [];
    var category=search;

    var strResult;
    var nParagraph = 0;

    var index = 0;
    var bIsExist = [];
    var result;


    $(responseText).find(".results").each(function() {

	    while( (result = $(this).find("#result_"+(startIndex+index))).length>0 ) {
		    if(startIndex + index>=40) break;
		    No[index] = startIndex + index + 1;
		    url[index] = $(result).find(".newaps a:first").attr("href");
		    if(!url[index]) url[index] = "";
		    var kprice = $(result).find(".red.bld");
		    price[index] = $(kprice).length>0? $(kprice).first().text():"$0.00"; 
		    review[index] = undefined; 

		    url[index] = url[index].replace("&amp;", "&");
		    url[index] = url[index].replace(" ", "%20");
		    index++;
	    }
    });

    if(index<1) return;


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
                setTimeout(fRun.bind(null, No[i], url[i], price[i], parentUrl, "", review[i], category, "Search"), 500*i); //continue to try other sizes after 1 sec
            }
        }
    });

    return;
}


function LoadSearchPage(url, parentUrl, i, search)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4){
            if (xhr.status == 200 && (typeof  xhr.responseText !== "undefined" || xhr.responseText.length > 1))
            {
                setTimeout(ParseSearchPage.bind(null, (i-1)*16, xhr.responseText, parentUrl, search), 1000);
            }
        }
    }

    xhr.send();
}

function scrapeSearchPage(Url) {

	var Url = location.href;
	var ParentUrl = Url;

	if (ParentUrl.indexOf("/s/") < 0) return;

	var ParentUrl = Url.replace(/\&page=[0-9]*/i, "");

	var xhr = new XMLHttpRequest();

	chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

	xhr.open("GET", ParentUrl);
	var search = getParameterByName(Url, "field-keywords");

	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200 && 
				(typeof xhr.responseText !== "undefined" || xhr.responseText.length>1)) {
					ParseSearchPage(0, xhr.responseText, ParentUrl, search);
					for (var i = 2; i <= 3; i++) {
						var NextPageUrl = ParentUrl + "&page="+i;
						setTimeout(LoadSearchPage.bind(null, NextPageUrl.trim(), ParentUrl, i, search), 3000 *parseInt(i));
					}
				}
	};

	xhr.send();

}

function processWhenDone() {
	var search = getParameterByName(location.href, "field-keywords");
	if(search.trim()=="" || $("#bcKwText").text() !== '"'+search+'"' || 
		$("#bcKwText").css("visibility")!= "visible")
		setTimeout("processWhenDone()", 500);
	else {
		var Url = location.href;
		var ParentUrl = Url;
		if (ParentUrl.indexOf("/s/") >= 0)
		{
			var _Pos = Url.lastIndexOf('/');
			ParentUrl = Url.replace(/\&page=[0-9]+/, "");
		}

		scrapeSearchPage(Url);
	}
}

var ParentUrl;
var MainUrl;
var ParamUrlBestSellers;

$(window).ready(function () {
	var Url = location.href;
	ParentUrl = Url;
    if(isAmazonCom(Url)){
        MainUrl = "http://www.amazon.com";
        ParamUrlBestSellers = "154606011";
    }else if(isAmazonCoUk(Url)){
        MainUrl = "http://www.amazon.co.uk";
        ParamUrlBestSellers = "341689031";
    }
	if (ParentUrl.indexOf("/ref=") >= 0)
	{
		var _Pos = Url.lastIndexOf('/');
		ParentUrl = Url.substr(0, _Pos);
	}

	if (Url.indexOf(MainUrl + "/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") >= 0)
		return;

	$("#nav-searchbar").submit(function() 
	{
		chrome.runtime.sendMessage({type: "save-pull-setting", PullStatus: false});
		chrome.runtime.sendMessage({type: "remove-settings", ParentUrl: ParentUrl});
		setTimeout("processWhenDone()", 1500);
	});

    if (document.documentElement.innerHTML.indexOf('Are You an Author') >= 0)
    {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", Url);


        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4)
            {
                if (xhr.status == 200 && (typeof  xhr.responseText !== "undefined" || xhr.responseText.length > 1))
                {
                    if (xhr.responseText.indexOf("Are You an Author") >= 0)
                    {
                        chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: false});

                        AuthorPageParse(0, xhr.responseText, ParentUrl);

                        var NextPageUrl = ParseString(xhr.responseText, 'class="pagnLink"', 'href="', '"');

                        if (typeof NextPageUrl === "undefined" || NextPageUrl.length < 1)
                            return;

                        if (NextPageUrl.indexOf('http') < 0)
                        {
                            NextPageUrl = NextPageUrl.replace("&amp;", "&");
                            NextPageUrl = NextPageUrl.replace(" ", "%20");
                            NextPageUrl = MainUrl + "/" + NextPageUrl;
                        }

                        LoadAuthorPage(NextPageUrl.trim(), ParentUrl);
                    }
                }
            }
        };

        xhr.send();
    }


    else if (Url.indexOf(MainUrl +"/s/")==0 && Url.indexOf("digital-text")>0) {
	    scrapeSearchPage(Url);
    }


    else if (Url.indexOf(MainUrl +"/Best-Sellers-Kindle-Store/zgbs/digital-text/ref=zg_bs_nav_0") < 0)
    {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", Url);
        xhr.onreadystatechange = function(){

            if (xhr.readyState == 4){

                if (xhr.status == 200 && (typeof xhr.responseText !== "undefined" || xhr.responseText.length > 1))
                {
                    if (xhr.responseText.indexOf("Kindle-Store-eBooks/") >= 0 || Url.indexOf(MainUrl +"/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/" + ParamUrlBestSellers) >= 0)
                    {
                        if (Url.indexOf("ref=zg_bs_fvp_p_f") < 0 && Url.indexOf("&tf=") < 0)
                        {
                            chrome.runtime.sendMessage({type:"remove-settings", Url: "", ParentUrl:ParentUrl, IsFree: true});
                        }
                        ParseEngine(xhr.responseText, ParentUrl, false);
                        for (var i = 2; i <= 2; i++)
                        {
                            var pageUrl = ParentUrl + "?pg=" + parseInt(i);
                            setTimeout(LoadPage.bind(null, pageUrl, ParentUrl, false), 3000 * parseInt(i));
                        }

                    }
                }
            }
        };

        xhr.send();
    }
});

function GetSalesRank(responseText)
{
    if (typeof responseText !== "undefined" && responseText.length > 1)
    {
        var szPattern;
        if(isAmazonCom(MainUrl)){
            szPattern = "Amazon Best Sellers Rank";
        }else if(isAmazonCoUk(MainUrl)){
            szPattern = "Amazon Bestsellers Rank";
        }
        var pos = responseText.indexOf(szPattern);

        if (typeof pos === "undefined" || pos < 0)
            return "0";

        var szSalesRank = responseText.substr(pos + szPattern.length);
        szPattern = '>';
        pos = szSalesRank.indexOf(szPattern);

        if (typeof pos === "undefined" || pos < 0)
            return "0";

        var szSalesRank = szSalesRank.substr(pos + szPattern.length);
        szSalesRank = szSalesRank.trim();
        var szTmp = szSalesRank.split(" ");
        for (var i = 0; i < szTmp.length; i++)
        {
            if (szTmp[i].indexOf('#') >= 0)
            {
                szSalesRank = szTmp[i].substr(szTmp[i].indexOf('#') + 1);
                return szSalesRank;
            }
        }

        return "0";
    }

    return "0";
}

function GetTitle(responseText)
{
    if (typeof responseText !== "undefined" && responseText.length > 1)
    {
        if(isAmazonCom(MainUrl)){
            return ParseString(responseText, "id=\"btAsinTitle\"", '>', '<');
        }else if(isAmazonCoUk(MainUrl)){
            return ParseString(responseText, "id=\"btAsinTitle\"", "<span style=\"padding-left: 0\">", '<span');
        }
        return "";
    }
}

function GetAuthorTitle(responseText)
{
    return ParseString(responseText, 'id="productTitle"', '>', '<');
}

function GetEstSale(salesRank)
{
    data = [
        {"min": 1, "max": 5, "EstSale": 120000},
        {"min": 6, "max": 10, "EstSale": 105000},
        {"min": 11, "max": 20, "EstSale": 90000},
        {"min": 21, "max": 35, "EstSale": 75000},
        {"min": 36, "max": 100, "EstSale": 55000},
        {"min": 101, "max": 200, "EstSale": 30000},
        {"min": 201, "max": 350, "EstSale": 12000},
        {"min": 351, "max": 500, "EstSale": 6000},
        {"min": 501, "max": 750, "EstSale": 4500},
        {"min": 751, "max": 1500, "EstSale": 3300},
        {"min": 1501, "max": 3000, "EstSale": 2550},
        {"min": 3001, "max": 4000, "EstSale": 2100},
        {"min": 4001, "max": 5000, "EstSale": 1700},
        {"min": 5001, "max": 6000, "EstSale": 1500},
        {"min": 6001, "max": 7000, "EstSale": 1250},
        {"min": 7001, "max": 8000, "EstSale": 1000},
        {"min": 8001, "max": 9000, "EstSale": 750},
        {"min": 9001, "max": 10000, "EstSale": 600},
        {"min": 10001, "max": 12000, "EstSale": 430},
        {"min": 12001, "max": 15000, "EstSale": 350},
        {"min": 15001, "max": 17500, "EstSale": 310},
        {"min": 17501, "max": 20000, "EstSale": 285},
        {"min": 20001, "max": 25000, "EstSale": 245},
        {"min": 25001, "max": 30000, "EstSale": 200},
        {"min": 30001, "max": 35000, "EstSale": 140},
        {"min": 35001, "max": 50000, "EstSale": 110},
        {"min": 50001, "max": 65000, "EstSale": 50},
        {"min": 65001, "max": 80000, "EstSale": 25},
        {"min": 80001, "max": 100000, "EstSale": 15},
        {"min": 100001, "max": 200000, "EstSale": 4},
        {"min": 200001, "max": 500000, "EstSale": 2},
        {"min": 500001, "max": -1, "EstSale": 1}
    ];

    if (typeof salesRank === "undefined")
        return 1;

    var sale = salesRank.replace(",", "");

    for (var i = 0; i < data.length; i++)
    {
        if (sale >= data[i].min && sale <= data[i].max)
        {
            return data[i].EstSale;
        }
    }

    return "0";
}

function GetSalesRecv(estsales, price)
{
    if (typeof price === "undefined")
        return 1;

    if (price.indexOf("Free") >= 0)
        return 0;

    if (typeof estsales === "undefined")
        return 1 * price;

    var realPrice = price.substr(1);

    return estsales * realPrice;
}
function GetPrintLength(responseText){
	return ParseString(responseText, "id='pageCountAvailable'", '<span>', 'pages');
}
function fRun(num, url, price, parenturl, nextUrl, reviews, category, categoryKind)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);


    xhr.onreadystatechange = function(){

        if (xhr.readyState == 4){
            if (typeof xhr.responseText !== "undefined" || xhr.responseText.length > 1)
            {
                var entryUrl = url;
                var entryParentUrl = parenturl;
                var entryTitle = GetTitle(xhr.responseText);
                var entryPrice = price;


                if (typeof entryPrice === "undefined" || entryPrice.length <= 1)
                    return;

                var entrySalesRank = GetSalesRank(xhr.responseText);
                var entryEstSale = GetEstSale(entrySalesRank);
                var entrySalesRecv = GetSalesRecv(entryEstSale, entryPrice);
				var entryPrintLength = GetPrintLength(xhr.responseText);
		
		if(typeof reviews === "undefined") {
			var rl_reviews = $(xhr.responseText).find("#acr .acrCount a:first");
			reviews = rl_reviews.length? $(rl_reviews).text():"0";

		}

                if (typeof entryTitle === "undefined" || entryTitle === "")
                {
                    entryTitle = GetAuthorTitle(xhr.responseText);
                }


                if (typeof entryTitle === "undefined")
                    return;


                if (typeof entryPrice === "undefined")
                    entryPrice = "0";


                if (typeof entryEstSale === "undefined")
                    entryPrice = "0";


                if (typeof entrySalesRecv == "undefined")
                    entrySalesRecv = "0";


                if (typeof reviews === "undefined")
                    reviews = "0";


                if (typeof  entrySalesRank === "undefined" || entrySalesRank.length < 1)
                    entrySalesRank = "1";
					
				if (typeof entryPrintLength === "undefined")
					entryPrintLength = "0";

                chrome.runtime.sendMessage({type:"get-settings"}, function(response){
                    if (response.settings.PullStatus) {
                        chrome.runtime.sendMessage({type: "save-settings", No: num, URL: entryUrl, ParentURL: entryParentUrl,
				NextUrl: nextUrl, Title: entryTitle, Price: entryPrice, EstSales: entryEstSale,
				SalesRecv: entrySalesRecv, Reviews: reviews, SalesRank: entrySalesRank,
				Category:category, CategoryKind: categoryKind,
				PrintLength:entryPrintLength});
		    }
                });
            }
        }
    };

    xhr.send();
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var page = request.page;
        var pageUrl = ParentUrl + "?pg=" + page;
        setTimeout(LoadPage.bind(null, pageUrl, ParentUrl, false), 0);
    });
function isAmazonCom(url){
    return (url.indexOf("www.amazon.com")!=-1);
}
function isAmazonCoUk(url){
    return (url.indexOf("www.amazon.co.uk")!=-1);
}