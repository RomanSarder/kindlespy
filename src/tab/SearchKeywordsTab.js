/**
 * Created by Andrey Klochkov on 02.04.15.
 */

function SearchKeywordsTab(siteParser){
    if ( SearchKeywordsTab.prototype._singletonInstance )
        return SearchKeywordsTab.prototype._singletonInstance;
    SearchKeywordsTab.prototype._singletonInstance = this;

    this.searchedKeyword = '';
    this.siteParser = siteParser;
}

SearchKeywordsTab.prototype.load = function() {
    return '<div class="search-inner-panel">' +
        '<div class="search-panel">' +
        '<div id="go-search"></div>' +
        '<div style="overflow: hidden;">' +
        '<input id="search-text" value="' + this.searchedKeyword + '" type="text"/>' +
        '</div>' +
        '</div>' +
        '</div>';
};

SearchKeywordsTab.prototype.search = function(){
    var _this = this;
    $('.table-head-keyword-search').hide();
    _this.searchedKeyword = $("#search-text").val();
    _this.clearTable();
    _this.getKeywords(function(keywords){
        _this.getFullData(keywords, function(response){
            _this.appendTable(response);
        });
    });
};

SearchKeywordsTab.prototype.exportToCsv = function(bookData, siteParser){
    // not implemented
};

SearchKeywordsTab.prototype.getFullData = function(list, processItemFunction){
    var _this = this;
    var algorithm = new SearchAnalysisAlgorithm();
    list.forEach(function(item){
        var pageUrl = Helper.getSearchUrl(item, _this.siteParser);
        $.get(pageUrl, function(responseText){
            var jqResponse = Helper.parseHtmlToJquery(responseText);
            var totalResults = Helper.parseInt(_this.siteParser.getTotalSearchResult(jqResponse), _this.siteParser.decimalSeparator);
            var color = algorithm.getCompetitionColor(totalResults);
            return processItemFunction({
                keyword: item,
                color: color
            });
        });
    });
};

SearchKeywordsTab.prototype.clearTable = function(){
    $('table[name="data-keyword-search"] tbody').html('');
    $('#content-keyword-search .content').hide();
    $('#content-keyword-search .loading').show();
};

SearchKeywordsTab.prototype.emphasizeKeyword = function(text, keyword){
    return text.replace(keyword, '<b>' + keyword + '</b>');
};

SearchKeywordsTab.prototype.appendTable = function(item){
    $('#content-keyword-search .loading').hide();
    $('#content-keyword-search .content').show();
    $('.table-head-keyword-search').show();
    var html = $('table[name="data-keyword-search"] tbody').html();
    html += "<tr>" +
    "<td style=\"width:200px;padding-left:50px;text-align:left;\">" + this.emphasizeKeyword(item.keyword, this.searchedKeyword) + "</td>" +
    "<td style=\"width:85px;\"><div style='width:32px; height:31px; margin: -9px auto -4px auto;' class='bullet-" + item.color + "' ></div></td>" +
    "<td style=\"width:85px;\"><a class = 'keyword-analyze' href='#' keyword = '" + item.keyword + "'>Analyze</a></td>" +
    "</tr>";

    $('table[name="data-keyword-search"] tbody').html(html);
};

SearchKeywordsTab.prototype.getKeywords = function(callback){
    var _this = this;
    var q = encodeURI($("#search-text").val());
    $.ajax({
        url: _this.siteParser.completionUrl + "&q=" + q,
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
};
