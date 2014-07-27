
var defaultSetting = {
    "version": "0.0.0",
    "PullStatus": true,
    "CurrentUrl" : "",
    "Book":
        [
            {"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller"}
        ]
};

function getSetting()
{
    var a = localStorage.settings;
    return a = a ? JSON.parse(a) : defaultSetting
}

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
    // No tabs or host permissions needed!
    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
        function(tabs){
            //alert(tabs[0].url);
        }
    );
    //ParseEngine();
});


function RemoveSettings(url, parentUrl, IsFree)
{
    var setting = getSetting();

    var bookInfolen = setting.Book.length;

    //console.log(bookInfolen);

    var bIsFind = false;

    for (var i = bookInfolen - 1; i >=0 ; i--)
    {
        if (parentUrl === setting.Book[i].ParentUrl)
        {
            setting.Book.splice(i, 1);
        }
    }
    localStorage.settings = JSON.stringify(setting);
}

function SaveSettings(num, url, parentUrl, nextUrl, title, price, estsales, salesRecv, Reviews, salesRank, category, categoryKind)
{
    var setting = getSetting();

    var bookInfolen = setting.Book.length;

    //console.log(bookInfolen);

    var bIsFind = false;

    var nTmp = 0;
    for (var i = 0; i < bookInfolen; i++)
    {
        if (title === setting.Book[i].Title && categoryKind === setting.Book[i].CategoryKind)
        {
            console.log(nTmp++);
            //console.log("I have found");
            setting.Book[i].No = num;
            setting.Book[i].Title = title;
            setting.Book[i].Price = price;
            setting.Book[i].EstSales = estsales;
            setting.Book[i].SalesRecv = salesRecv;
            setting.Book[i].Reviews = Reviews;
            setting.Book[i].SalesRank = salesRank;
            setting.Book[i].Category = category;
            setting.Book[i].Url = url;

            bIsFind = true;
            //break;
        }

        //console.log(setting.Book[i]['Url']);
    }

    if (!bIsFind)
    {
        //console.log("I add new obj");
        var settingTmp = {"No": num, "Url": url, "ParentUrl": parentUrl, "NextUrl": nextUrl,  "Title": title, "Price": price, "EstSales": estsales, "SalesRecv": salesRecv, "Reviews": Reviews, "SalesRank": salesRank, "Category": category, "CategoryKind": categoryKind};

        setting.Book.push(settingTmp);
    }

    localStorage.settings = JSON.stringify(setting);
}

var MainUrlContent;
var CurrentTabUrl;
var CurrentTabID;

chrome.runtime.onMessage.addListener(onMessageReceived);

function onMessageReceived(b, a, d){

    if ("remove-settings" === b.type)
    {
        //console.log("update:", b);
        RemoveSettings(b.Url, b.ParentUrl, b.IsFree);
    }

    else if ("get-settings" === b.type)
    {
        d({
            settings: getSetting()
        });
    }

    else if ("save-settings" === b.type)
    {
        SaveSettings(b.No, b.URL, b.ParentURL, b.NextUrl, b.Title, b.Price, b.EstSales, b.SalesRecv, b.Reviews, b.SalesRank, b.Category, b.CategoryKind);
        console.log(getSetting());
    }
    else if ("set-current-Tab" === b.type)
    {
        //CurrentUrl = undefined;
        var tabURL = "Not set yet";
        chrome.tabs.query({active:true, lastFocusedWindow: true},function(tabs){
            if(tabs.length === 0) {
                d({});
                return;
            }
            tabURL = tabs[0].url;

            CurrentTabUrl = tabURL;
            CurrentTabID = tabs[0].id;
            //alert("Getting :" + CurrentTabUrl);
        });

        d({});
    }
    else if ("get-current-Tab" === b.type)
    {
        console.log("Test : 11" + CurrentTabUrl);
        d({URL: CurrentTabUrl, ID: CurrentTabID});
    }
    else if ("save-pull-setting" === b.type)
    {
        var setting = getSetting();
        setting.PullStatus = b.PullStatus;
        localStorage.settings = JSON.stringify(setting);
        d({});
    }
}

function ParseEngine()
{
    if (MainUrlContent == undefined)
    {
        chrome.extension.getBackgroundPage().console.log("aaaaaaaa");
        LoadAmazoneUrl("http://www.kindlespy.com/u/amazonkindle");
    }

    chrome.extension.getBackgroundPage().console.log(MainUrlContent);
}

function LoadAmazoneUrl(Url)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", Url);

    //alert(xhr.responseText);
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4){
            if (xhr.status == 200)
            {
                //chrome.extension.getBackgroundPage().console.log(xhr.responseText);
                MainUrlContent = xhr.responseText;
                return xhr.responseText;
            }
        }
    };

    xhr.send();
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
    //alert(defaultSetting.version);
    localStorage.settings = JSON.stringify(defaultSetting);
}