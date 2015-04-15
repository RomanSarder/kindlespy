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

        if (ActiveTab.isPaged) {
            ActiveTab.insertData(ActiveTab.pageNum - 1, booksData, SiteParser);
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

function SetupClickListeners(){
    $('#TitleWordCloud').click(function() {
        ActiveTab = new WordCloudTab(ActiveTab.pageNum);
        var cloud = ActiveTab.load();

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

    $('#BestSellerLink').click(function() {
        $('#data-body').css("overflow-y" , "auto");
        ActiveTab = new MainTab();
        checkUrlAndLoad();
    });

    $('#RankTrackingResultList').click(function() {
        ActiveTab = new RankTrackingTab(SiteParser);
        var tracking = ActiveTab.load();
        $('#main-header').html('');
        $('#main-content').html(tracking.content);
        $('.info.list_books').html(tracking.info);
        resetCss();
        $('#main-header').show();
        $('#main-content').show();
        $('#TrackedPanelFooter').show();
        $('.info.list_books').show();
        $('.table-head').show();
        $('#AdPanel').show();

        LoadAdvertisementBanner();

        $('#data-body').css("overflow-y", "auto");
        $('.table-head').html(tracking.header);
        ActiveTab.updateRateTrackingTable();
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

    $("#KeywordAnalysis").click(function() {
        ActiveTab = new KeywordAnalysisTab();

        var kwdAnalysis = ActiveTab.kwdAnalysisListShow();
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
        ActiveTab.insertData(ActiveTab.pageNum-1, booksData, SiteParser);
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
            ActiveTab.loadDetails($(_this).data().url);
        });
    });

    $('#disableTracking').click(function () {
        var _this = this;
        Storage.disableTracking($(_this).data().url, function(bytesInUse) {
            ActiveTab.loadDetails($(_this).data().url);
        });
    });

    $('#PullResult').click(function () {
        SetActivePage(ActiveTab.pageNum + 1);
        Api.sendMessageToActiveTab({type: 'pull-data', page: ActiveTab.pageNum});
    });

    var exportToCsvFunction = function() {
        ActiveTab.exportToCsv({ bookData: booksData, cloudData: clouds });
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
        $('#main-header').html(Helper.buildHeaderHtml(num, ActiveTab.pageNum * 20));
        Helper.setupHeader(books[0].Category, books[0].CategoryKind);
        Helper.setupFooter(books[0].CategoryKind);

        SetupClickListeners();
    });

    var main = ActiveTab.load();

    resetCss();
    $('#main-content').html(main.content);
    $('.info.list_books').html(main.info);
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
    $('.table-head').html(main.header);

    $('.sort-column').each(function( index ){
        $(this).click(function() {
            var newSortColumn = $(this).attr('id');
            currentSortDirection *= -1;

            if(currentSortColumn != newSortColumn)
                currentSortDirection = 1;

            currentSortColumn = newSortColumn;
        });
    });

    ActiveTab.insertData(ActiveTab.pageNum-1, books, SiteParser);
}

function SetActivePage(pageNum)
{
    $('#TitleWordCloud').text("Word Cloud (" + (pageNum) * 20 + ")");
    ActiveTab.pageNum = pageNum;
    ActiveTab.savePageNum();
    ActiveTab.insertData(pageNum-1, booksData, SiteParser);
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
                ActiveTab = new RankTrackingTab(SiteParser);
                RankTrackingTab.initUI(url);
                ActiveTab.loadDetails(url);
                return;
            }

            new MainTab().loadPageNum(function(){
                new KeywordAnalysisTab().loadPageNum(function(){
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
        maxWidth: 200,
        updateAnimation: false,
        position: 'top'
    });

    SetupStaticClickListeners();
});

// run this when show the popup
ApiLoader.load(function(){
    checkUrlAndLoad();
});

