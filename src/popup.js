var booksData = [];
var clouds = [];
var ActiveTab = new MainTab();
var IsErrorWindow = false;
var SiteParser;
var Storage = new BookStorage();
var columnGetterFunctions = [];
columnGetterFunctions['no'] = function(book){return parseInt(book.No)};
columnGetterFunctions['pageno'] = function(book){
    var printLength = Helper.parseInt(book.PrintLength, SiteParser.decimalSeparator);
    return isNaN(printLength) ? 0 : printLength;
};
columnGetterFunctions['title-book'] = function(book){return book.Title};
columnGetterFunctions['price'] = function(book){return Helper.parseFloat(book.Price, SiteParser.decimalSeparator)};
columnGetterFunctions['est-sales'] = function(book){return book.EstSales};
columnGetterFunctions['sales-rev'] = function(book){return book.SalesRecv};
columnGetterFunctions['reviews'] = function(book){return Helper.parseInt(book.Reviews, SiteParser.decimalSeparator)};
columnGetterFunctions['sales-rank'] = function(book){return Helper.parseInt(book.SalesRank, SiteParser.decimalSeparator)};

var currentSortColumn = 'no';
var currentSortDirection = 1; //1 = ask, -1 = desc

var isRefreshStarted = false;

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

function getData(callback){
    callback = Helper.valueOrDefault(callback, function(){});
    Api.sendMessageToActiveTab({type: "get-data"}, function(data) {
        data.books.sort(compare);
        return callback({books: data.books, isWaitingForPulling: data.isWaitingForPulling, isPulling: data.isPulling});
    });
}

function refreshData()
{
    getData(function(result) {
        booksData = result.books;

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
    setTimeout(refreshData, 1000);
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
    $('#AdPanel').show();

    LoadAdvertisementBanner();

    $('#data-body').css("overflow-y", "auto");
    $('.table-head').html(tableHead);

    UpdateRateTrackingTable();
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
    var estSale = bookPageParser.getEstSale(avgSalesRank);
    var realPrice = Helper.parseFloat(bookData.price, SiteParser.decimalSeparator);
    var SalesRecv = bookPageParser.getSalesRecv(estSale, realPrice);
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
        var cloud = ActiveTab.wordsInfoUpdate();

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
        ActiveTab = new SearchKeywordsTab(SiteParser);
        var info = ActiveTab.load();
        $('#main-header').html('');
        $('.info.list_books').html(info);

        $('table[name="data-keyword-search"] tbody').on('click', '.keyword-analyze', function(){
            ActiveTab = new MainTab();
            var search = $(this).attr('keyword');
            Api.sendMessageToActiveTab({type: "start-analyze-search-keywords", keyword: search});
            checkUrlAndLoad();
        });

        $("#search-text").keypress(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode == '13'){
                ActiveTab.search();
            }
        });

        $("#go-search").click(function()
        {
            ActiveTab.search();
        });


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
    });

    var linkKwdAnalysis = $("#KeywordAnalysis");
    linkKwdAnalysis.click(function() {
        ActiveTab = new KeywordAnalysisTab();

        var kwdAnalysis = ActiveTab.KwdAnalysisListShow();
        resetCss();
        $('#main-content').html(kwdAnalysis.content);
        $('.info.list_books').html(kwdAnalysis.info);
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
        $('.table-head').html(kwdAnalysis.header);
        ActiveTab.InsertData(ActiveTab.pageNum-1, booksData, SiteParser);
    });
}

var isStaticLinkInitialized = false;
function SetupStaticClickListeners() {
    if (isStaticLinkInitialized) return;

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

    $('#PullResult').click(function () {
        SetActivePage(ActiveTab.pageNum + 1);
        Api.sendMessageToActiveTab({type: 'pull-data', page: ActiveTab.pageNum});
    });

    var exportToCsvFunction = function() {
        ActiveTab.ExportToCsv({ bookData: booksData, cloudData: clouds });
    };
    $('#Export').click(exportToCsvFunction);
    $('#ExportWordCloud').click(exportToCsvFunction);

    $('#Help').click(function(){
        Api.openNewTab('http://www.kdspy.com/help/');
    });

    isStaticLinkInitialized = true;
}

function LoadData(books) {
    SetupStaticClickListeners();
    if (books === undefined || books.length < 1)
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
        UpdateTable(books);
    }
}

function checkIsDataLoaded(){
    Api.sendMessageToActiveTab({type: "get-data"}, function(settings) {
        if (settings.books.length == 0){
            IsErrorWindow = true;
            resetCss();
            $('#main-header').html('');
            $('.table-head').html('');

            Api.sendMessageToActiveTab({type: "get-type-page"}, function(pageName) {
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

function UpdateTable(books)
{
    IsErrorWindow = false;
    Storage.getNumberOfBooks(function(num){
        num = (num === undefined)?0:num;

        $('#RankTrackingResultList').html('Rank Tracking (' + num + ')');
        $('#main-header').html(Helper.buildHeaderHtml(num));
        Helper.setupHeader(books[0].Category, books[0].CategoryKind);
        Helper.setupFooter(books[0].CategoryKind);

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

    ActiveTab.InsertData(ActiveTab.pageNum-1, books, SiteParser);
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
    Api.sendMessageToActiveTab({type: "get-current-url"}, function(url) {
        if (url === undefined || url.indexOf("http://www.amazon.") < 0)
        {
            //Go To Amazon Page
            Api.openNewTab('https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html');
            window.close();
            return;
        }

        // load
        SiteParser = Helper.getSiteParser(url);
        InitRegionSelector();
        Api.sendMessageToActiveTab({type: "get-type-page"}, function(pageName) {
            if (pageName == 'SingleBookPage') {
                ActiveTab = new RankTrackingTab();
                RankTrackingSingleShow(url);
                return;
            }

            new MainTab().LoadPageNum(function(){
                new KeywordAnalysisTab().LoadPageNum(function(){
                    getData(function(result){
                        booksData = result.books;
                        LoadData(booksData);
                        LoadAdvertisementBanner();
                    });
                });
            });

            if (!isRefreshStarted) {
                refreshData();
                isRefreshStarted = true;
            }
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

        Api.openNewTab(url);
    });
}

function LoadAdvertisementBanner()
{
    $.get("http://www.kdspy.com/banner.html", function(data) {
        $("#ad").html(data);
    });
}

$(window).ready(function () {

    $('#bullet-1, #bullet-2, #bullet-3').tooltipster({
        animation: 'fade',
        theme: 'tooltip-theme',
        maxWidth:200,
        updateAnimation: false,
        position: 'top'
    });

    SetupStaticClickListeners();
});

// run this when show the popup
ApiLoader.load(function(){
    checkUrlAndLoad();
});

