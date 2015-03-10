var obj = [];
var clouds = [];
var CurrentPageUrl = "";
var refreshed = false;
var ActiveTab = new MainTab();
var IsErrorWindow = false;
var SiteParser;
var Storage = new BookStorage();
var columnGetterFunctions = [];
columnGetterFunctions['no'] = function(a){return parseInt(a.No)};
columnGetterFunctions['pageno'] = function(a){
    var printLength = parseInt(a.PrintLength);
    return isNaN(printLength) ? 0 : printLength;
};
columnGetterFunctions['title-book'] = function(a){return a.Title};
columnGetterFunctions['price'] = function(a){return parseFloat(a.Price.replace(/[^0-9\.]/g, ''))};
columnGetterFunctions['est-sales'] = function(a){return a.EstSales};
columnGetterFunctions['sales-rev'] = function(a){return a.SalesRecv};
columnGetterFunctions['reviews'] = function(a){return parseInt(a.Reviews.replace(/,/g,''))};
columnGetterFunctions['sales-rank'] = function(a){return parseInt(a.SalesRank.replace(/,/g,''))};

var currentSortColumn = 'no';
var currentSortDirection = 1; //1 = ask, -1 = desc

$(window).ready(function () {
    $('#LinkBackTo').click(function () {
        $('#data-body').css("overflow-y", "auto");
        ActiveTab = new MainTab();
        chrome.runtime.sendMessage({type: "set-type-page", TYPE: ''});
        frun();
    });
    $('#enableTracking').click(function () {
        $('#enableTracking').prop('disabled', true);
        $('#LinkBackTo').hide();
        var _this = this;
        Storage.EnableTracking($(_this).data().url, function() {
            $('#enableTracking').prop('disabled', false);
            $('#LinkBackTo').show();
            RankTrackingSingleShow($(_this).data().url);
        });
    });
    $('#disableTracking').click(function () {
        var _this = this;
        Storage.DisableTracking($(_this).data().url, function(bytesInUse) {
            RankTrackingSingleShow($(_this).data().url);
        });
    });
    $('.logo').click(function () {
        Storage.logger.GetCustomerID(function(result){
            alert("Your user id: " + result);
        });
    });
    $('#KWDConclusionImage').tooltipster({
        animation: 'fade',
        theme: 'tooltip-theme',
        maxWidth:200,
        updateAnimation: false,
        position: 'top'
    });
});

function resetCss(){
    // header
    $('#main-header').hide();
    $('#tracking-header').hide();

    // info
    $('.info.single_book').hide();
    $('.info.list_books').hide();
    $('.info.single_book .info-item').css('width', '');
    $('#infoPages').hide();

    //table
    $('.table-head').hide();

    // content
    $('#word-cloud-content').hide();
    $('#no-data-found-content').hide();
    $('#main-content').hide();
    $('#tracking-content').hide();
    $('.right-panel').hide();
    $('.left-panel').css('width', '');

    // footer
    $('#WordCloudFooter').hide();
    $('#BestSellersRankingFooter').hide();
    $('#NoDataFooter').hide();
    $('#ExportBtn').hide();
    $('#TrackedPanelFooter').hide();
    $('#BookTracked').hide();
    $('#totalReSalesRecvBlock').hide();
    $('#KWDConclusion').hide();
}

function AutoAddFunc()
{
    var url = CurrentPageUrl;
    var IsFreeUrl = false;
    var currentUrl = url;

    if (currentUrl.indexOf("ref=zg_bs_fvp_p_f") >= 0 || currentUrl.indexOf("&tf=") >= 0)
        IsFreeUrl = true;

    if(url.indexOf("/s/")>=0)
    {
       currentUrl = url.replace(/\&page=[0-9]+/, "");	
    }
    else if (url.indexOf("/ref=") >= 0)
    {
        var _Pos = url.lastIndexOf('/ref=');
        currentUrl = url.substr(0, _Pos);
    }
    chrome.runtime.sendMessage({type: "get-settings"}, function(response) {
        settings = response.settings;

        var settingLen = settings.Book.length;

        var settingInfo;
        while(obj.length > 0) {
            obj.pop();
        }
        for (var i = 0; i < settingLen; i++)
        {
            if (settings.Book[i].ParentUrl === currentUrl)
            {
                if (IsFreeUrl)
                {
                    if (settings.Book[i].Price.indexOf("Free") >= 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Description": settings.Book[i].Description, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl, "Rating": settings.Book[i].Rating };
                        obj.push(settingTmp);
                    }
                }
                else
                {
                    if (settings.Book[i].Price.indexOf("Free") < 0)
                    {
                        var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Description": settings.Book[i].Description, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl, "Rating": settings.Book[i].Rating };
                        obj.push(settingTmp);
                    }
                }
            }
        }

        obj.sort(compare);

        if (obj.length <= 0) return;
        if (!IsErrorWindow) {
            if (!refreshed && (ActiveTab.IsPaged)) {
                ActiveTab.InsertData(ActiveTab.PageNum - 1, obj, SiteParser);
            }
        } else {
            frun();
        }

    });

    if (!refreshed)
    {
        setTimeout(AutoAddFunc, 1000);
    }
}

function wordSort(a, b)
{
    if (parseInt(a.Len) < parseInt(b.Len))
        return -1;
    if (parseInt(a.Len) > parseInt(b.Len))
        return 1;
    return 0;
}

function shuffle(array) {
    var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function WordsInfoUpdate()
{
    var xPathRes = document.evaluate ( "/html/body/div/div/div/div/table/tbody/tr/td[2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var InnerTexts = "";

    if (xPathRes.length < 1)
        return;

    for (var i = 0; i < xPathRes.snapshotLength; i++) {
        if (i > ActiveTab.PageNum * 20)
            break;

        InnerTexts += xPathRes.snapshotItem (i).innerText + " ";
    }

    InnerTexts = InnerTexts.toLowerCase();

    InnerTexts = InnerTexts.replace(/ the /g, ' ');
    InnerTexts = InnerTexts.replace(/the /g, ' ');
    InnerTexts = InnerTexts.replace(/ a /g, ' ');
    InnerTexts = InnerTexts.replace(/ of /g, ' ');
    InnerTexts = InnerTexts.replace(/ i /g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ in /g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/-/g, ' ');
    InnerTexts = InnerTexts.replace(/\d+/g, ' ');
    InnerTexts = InnerTexts.replace(/ and /g, ' ');
    InnerTexts = InnerTexts.replace(/ to /g, ' ');
    InnerTexts = InnerTexts.replace(/to /g, ' ');
    InnerTexts = InnerTexts.replace(/:/g, ' ');
    InnerTexts = InnerTexts.replace(/ at /g, ' ');
    InnerTexts = InnerTexts.replace(/at /g, ' ');
    InnerTexts = InnerTexts.replace(/ for /g, ' ');
    InnerTexts = InnerTexts.replace(/we /g, ' ');
    InnerTexts = InnerTexts.replace(/you /g, ' ');
    InnerTexts = InnerTexts.replace(/me /g, ' ');
    InnerTexts = InnerTexts.replace(/'/g, ' ');
    InnerTexts = InnerTexts.replace(/ our /g, ' ');
    InnerTexts = InnerTexts.replace(/,/g, ' ');
    InnerTexts = InnerTexts.replace(/will /g, ' ');
    InnerTexts = InnerTexts.replace(/ will /g, ' ');
    InnerTexts = InnerTexts.replace(/[()]/g, ' ');
    InnerTexts = InnerTexts.replace(/[{}]/g, ' ');
    InnerTexts = InnerTexts.replace(/\[/g, ' ');
    InnerTexts = InnerTexts.replace(/\]/g, ' ');
    InnerTexts = InnerTexts.replace(/&/g, ' ');
    InnerTexts = InnerTexts.replace(/\//g, ' ');
    InnerTexts = InnerTexts.replace(/!/g, ' ');

    var words = InnerTexts.split(" ");

    while(clouds.length > 0) {
        clouds.pop();
    }

    for (var i = 0; i < words.length; i++)
    {
        if ((typeof words[i] === "undefined") || (words[i].length < 1))
            continue;

        var found = false;
        for(var j = 0; j < clouds.length; j++) {
            if (clouds[j].Word == words[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            var nDuplicateCnt = 0
            for (var n = 0; n < words.length; n++)
            {
                if (words[i] === words[n])
                    nDuplicateCnt++;
            }

            clouds.push({"Len":nDuplicateCnt, "Word": words[i]});
        }

    }

    clouds.sort(wordSort);

    var nCnt = 0;

    var InfoHtml = "<div style=\"font-size:11px;color:#a8a8a8;padding-top: 1px\">" + "Showing top 50 of " + (clouds.length - 1) + " possible words:</div>";

    $('.info.list_books').html(InfoHtml);
    var level = [];

    var nlevelIndex = 0;
    for (var i = clouds.length - 1; i >= 0; i--)
    {
        var found = false;
        for(var j = 0; j < clouds.length; j++) {
            if (clouds[j].Len == level[i]) {
                found = true;
                break;
            }
        }

        if (!found)
        {
            if (clouds[i].Word.length > 2)
            {
                level[nlevelIndex] = clouds[i].Len;
                nlevelIndex++;
            }
        }

        if (nlevelIndex >= 6)
            break;
    }

    var ColudLevel = 1;
    var contentHtml = "";
    nCnt = 0;

    var ShuffleArray = [];

    for (var i = clouds.length - 1; i >= 0; i--)
    {
        ColudLevel = 6;
        for (var j = 0; j < level.length; j++)
        {
            if (clouds[i].Len === level[j])
            {
                ColudLevel = j + 1;
                break;
            }
        }

        if (clouds[i].Word.length > 2)
        {
            if (clouds[i].Len < 2)
                ShuffleArray.push({Level:6, Word:clouds[i].Word, Len:clouds[i].Len});
            else
                ShuffleArray.push({Level:ColudLevel, Word:clouds[i].Word, Len:clouds[i].Len});
        }

        if (nCnt >= 50)
            break;

        nCnt++;
    }

    ShuffleArray = shuffle(ShuffleArray);

    for (var i = 0; i < ShuffleArray.length; i++)
    {
        contentHtml += "<span class=\"occurcnt\"><span class=\"best" + ShuffleArray[i].Level + "\">" + "&nbsp;" + ShuffleArray[i].Word + "</span>(" + ShuffleArray[i].Len + ")&nbsp;</span>";
    }

    $('#word-cloud-content').html(contentHtml);

    var wordsHTML = "";
    nCnt = 1;
    for (var i = clouds.length - 1; i >= 0; i--)
    {
        if (clouds[i].Word.length > 2)
        {
            wordsHTML += (nCnt + ". <b style='padding-right : 15px;'>" + clouds[i].Word + "</b>&nbsp;&nbsp;&nbsp;&nbsp;");
            if (nCnt >= 5)
                break;

            nCnt++;
        }
    }

    $('.table-head').html("");

    resetCss();

    $('#Words').html(wordsHTML);
    $('#main-header').show();
    $('#word-cloud-content').show();
    $('.info.list_books').show();
    $('#WordCloudFooter').show();
    $('#ExportBtn').show();

    LoadAdvertisementBanner();
}

function RankTrackingListShow() {
    var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:350px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"daysTracked\" style=\"padding-right:30px;\">Days Tracked</label><label class=\"sort-column\" id=\"resTracking\" style=\"padding-right:45px;\">Tracking</label><label class=\"sort-column\" id=\"removeTracking\" style=\"padding-right:5px;\">Action</label>";
    var info = "<div style=\"font-size:15px;\"><b>Best Seller Rank Tracking:</b></div>";
    $('#main-header').html('');
    $('#main-content').html(ContentHtml);
    $('.info.list_books').html(info);
    resetCss();
    $('#main-header').show();
    $('#main-content').show();
    $('#TrackedPanelFooter').show();
    $('.info.list_books').show();
    $('.table-head').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y", "auto");
    $('.table-head').html(tableHead);

    UpdateRateTrackingTable();
}

function KwdAnalysisListShow() {
    var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:300px;\"> </label><label class=\"sort-column\" id=\"price\" style=\"padding-right:20px;\" >Price</label><label class=\"sort-column\" id=\"pages\" style=\"padding-right:15px;\">Page(s)</label><label class=\"sort-column\" id=\"kwt\" style=\"padding-right:15px;\">KWT</label><label class=\"sort-column\" id=\"kwd\" style=\"padding-right:20px;\">KWD</label><label class=\"sort-column\" id=\"rating\" style=\"padding-right:25px;\" >Rating</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:40px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" style=\"padding-right:10px;\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">4,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Pages:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">112</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Rating:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">4.1</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

    resetCss();
    $('#main-content').html(ContentHtml);
    $('.info.list_books').html(InfoHtml);
    $('#main-content').show();
    $('#main-header').show();
    $('#BestSellersRankingFooter').show();
    $('#ExportBtn').show();
    $('.info.list_books').show();
    $('.table-head').show();
    $('#KWDConclusion').show();

    LoadAdvertisementBanner();

    $(".info-item").css("width","16.6%");
    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(tableHead);

    ActiveTab.InsertData(0, obj, SiteParser);
}
var prevBookUrl;
function resetTrackingBookPage(bookUrl) {
    if(prevBookUrl === bookUrl) return;
    prevBookUrl = bookUrl;
    $('#singleResult1').html('');
    $('#singleResult2').html('');
    $('#singleResult3').html('');
    $('#singleResult4').html('');
    $('#singleResult5').html('');
    $('#singleResult6').html('');
    $('#days').html('');
    $('#AvgSalesRank').html('');
    $('#EstDailyRev').html('');
    $('#authorName').html('');
    $('#bookImage').attr('src','');
    $('#enableTracking').show();
    $('#enableTracking').prop('disabled', true);
    $('#disableTracking').hide();
    $('#ExportBtn').hide();
    $('#BookTracked').hide();
    $('#ExportBtn').attr('book-url','');
}

function RankTrackingSingleShow(bookUrl){
    resetCss();
    resetTrackingBookPage(bookUrl);
    $('#tracking-header').show();
    $('#tracking-content').show();
    $('#TrackedPanelFooter').show();
    $('.info.single_book').show();
    $('.right-panel').show();
    $('.table-head').show();
    $(".table-head").html("<label>Bestseller rank tracking(30 days)<label>");

    LoadAdvertisementBanner();

    $('.left-panel').css("width", "525px");

    $('#main-header').html('');
    $('#tracking-content').html('');

    $('#LinkBackTo').hide();
    Storage.GetBook(bookUrl, function(bookData) {
        if(bookData) {
            UpdateTrackedBookView(bookData);
            return;
        }

        Storage.InitBookFromUrl(bookUrl, UpdateTrackedBookView);
    });
}

function UpdateTrackedBookView(bookData){
    var contentHtml = '';
    $('#bookTitle').text(bookData.title);
    if(bookData.trackingEnabled){
        contentHtml = '<div><canvas id="canvas" height="290" width="520"></canvas></div>';
        $('#infoPages').show();
        $('.info.single_book .info-item').css('width', '16%');
        $('#ExportBtn').show();
        $('#BookTracked').show();
    }
    else {
        contentHtml = '<div class="brtdisable"><div>Bestseller Rank Tracking</div><div>Currently Disabled</div></div>';
        $('#enableTracking').prop('disabled', false);
    }
    $('#tracking-header').show();
    $('#LinkBackTo').show();
    $('#tracking-content').html(contentHtml);
    $('#enableTracking').toggle(!bookData.trackingEnabled);
    $('#disableTracking').toggle(bookData.trackingEnabled);
    $('#enableTracking').data({url: bookData.url});
    $('#disableTracking').data({url: bookData.url});

    $('#singleResult1').html(bookData.currentSalesRank);
    $('#singleResult2').html(bookData.price);
    $('#singleResult3').html(bookData.pages);
    $('#singleResult4').html(AddCommas(bookData.estSales));
    $('#singleResult5').html(SiteParser.FormatPrice(AddCommas(Math.round(bookData.estSalesRev))));
    $('#singleResult6').html(bookData.numberOfReviews);
    var sumRank=0;
    var points = bookData.salesRankData.length;
    for(var j=0; j<points;j++){
        sumRank += parseInt(bookData.salesRankData[j].salesRank.replace(SiteParser.ThousandSeparator, "").trim());
    }
    var avgSalesRank = sumRank/points;
    var bookPageParser = new BookPageParser(bookData.url);
    var estSale = bookPageParser.GetEstSale(avgSalesRank);
    var realPrice = parseFloat(bookData.price.replace(/[^0-9\.]/g, ''));
    var SalesRecv = bookPageParser.GetSalesRecv(estSale, realPrice);
    var EstDailyRev = Math.floor((SalesRecv/30)*100)/100;//30days

    $('#days').html(points);
    $('#AvgSalesRank').html(AddCommas(Math.floor(avgSalesRank)));
    $('#EstDailyRev').html(SiteParser.FormatPrice(AddCommas(EstDailyRev)));
    $('#authorName').html(bookData.author);
    $('#bookImage').attr('src',bookData.image.replace('AA300', '').replace('AA324', ''));
    $('#ExportBtn').attr('book-url', bookData.url);

    var chartData = bookData.salesRankData;
    var labels = [];
    var data = [];
    for(var i=0;i<chartData.length;i++){
        labels.push(new Date(chartData[i].date).toDateString());
        data.push(chartData[i].salesRank.replace(/[^0-9\.]/g, ''));
    }

    if(labels.length === 1) labels.push('');
    if(data.length === 1) labels.push('');

    var lineChartData = {
        labels: labels,
        datasets: [
        {
        label: "Sales Rank",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: data
        }
        ]
    };

    var canvas = document.getElementById("canvas");
    if(!canvas) return;
    var context = canvas.getContext("2d");
    window.myLine = new Chart(context).Line(lineChartData, {
        bezierCurve: false
    });
}

function UpdateRateTrackingTable(){
    Storage.GetAllBooks(function(books){
        var html = "";
        for(var i=0;i<books.length;i++){
            html += "<tr>" +
                "<td >" + (i+1) + "</td>" +
                "<td style=\"width:500px;padding-right: 20px;\">" + books[i].title + "</td>" +
                "<td style=\"width:75px;padding-right: 10px;padding-left: 30px;\">" + books[i].salesRankData.length + "</td>" +
                "<td style=\"width:85px;\"><a class='RankTrackingResultSingle' href='#' bookUrl='" + books[i].url + "'>Results</a></td>" +
                "<td style=\"width:85px;\"><a class='RankTrackingRemove' href='#' bookUrl='" + books[i].url + "'>Remove</a></td>" +
            "</tr>";
        }
        $("table[name='data']").find("tbody").html(html);
        addEventListenerForSingleResultBook();

        //Remove links
        var RemoveRankTrackedBooks = $('.RankTrackingRemove');
        for(var i = 0;i<RemoveRankTrackedBooks.length; i++) {
            $(RemoveRankTrackedBooks[i]).click(function () {
                Storage.RemoveBookInStorage($(this).attr('bookUrl'), function(){
                    RankTrackingListShow();
                });
            });
        }
  });
}

function addEventListenerForSingleResultBook(){
    var RankTrackingResultSingle = document.getElementsByClassName('RankTrackingResultSingle');
    for(var i = 0;i<RankTrackingResultSingle.length; i++) {
        RankTrackingResultSingle[i].addEventListener("click", function () {
            RankTrackingSingleShow($(this).attr('bookUrl'));
        });
    }
}

function SetupClickListeners(){
    var linkTitleWord = $('#TitleWordCloud');
    linkTitleWord.click(function() {
        ActiveTab = new WordCloudTab();
        WordsInfoUpdate();
    });

    var BestSellerLink = $('#BestSellerLink');
    BestSellerLink.click(function() {
        $('#data-body').css("overflow-y" , "auto");
        ActiveTab = new MainTab();
        frun();
    });

    var linkRankTrackingResultList = $('#RankTrackingResultList');
    linkRankTrackingResultList.click(function() {
        ActiveTab = new RankTrackingTab();
        RankTrackingListShow();
    });

    var refreshButton = $('#refresh');

    refreshButton.click(function() {
        var mainTab = new MainTab();
        mainTab.PageNum = 1;
        mainTab.SavePageNum();
        var keywordAnalysisTab = new KeywordAnalysisTab();
        keywordAnalysisTab.PageNum = 1;
        keywordAnalysisTab.SavePageNum();
        location.reload();
    });
    var linkKwdAnalysis = $("#KeywordAnalysis");
    linkKwdAnalysis.click(function() {
        ActiveTab = new KeywordAnalysisTab();
        KwdAnalysisListShow();
    });
}

var isStaticLinkInitialized = false;
function SetupStaticClickListeners() {
    if (isStaticLinkInitialized) return;

    var link3 = $('#PullResult');
    link3.click(function () {
        if (ActiveTab.PageNum > 1) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { page: ActiveTab.PageNum }, function (response) {
                });
            });
        }

        SetActivePage(ActiveTab.PageNum + 1);
    });

    var link4 = $('#Export');
    link4.click(function() {
        ActiveTab.ExportToCsv({ bookData: obj, cloudData: clouds });
    });
	
    isStaticLinkInitialized = true;
}

function LoadData(obj) {
    SetupStaticClickListeners();

    if (typeof obj === undefined || obj.length < 1)
    {
        resetCss();
        $('#main-header').html('');
        $('.info.list_books').html("");
        $('.info.list_books').show();
        $('#ExportBtn').show();
        $('#NoDataFooter').show();

        $('.table-head').html("");
        $('#main-content').html("<div><img style=\"width:100%\" src=\"loading.gif\"//></div>");
        $('#main-content').show();
        $('#main-header').show();

        setTimeout(UpdateTable.bind(null,obj), 6000);
    }else{
        UpdateTable(obj);
    }
}
function UpdateTable(obj)
{
    if (typeof obj === undefined || obj.length < 1)
    {
        resetCss();
        $('#main-header').html('');
        $('.info.list_books').html('');
        $('.info.list_books').show();
        $('.table-head').html('');
        $('#no-data-found-content').show();
        $('#NoDataFooter').show();
        $('#ExportBtn').show();

        LoadAdvertisementBanner();

        var link2 = $('#ClickHere');
        link2.click(function() {
            chrome.runtime.sendMessage({type: "get-current-Tab"}, function(response) {
                chrome.tabs.update(response.ID, {url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html"});
                window.close();
            });
        });

		var link5 = $('#refresh');
		link5.click(function() {
			frun();
		});

        IsErrorWindow = true;
        return;
    }

    IsErrorWindow = false;
    Storage.GetNumberOfBooks(function(num){
        num = (num === undefined)?0:num;

        $('#RankTrackingResultList').html('Rank Tracking (' + num + ')');
        $('#main-header').html(BuildHeaderHtml(num));
        if(obj.length>0){
            var categoryKind = obj[0].CategoryKind;
            var category = obj[0].Category;
            SetupHeader(category, categoryKind);
        }

        SetupClickListeners();
    });

	var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:175px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"searchf\" style=\"padding-right:25px;\">More</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:8px;\">Page(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Sales Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

    resetCss();
    $('#main-content').html(ContentHtml);
    $('.info.list_books').html(InfoHtml);
    $('#main-content').show();
    $('#main-header').show();
    $('#BestSellersRankingFooter').show();
    $('#ExportBtn').show();
    $('.info.list_books').show();
    $('.table-head').show();
    $('#totalReSalesRecvBlock').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(tableHead);

    $('.sort-column').each(function( index ){
        $(this).click(function() {
            var newSortColumn = $(this).attr('id');
            currentSortDirection *= -1;

            if(currentSortColumn != newSortColumn)
                currentSortDirection = 1;

            currentSortColumn = newSortColumn;
        });
    });

    //$('#TitleWordCloud').text("Word Cloud (20)");
    ActiveTab.InsertData(0, obj, SiteParser);
}

function SetActivePage(pageNum)
{
    $('#TitleWordCloud').text("Word Cloud (" + (pageNum) * 20 + ")");
    ActiveTab.PageNum = pageNum;
    ActiveTab.SavePageNum();
    ActiveTab.InsertData(pageNum-1, obj, SiteParser);
}

function frun()
{

    chrome.runtime.sendMessage({type: "get-current-Tab"}, function(response) {
        if (response.URL.indexOf("http://www.amazon.") < 0) //Go To Amazone Page
        {
            chrome.tabs.create({url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html", active:true});
            window.close();
            return;
        }
        else
        {   /////////////////////load//////////////////////////
            CurrentPageUrl = response.URL;
            SiteParser = GetSiteParser(CurrentPageUrl);
            chrome.runtime.sendMessage({type: "save-UrlParams", MainUrl: SiteParser.MainUrl, ParamUrlBestSellers: SiteParser.ParamUrlBestSellers});
            InitRegionSelector();
            chrome.runtime.sendMessage({type: "get-type-page"}, function(result) {
                if(result.TYPE == 'single') {
                    RankTrackingSingleShow(CurrentPageUrl);
                    return;
                }
                LoadInfos();
            });


        }
    });
}

function compare(a,b) {
    var func = columnGetterFunctions[currentSortColumn];
    if (func(a) < func(b))
        return -1 * currentSortDirection;
    if (func(a) > func(b))
        return 1 * currentSortDirection;
    return 0;
}

var isRefreshStarted = false;
function LoadInfos()
{
    var url = CurrentPageUrl;
    var IsFreeUrl = false;
    var currentUrl = url;

    if (currentUrl.indexOf("ref=zg_bs_fvp_p_f") >= 0 || currentUrl.indexOf("&tf=") >= 0)
        IsFreeUrl = true;

    if(url.indexOf("/s/")>=0)
    {
       currentUrl = url.replace(/\&page=[0-9]+/, "");	
    }
    else if (url.indexOf("/ref=") >= 0)
    {
        var _Pos = url.lastIndexOf('/ref=');
        currentUrl = url.substr(0, _Pos);
    }
    new MainTab().LoadPageNum(function(){
        new KeywordAnalysisTab().LoadPageNum(function(){
            chrome.runtime.sendMessage({type: "get-settings"}, function(response) {
                settings = response.settings;

                var settingLen = settings.Book.length;
                while(obj.length > 0) {
                    obj.pop();
                }

                for (var i = 0; i < settingLen; i++)
                {
                    if (settings.Book[i].ParentUrl === currentUrl)
                    {
                        if (IsFreeUrl)
                        {
                            if (settings.Book[i].Price.indexOf("Free") >= 0)
                            {
                                var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl, "Rating": settings.Book[i].Rating};
                                obj.push(settingTmp);
                            }
                        }
                        else
                        {
                            if (settings.Book[i].Price.indexOf("Free") < 0)
                            {
                                var settingTmp = {"No": settings.Book[i].No, "Url": settings.Book[i].Url, "ParentUrl": settings.Book[i].ParentUrl, "NextUrl": settings.Book[i].NextUrl,  "Title": settings.Book[i].Title, "Price": settings.Book[i].Price, "EstSales": settings.Book[i].EstSales, "SalesRecv": settings.Book[i].SalesRecv, "Reviews": settings.Book[i].Reviews, "SalesRank": settings.Book[i].SalesRank, "Category": settings.Book[i].Category, "CategoryKind": settings.Book[i].CategoryKind, "PrintLength": settings.Book[i].PrintLength, "Author": settings.Book[i].Author, "DateOfPublication": settings.Book[i].DateOfPublication, "GoogleSearchUrl": settings.Book[i].GoogleSearchUrl, "GoogleImageSearchUrl": settings.Book[i].GoogleImageSearchUrl, "Rating": settings.Book[i].Rating};
                                obj.push(settingTmp);
                            }
                        }
                    }
                }

                obj.sort(compare);
                LoadData(obj);
                LoadAdvertisementBanner();
            });
        });
    });

    if (!isRefreshStarted) {
        setTimeout(AutoAddFunc, 1000);
        isRefreshStarted = true;
    }
}

function InitRegionSelector(){
    $("#regionSelector").val(SiteParser.Region);
    $("#regionSelector").change(function() {
        var url;
        switch ($("#regionSelector").val()){
            case AmazonComParser.Region:
                url = "http://www.amazon.com/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/154606011/ref=zg_bs_nav_kstore_1_kstore";
                break;
            case AmazonCoUkParser.Region:
                url = "http://www.amazon.co.uk/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/341689031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonDeParser.Region:
                url = "http://www.amazon.de/gp/bestsellers/digital-text/530886031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonFrParser.Region:
                url = "http://www.amazon.fr/gp/bestsellers/digital-text/695398031/";
                break;
        }

        chrome.tabs.create({url: url, active:true});
    });
}

function LoadAdvertisementBanner()
{
    $.get("http://www.kdspy.com/banner.html", function(data) {
        $("#ad").html(data);
    });
}

chrome.runtime.sendMessage({type: "set-current-Tab"}, function(response) {
    setTimeout(frun, 100);
});
