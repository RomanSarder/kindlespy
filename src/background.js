
var defaultSetting = {
    "version": "0.0.0",
    "PullStatus": true, // unknown usage
    "IsPulling" : false,
    "CurrentUrl" : "",
    "PageNum" : {MainTab: "1", KeywordAnalysisTab: "1"},
    "MainUrl": "http://www.amazon.com/",
    "ParamUrlBestSellers" : "154606011",
    "TYPE" : "", // can be 'single' or empty
    "Book":
        [
            //{"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Description":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller", "PrintLength":"", "Author":"", "DateOfPublication":"", "GoogleSearchUrl":"", "GoogleImageSearchUrl":"", "Rating":""}
        ]
};

function getSetting()
{
	var a = localStorage.settings;
    return a = a ? JSON.parse(a) : defaultSetting
}

function RemoveSettings(url, parentUrl, IsFree)
{
    var setting = getSetting();

    var bookInfolen = setting.Book.length;


    var bIsFind = false;

    for (var i = bookInfolen - 1; i >=0 ; i--)
    {
        if (parentUrl === setting.Book[i].ParentUrl)
        {
            setting.Book.splice(i, 1);
        }
    }
    setting = defaultSetting;
    localStorage.settings = JSON.stringify(setting);
}

function SaveSettings(num, url, parentUrl, nextUrl, title, description, price, estsales, salesRecv, Reviews, salesRank, category, categoryKind, printLength, author, dateOfPublication, googleSearchUrl, googleImageSearchUrl, rating)
{
	var setting = getSetting();

    var bookInfolen = setting.Book.length;


    var bIsFind = false;

    var nTmp = 0;
    for (var i = 0; i < bookInfolen; i++)
    {
        if (title === setting.Book[i].Title && categoryKind === setting.Book[i].CategoryKind)
        {
            setting.Book[i].No = num;
            setting.Book[i].Title = title;
            setting.Book[i].Description = description;
            setting.Book[i].Price = price;
            setting.Book[i].EstSales = estsales;
            setting.Book[i].SalesRecv = salesRecv;
            setting.Book[i].Reviews = Reviews;
            setting.Book[i].SalesRank = salesRank;
            setting.Book[i].Category = category;
            setting.Book[i].Url = url;
			setting.Book[i].PrintLength = printLength;
            setting.Book[i].Author = author;
            setting.Book[i].DateOfPublication = dateOfPublication;
            setting.Book[i].GoogleSearchUrl = googleSearchUrl;
            setting.Book[i].GoogleImageSearchUrl = googleImageSearchUrl;
            setting.Book[i].Rating = rating;

            bIsFind = true;
            //break;
        }

    }

    if (!bIsFind)
    {
        var settingTmp = {"No": num, "Url": url, "ParentUrl": parentUrl, "NextUrl": nextUrl,  "Title": title, "Description": description, "Price": price, "EstSales": estsales, "SalesRecv": salesRecv, "Reviews": Reviews, "SalesRank": salesRank, "Category": category, "CategoryKind": categoryKind, "PrintLength": printLength, "Author":author, "DateOfPublication":dateOfPublication, "GoogleSearchUrl":googleSearchUrl, "GoogleImageSearchUrl":googleImageSearchUrl, "Rating":rating};

        setting.Book.push(settingTmp);
    }

    localStorage.settings = JSON.stringify(setting);
}

function SavePageNum(pageNum, tabName)
{
    var setting = getSetting();
    setting.PageNum[tabName] = pageNum;
    localStorage.settings = JSON.stringify(setting);
}
function SaveUrlParams(url, urlParamBestSellers)
{
    var setting = getSetting();
    setting.MainUrl = url;
    setting.ParamUrlBestSellers = urlParamBestSellers;
    localStorage.settings = JSON.stringify(setting);
}

var MainUrlContent;
var CurrentTabUrl;
var CurrentTabID;

chrome.runtime.onMessage.addListener(onMessageReceived);

function onMessageReceived(b, a, callback){

    if ("remove-settings" === b.type)
    {
        RemoveSettings(b.Url, b.ParentUrl, b.IsFree);
        return callback({});
    }

    if ("get-settings" === b.type)
    {
        return callback({
            settings: getSetting()
        });
    }

    if ("save-settings" === b.type)
    {
        SaveSettings(b.No, b.URL, b.ParentURL, b.NextUrl, b.Title, b.Description, b.Price, b.EstSales, b.SalesRecv, b.Reviews, b.SalesRank, b.Category, b.CategoryKind, b.PrintLength, b.Author, b.DateOfPublication, b.GoogleSearchUrl, b.GoogleImageSearchUrl, b.Rating);
        return callback({});
    }

    if ("save-PageNum" === b.type)
    {
        SavePageNum(b.PageNum, b.tab);
        return callback({});
    }

    if ("get-PageNum" === b.type)
    {
        var setting = getSetting();
        return callback({PageNum:setting.PageNum[b.tab]});
    }

    if ("save-UrlParams" === b.type)
    {
        SaveUrlParams(b.MainUrl, b.ParamUrlBestSellers);
        return callback({});
    }

    if ("set-current-Tab" === b.type)
    {
        var tabURL = "Not set yet";
        chrome.tabs.query({active:true, lastFocusedWindow: true},function(tabs){
            if(tabs.length === 0) {
                callback({});
                return;
            }
            tabURL = tabs[0].url;

            CurrentTabUrl = tabURL;
            CurrentTabID = tabs[0].id;
        });

        return callback({});
    }

    if ("get-current-Tab" === b.type)
    {
        return callback({URL: CurrentTabUrl, ID: CurrentTabID});
    }

    if ("save-pull-setting" === b.type)
    {
        var setting = getSetting();
        setting.PullStatus = b.PullStatus;
        localStorage.settings = JSON.stringify(setting);
        return callback({});
    }

    if ("set-type-page" === b.type)
    {
        var setting = getSetting();
        setting.TYPE = b.TYPE;
        localStorage.settings = JSON.stringify(setting);
        return callback({});
    }

    if ("get-type-page" === b.type)
    {
        var setting = getSetting();
        return callback({TYPE:setting.TYPE});
    }

    if ("set-IsPulling" === b.type)
    {
        console.log('Set IsPulling:' + b.IsPulling);
        var setting = getSetting();
        setting.IsPulling = b.IsPulling;
        localStorage.settings = JSON.stringify(setting);
        return callback({});
    }

    if ("get-IsPulling" === b.type)
    {
        var setting = getSetting();
        return callback({IsPulling: setting.IsPulling});
    }
}

function getVersion() {
    var version = 'NaN';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
    xhr.send(null);
    var manifest = JSON.parse(xhr.responseText);
    return manifest.version;
}

var currentVersion = getVersion();
var savedVersion = getSetting().version;

if (typeof savedVersion === "undefined" || currentVersion !== savedVersion)
{
    defaultSetting.version = currentVersion;
    localStorage.settings = JSON.stringify(defaultSetting);
}
