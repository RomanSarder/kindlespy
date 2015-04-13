var booksData = [];
var clouds = [];
var ActiveTab = new MainTab();
var IsErrorWindow = false;
var SiteParser;
var Storage = new BookStorage();
var columnGetterFunctions = [];
columnGetterFunctions['no'] = function(a){return parseInt(a.No)};
columnGetterFunctions['pageno'] = function(a){
    var printLength = Helper.parseInt(a.PrintLength, SiteParser.decimalSeparator);
    return isNaN(printLength) ? 0 : printLength;
};
columnGetterFunctions['title-book'] = function(a){return a.Title};
columnGetterFunctions['price'] = function(a){return Helper.parseFloat(a.Price, SiteParser.decimalSeparator)};
columnGetterFunctions['est-sales'] = function(a){return a.EstSales};
columnGetterFunctions['sales-rev'] = function(a){return a.SalesRecv};
columnGetterFunctions['reviews'] = function(a){return Helper.parseInt(a.Reviews, SiteParser.decimalSeparator)};
columnGetterFunctions['sales-rank'] = function(a){return Helper.parseInt(a.SalesRank, SiteParser.decimalSeparator)};

var currentSortColumn = 'no';
var currentSortDirection = 1; //1 = ask, -1 = desc

$(window).ready(function () {
    $('#LinkBackTo').click(function () {
        $('#data-body').css("overflow-y", "auto");
        ActiveTab = new MainTab();
        checkUrlAndLoad();
    });
    $('#enableTracking').click(function () {
        $('#enableTracking').prop('disabled', true);
        $('#LinkBackTo').hide();
        var _this = this;
        Storage.enableTracking($(_this).data().url, function() {
            $('#enableTracking').prop('disabled', false);
            $('#LinkBackTo').show();
            RankTrackingSingleShow($(_this).data().url);
        });
    });
    $('#disableTracking').click(function () {
        var _this = this;
        Storage.disableTracking($(_this).data().url, function(bytesInUse) {
            RankTrackingSingleShow($(_this).data().url);
        });
    });

    $('#bullet-1, #bullet-2, #bullet-3').tooltipster({
        animation: 'fade',
        theme: 'tooltip-theme',
        maxWidth:200,
        updateAnimation: false,
        position: 'top'
    });

    SetupStaticClickListeners();
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
    $('.img-load').hide();

    //table keywords
    $('.table-head-keyword-search').hide();

    // content
    $('#word-cloud-content').hide();
    $('#no-data-found-content').hide();
    $('#no-supported-area').hide();
    $('#main-content').hide();
    $('#content-keyword-search').hide();
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
    $('#Conclusion').hide();
    $('#ExportBtnWordCloud').hide();
    $('#AdPanel').hide();
}

function Popup(){
}

Popup.sendMessage = function(message, callback){
    callback = Helper.valueOrDefault(callback, function(){});
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            return callback(response);
        });
    });
};

function getObjArray(callback){
    callback = Helper.valueOrDefault(callback, function(){});
    Popup.sendMessage({type: "get-data"}, function(data) {
        return callback({books: data.books, isWaitingForPulling: data.isWaitingForPulling, isPulling: data.isPulling});
    });
}

function AutoAddFunc()
{
    getObjArray(function(result) {
        booksData = result.books;
        booksData.sort(compare);

        if (booksData.length <= 0) return;

        Helper.setupHeader(booksData[0].Category, booksData[0].CategoryKind);

        if (IsErrorWindow) {
            checkUrlAndLoad();
            return;
        }

        if (ActiveTab.IsPaged) {
            ActiveTab.InsertData(ActiveTab.pageNum - 1, booksData, SiteParser);
            if (result.isWaitingForPulling) $('.img-load').show();
            else {
                $('.img-load').hide();
            }
            if (result.isPulling && booksData.length < 20){
                $('.status-img div').hide();
                $('.bullet-progress').show();
            }
            else{
                $('.status-img div').show();
                $('.bullet-progress').hide();
            }
        }
    });
    setTimeout(AutoAddFunc, 1000);
}

//function wordSort(a, b)
//{
//    if (parseInt(a.Len) < parseInt(b.Len))
//        return -1;
//    if (parseInt(a.Len) > parseInt(b.Len))
//        return 1;
//    return 0;
//}
//
//function shuffle(array) {
//    var currentIndex = array.length
//        , temporaryValue
//        , randomIndex
//        ;
//
//    // While there remain elements to shuffle...
//    while (0 !== currentIndex) {
//
//        // Pick a remaining element...
//        randomIndex = Math.floor(Math.random() * currentIndex);
//        currentIndex -= 1;
//
//        // And swap it with the current element.
//        temporaryValue = array[currentIndex];
//        array[currentIndex] = array[randomIndex];
//        array[randomIndex] = temporaryValue;
//    }
//
//    return array;
//}
//
//function WordsInfoUpdate()
//{
//    var xPathRes = document.evaluate ( "/html/body/div/div/div/div/table/tbody/tr/td[2]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
//    var InnerTexts = "";
//
//    if (xPathRes.length < 1)
//        return;
//
//    for (var i = 0; i < xPathRes.snapshotLength; i++) {
//        if (i > ActiveTab.pageNum * 20)
//            break;
//
//        InnerTexts += xPathRes.snapshotItem (i).innerText + " ";
//    }
//
//    InnerTexts = InnerTexts.toLowerCase();
//
//    InnerTexts = InnerTexts.replace(/ the /g, ' ');
//    InnerTexts = InnerTexts.replace(/the /g, ' ');
//    InnerTexts = InnerTexts.replace(/ a /g, ' ');
//    InnerTexts = InnerTexts.replace(/ of /g, ' ');
//    InnerTexts = InnerTexts.replace(/ i /g, ' ');
//    InnerTexts = InnerTexts.replace(/ and /g, ' ');
//    InnerTexts = InnerTexts.replace(/ in /g, ' ');
//    InnerTexts = InnerTexts.replace(/ at /g, ' ');
//    InnerTexts = InnerTexts.replace(/-/g, ' ');
//    InnerTexts = InnerTexts.replace(/\d+/g, ' ');
//    InnerTexts = InnerTexts.replace(/ and /g, ' ');
//    InnerTexts = InnerTexts.replace(/ to /g, ' ');
//    InnerTexts = InnerTexts.replace(/to /g, ' ');
//    InnerTexts = InnerTexts.replace(/:/g, ' ');
//    InnerTexts = InnerTexts.replace(/ at /g, ' ');
//    InnerTexts = InnerTexts.replace(/at /g, ' ');
//    InnerTexts = InnerTexts.replace(/ for /g, ' ');
//    InnerTexts = InnerTexts.replace(/we /g, ' ');
//    InnerTexts = InnerTexts.replace(/you /g, ' ');
//    InnerTexts = InnerTexts.replace(/me /g, ' ');
//    InnerTexts = InnerTexts.replace(/'/g, ' ');
//    InnerTexts = InnerTexts.replace(/ our /g, ' ');
//    InnerTexts = InnerTexts.replace(/,/g, ' ');
//    InnerTexts = InnerTexts.replace(/will /g, ' ');
//    InnerTexts = InnerTexts.replace(/ will /g, ' ');
//    InnerTexts = InnerTexts.replace(/[()]/g, ' ');
//    InnerTexts = InnerTexts.replace(/[{}]/g, ' ');
//    InnerTexts = InnerTexts.replace(/\[/g, ' ');
//    InnerTexts = InnerTexts.replace(/\]/g, ' ');
//    InnerTexts = InnerTexts.replace(/&/g, ' ');
//    InnerTexts = InnerTexts.replace(/\//g, ' ');
//    InnerTexts = InnerTexts.replace(/!/g, ' ');
//
//    var words = InnerTexts.split(" ");
//
//    clouds = [];
//
//    for (var i = 0; i < words.length; i++)
//    {
//        if ((typeof words[i] === "undefined") || (words[i].length < 1))
//            continue;
//
//        var found = false;
//        for(var j = 0; j < clouds.length; j++) {
//            if (clouds[j].Word == words[i]) {
//                found = true;
//                break;
//            }
//        }
//
//        if (!found)
//        {
//            var nDuplicateCnt = 0
//            for (var n = 0; n < words.length; n++)
//            {
//                if (words[i] === words[n])
//                    nDuplicateCnt++;
//            }
//
//            clouds.push({"Len":nDuplicateCnt, "Word": words[i]});
//        }
//
//    }
//
//    clouds.sort(wordSort);
//
//    var nCnt = 0;
//
//    var InfoHtml = "<div style=\"font-size:11px;color:#a8a8a8;padding-top: 1px\">" + "Showing top 50 of " + (clouds.length - 1) + " possible words:</div>";
//
//    $('.info.list_books').html(InfoHtml);
//    var level = [];
//
//    var nlevelIndex = 0;
//    for (var i = clouds.length - 1; i >= 0; i--)
//    {
//        var found = false;
//        for(var j = 0; j < clouds.length; j++) {
//            if (clouds[j].Len == level[i]) {
//                found = true;
//                break;
//            }
//        }
//
//        if (!found)
//        {
//            if (clouds[i].Word.length > 2)
//            {
//                level[nlevelIndex] = clouds[i].Len;
//                nlevelIndex++;
//            }
//        }
//
//        if (nlevelIndex >= 6)
//            break;
//    }
//
//    var ColudLevel = 1;
//    var contentHtml = "";
//    nCnt = 0;
//
//    var ShuffleArray = [];
//
//    for (var i = clouds.length - 1; i >= 0; i--)
//    {
//        ColudLevel = 6;
//        for (var j = 0; j < level.length; j++)
//        {
//            if (clouds[i].Len === level[j])
//            {
//                ColudLevel = j + 1;
//                break;
//            }
//        }
//
//        if (clouds[i].Word.length > 2)
//        {
//            if (clouds[i].Len < 2)
//                ShuffleArray.push({Level:6, Word:clouds[i].Word, Len:clouds[i].Len});
//            else
//                ShuffleArray.push({Level:ColudLevel, Word:clouds[i].Word, Len:clouds[i].Len});
//        }
//
//        if (nCnt >= 50)
//            break;
//
//        nCnt++;
//    }
//
//    ShuffleArray = shuffle(ShuffleArray);
//
//    for (var i = 0; i < ShuffleArray.length; i++)
//    {
//        contentHtml += "<span class=\"occurcnt\"><span class=\"best" + ShuffleArray[i].Level + "\">" + "&nbsp;" + ShuffleArray[i].Word + "</span>(" + ShuffleArray[i].Len + ")&nbsp;</span>";
//    }
//
//    $('#word-cloud-content').html(contentHtml);
//
//    var wordsHTML = "";
//    nCnt = 1;
//    for (var i = clouds.length - 1; i >= 0; i--)
//    {
//        if (clouds[i].Word.length > 2)
//        {
//            wordsHTML += (nCnt + ". <b style='padding-right : 15px;'>" + clouds[i].Word + "</b>&nbsp;&nbsp;&nbsp;&nbsp;");
//            if (nCnt >= 5)
//                break;
//
//            nCnt++;
//        }
//    }
//
//    $('.table-head').html("");
//
//    resetCss();
//
//    $('#Words').html(wordsHTML);
//    $('#main-header').show();
//    $('#word-cloud-content').show();
//    $('.info.list_books').show();
//    $('#WordCloudFooter').show();
//    $('#ExportBtnWordCloud').show();
//    $('#AdPanel').show();
//
//    LoadAdvertisementBanner();
//}

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
    $('#AdPanel').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y", "auto");
    $('.table-head').html(tableHead);

    UpdateRateTrackingTable();
}

function KwdAnalysisListShow() {
    var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:295px;\"> </label><label class=\"sort-column\" id=\"price\" style=\"padding-right:20px;\" >Price</label><label class=\"sort-column\" id=\"pages\" style=\"padding-right:15px;\">Page(s)</label><label class=\"sort-column\" id=\"kwt\" style=\"padding-right:15px;\">KWT</label><label class=\"sort-column\" id=\"kwd\" style=\"padding-right:20px;\">KWD</label><label class=\"sort-column\" id=\"rating\" style=\"padding-right:25px;\" >Rating</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:40px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" style=\"padding-right:10px;\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">4,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Pages:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">112</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Rating:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">4.1</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result6\">31</div></div>";

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
    $('#Conclusion').show();

    LoadAdvertisementBanner();

    $(".info-item").css("width","16.6%");
    $('#data-body').css("overflow-y" , "hidden");
    $('.table-head').html(tableHead);

    ActiveTab.InsertData(ActiveTab.pageNum-1, booksData, SiteParser);
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
    $('#BookTracked').hide();
    $('#ExportBtn').hide();
    $('#ExportBtnWordCloud').show();
    $('#ExportBtnWordCloud').attr('book-url','');
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
    Storage.getBook(bookUrl, function(bookData) {
        if(bookData) {
            UpdateTrackedBookView(bookData);
            return;
        }

        Storage.initBookFromUrl(bookUrl, UpdateTrackedBookView);
    });
}

function UpdateTrackedBookView(bookData){
    var contentHtml = '';
    $('#bookTitle').text(bookData.title);
    if(bookData.trackingEnabled){
        contentHtml = '<div><canvas id="canvas" height="290" width="520"></canvas></div>';
        $('#infoPages').show();
        $('.info.single_book .info-item').css('width', '16%');
        $('#ExportBtnWordCloud').show();
        $('#BookTracked').show();
    }
    else {
        contentHtml = '<div class="brtdisable"><div>Bestseller Rank Tracking</div><div>Currently Disabled</div></div>';
        $('#enableTracking').prop('disabled', false);
    }
    $('#tracking-header').show();
    $('#LinkBackTo').show();
    $('#ExportBtnWordCloud').show();
    $('#AdPanel').show();
    $('#tracking-content').html(contentHtml);
    $('#enableTracking').toggle(!bookData.trackingEnabled);
    $('#disableTracking').toggle(bookData.trackingEnabled);
    $('#enableTracking').data({url: bookData.url});
    $('#disableTracking').data({url: bookData.url});

    $('#singleResult1').html(bookData.currentSalesRank);
    $('#singleResult2').html(bookData.price);
    $('#singleResult3').html(bookData.pages);
    $('#singleResult4').html(Helper.addCommas(bookData.estSales));
    $('#singleResult5').html(SiteParser.formatPrice(Helper.addCommas(Math.round(bookData.estSalesRev))));
    $('#singleResult6').html(bookData.numberOfReviews);
    var sumRank=0;
    var points = bookData.salesRankData.length;
    for(var j=0; j<points;j++){
        sumRank += Helper.parseInt(bookData.salesRankData[j].salesRank, SiteParser.decimalSeparator);
    }
    var avgSalesRank = sumRank/points;
    var bookPageParser = new BookPageParser(bookData.url);
    var estSale = bookPageParser.GetEstSale(avgSalesRank);
    var realPrice = Helper.parseFloat(bookData.price, SiteParser.decimalSeparator);
    var SalesRecv = bookPageParser.GetSalesRecv(estSale, realPrice);
    var EstDailyRev = Math.floor((SalesRecv/30)*100)/100;//30days

    $('#days').html(points);
    $('#AvgSalesRank').html(Helper.addCommas(Math.floor(avgSalesRank)));
    $('#EstDailyRev').html(SiteParser.formatPrice(Helper.addCommas(EstDailyRev)));
    $('#authorName').html(bookData.author);
    $('#bookImage').attr('src',bookData.image.replace('AA300', '').replace('AA324', '').replace('AA278', ''));
    $('#ExportBtnWordCloud').attr('book-url', bookData.url);

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
    Storage.getAllBooks(function(books){
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
                Storage.removeBookInStorage($(this).attr('bookUrl'), function(){
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
        ActiveTab = new WordCloudTab(ActiveTab.pageNum);
        var cloud = ActiveTab.WordsInfoUpdate();

        resetCss();
        $('.table-head').html("");
        $('.info.list_books').html(cloud.info);
        $('#word-cloud-content').html(cloud.content);
        $('#Words').html(cloud.words);
        $('#main-header').show();
        $('#word-cloud-content').show();
        $('.info.list_books').show();
        $('#WordCloudFooter').show();
        $('#ExportBtnWordCloud').show();
        $('#AdPanel').show();

        LoadAdvertisementBanner();
    });

    var BestSellerLink = $('#BestSellerLink');
    BestSellerLink.click(function() {
        $('#data-body').css("overflow-y" , "auto");
        ActiveTab = new MainTab();
        checkUrlAndLoad();
    });

    var linkRankTrackingResultList = $('#RankTrackingResultList');
    linkRankTrackingResultList.click(function() {
        ActiveTab = new RankTrackingTab();
        RankTrackingListShow();
    });

    $('#search').click(function() {
        ActiveTab = new SearchKeywordsTab();
        SearchKeywordsPage();
    });

    var linkKwdAnalysis = $("#KeywordAnalysis");
    linkKwdAnalysis.click(function() {
        ActiveTab = new KeywordAnalysisTab();
        KwdAnalysisListShow();
    });
}
var SearchedKeyword = '';
function SearchKeywordsPage() {
    var info = '<div class="search-inner-panel">' +
        '<div class="search-panel">' +
        '<div id ="go-search" value="Find"></div>' +
        '<div style="overflow: hidden;">' +
        '<input id="search-text" value="' + SearchedKeyword + '" type="text"/>' +
        '</div>' +
        '</div>' +
        '</div>';
    $('#main-header').html('');
    $('.info.list_books').html(info);
    resetCss();
    $('#main-header').show();
    $('#content-keyword-search').show();
    $('#TrackedPanelFooter').show();
    $('.info.list_books').show();
    $('#search-text').focus();
    $('#AdPanel').show();
    if ($('table[name="data-keyword-search"] tr').length > 0) $('.table-head-keyword-search').show();

    LoadAdvertisementBanner();

    $('#data-body-keyword-search').css("overflow-y", "auto");

    $("#search-text").keypress(function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            startSearchKeywords();
        }
    });

    $("#go-search").click(function()
    {
        startSearchKeywords();
    });

    $('table[name="data-keyword-search"] tbody').on('click', '.keyword-analyze', function(){
        ActiveTab = new MainTab();
        var search = $(this).attr('keyword');
        Popup.sendMessage({type: "start-analyze-search-keywords", keyword: search});
        checkUrlAndLoad();
    });
}

function startSearchKeywords(){
    $('.table-head-keyword-search').hide();
    SearchedKeyword = $("#search-text").val();
    ClearSearchKeywordsTable();
    GetSearchKeywordsList(function(keywords){
        GetSearchKeywordFullData(keywords, function(response){
            AppendSearchKeywordsTable(response);
        });
    });
}

function GetSearchKeywordFullData(list, processItemFunction){
    var algorithm = new SearchAnalysisAlgorithm();
    list.forEach(function(item){
        var pageUrl = Helper.getSearchUrl(item, SiteParser);
        $.get(pageUrl, function(responseText){
            var jqResponse = Helper.parseHtmlToJquery(responseText);
            var totalResults = Helper.parseInt(SiteParser.getTotalSearchResult(jqResponse), SiteParser.decimalSeparator);
            var color = algorithm.getCompetitionColor(totalResults);
            return processItemFunction({
                keyword: item,
                color: color
            });
        });
    });
}

function ClearSearchKeywordsTable(){
    $('table[name="data-keyword-search"] tbody').html('');
    $('#content-keyword-search .content').hide();
    $('#content-keyword-search .loading').show();
}

function formattedKeywordString(searchedKeyword){
    return searchedKeyword.replace(SearchedKeyword, '<b>' + SearchedKeyword + '</b>');
}

function AppendSearchKeywordsTable(item){
    $('#content-keyword-search .loading').hide();
    $('#content-keyword-search .content').show();
    $('.table-head-keyword-search').show();
    var html = $('table[name="data-keyword-search"] tbody').html();
    html += "<tr>" +
        "<td style=\"width:200px;padding-left:50px;text-align:left;\">" + formattedKeywordString(item.keyword) + "</td>" +
        "<td style=\"width:85px;\"><div style='width:32px; height:31px; margin: -9px auto -4px auto;' class='bullet-" + item.color + "' ></div></td>" +
        "<td style=\"width:85px;\"><a class = 'keyword-analyze' href='#' keyword = '" + item.keyword + "'>Analyze</a></td>" +
        "</tr>";

    $('table[name="data-keyword-search"] tbody').html(html);
}

function GetSearchKeywordsList(callback){
    var q = encodeURI($("#search-text").val());
    $.ajax({
        url: SiteParser.completionUrl + "&q=" + q,
        method: "GET",
        dataType: "json",
        success: function (responseJson) {
            if(responseJson === undefined || responseJson.length < 2) return callback([]);
            return callback(responseJson[1]);
        },
        error: function (obj, textStatus, errorThrown){
            console.error(textStatus + "  " + errorThrown);
            return callback([]);
        }
    });

}

var isStaticLinkInitialized = false;
function SetupStaticClickListeners() {
    if (isStaticLinkInitialized) return;

    $('#PullResult').click(function () {
        SetActivePage(ActiveTab.pageNum + 1);
        Popup.sendMessage({type: 'pull-data', page: ActiveTab.pageNum}, function(){});
    });

    var exportToCsvFunction = function() {
        ActiveTab.ExportToCsv({ bookData: booksData, cloudData: clouds });
    };
    $('#Export').click(exportToCsvFunction);
    $('#ExportWordCloud').click(exportToCsvFunction);

    $('#Help').click(function(){
        chrome.tabs.create({ url: 'http://www.kdspy.com/help/' });
    });

    isStaticLinkInitialized = true;
}

function LoadData(obj) {
    SetupStaticClickListeners();
    if (obj === undefined || obj.length < 1)
    {
        IsErrorWindow = true;
        resetCss();
        $('#main-header').html('');
        $('.info.list_books').html("");
        $('.info.list_books').show();
        $('#NoDataFooter').show();
        $('#AdPanel').show();

        $('.table-head').html("");
        $('#main-content').html('<div><img style="width:100%" src="../icons/loading.gif"/></div>');
        $('#main-content').show();
        $('#main-header').show();

        setTimeout(checkIsDataLoaded, 6000);
    }else{
        UpdateTable(obj);
    }
}

function checkIsDataLoaded(){
    Popup.sendMessage({type: "get-data"}, function(settings) {
        if (settings.books.length == 0){
            IsErrorWindow = true;
            resetCss();
            $('#main-header').html('');
            $('.table-head').html('');

            Popup.sendMessage({type: "get-type-page"}, function(pageName) {
                if (pageName === '' || pageName === undefined) $('#no-supported-area').show();
                else $('#no-data-found-content').show();

                $('#ExportBtn').show();
                $('#NoDataFooter').show();
                $('#AdPanel').show();

                LoadAdvertisementBanner();
            });
        }
    });
}

function UpdateTable(obj)
{
    IsErrorWindow = false;
    Storage.getNumberOfBooks(function(num){
        num = (num === undefined)?0:num;

        $('#RankTrackingResultList').html('Rank Tracking (' + num + ')');
        $('#main-header').html(Helper.buildHeaderHtml(num));
        Helper.setupHeader(obj[0].Category, obj[0].CategoryKind);
        Helper.setupFooter(obj[0].CategoryKind);

        SetupClickListeners();
    });

	var ContentHtml = "<table class=\"data\" name=\"data\"><tbody id=\"data-body\"></tbody></table>";
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:175px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"searchf\" style=\"padding-right:20px;\">More</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:8px;\">Page(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Monthly Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var InfoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Monthly Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

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
    $('#Conclusion').show();

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

    ActiveTab.InsertData(ActiveTab.pageNum-1, obj, SiteParser);
}

function SetActivePage(pageNum)
{
    $('#TitleWordCloud').text("Word Cloud (" + (pageNum) * 20 + ")");
    ActiveTab.pageNum = pageNum;
    ActiveTab.SavePageNum();
    ActiveTab.InsertData(pageNum-1, booksData, SiteParser);
}

function checkUrlAndLoad()
{
    Popup.sendMessage({type: "get-current-url"}, function(url) {
        if (url === undefined || url.indexOf("http://www.amazon.") < 0)
        {
            //Go To Amazon Page
            chrome.tabs.create({url: "https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html", active:true});
            window.close();
            return;
        }

        // load
        SiteParser = Helper.getSiteParser(url);
        InitRegionSelector();
        Popup.sendMessage({type: "get-type-page"}, function(pageName) {
            if (pageName == 'SingleBookPage') {
                ActiveTab = new RankTrackingTab();
                RankTrackingSingleShow(url);
                return;
            }

            LoadInfos();
        });
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
    new MainTab().LoadPageNum(function(){
        new KeywordAnalysisTab().LoadPageNum(function(){
            getObjArray(function(result){
                booksData = result.books;
                booksData.sort(compare);
                LoadData(booksData);
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
    $("#regionSelector").val(SiteParser.region);
    $("#regionSelector").change(function() {
        var url;
        switch ($("#regionSelector").val()){
            case AmazonComParser.region:
                url = "http://www.amazon.com/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/154606011/ref=zg_bs_nav_kstore_1_kstore";
                break;
            case AmazonCoUkParser.region:
                url = "http://www.amazon.co.uk/Best-Sellers-Kindle-Store-eBooks/zgbs/digital-text/341689031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonDeParser.region:
                url = "http://www.amazon.de/gp/bestsellers/digital-text/530886031/ref=zg_bs_nav_kinc_1_kinc";
                break;
            case AmazonFrParser.region:
                url = "http://www.amazon.fr/gp/bestsellers/digital-text/695398031/";
                break;
            case AmazonCaParser.region:
                url = "http://www.amazon.ca/gp/bestsellers/digital-text/2980423011/";
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

checkUrlAndLoad();
