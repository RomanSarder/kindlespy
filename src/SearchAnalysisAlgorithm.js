/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function SearchAnalysisAlgorithm(){
    if ( SearchAnalysisAlgorithm.prototype._singletonInstance )
        return SearchAnalysisAlgorithm.prototype._singletonInstance;
    SearchAnalysisAlgorithm.prototype._singletonInstance = this;
}

SearchAnalysisAlgorithm.prototype.GetPopularityColor = function(salesRankConclusionValue){
    var salesRankConclusion = parseInt(salesRankConclusionValue);
    if (salesRankConclusion < 3) return 'red';
    if (salesRankConclusion < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.GetPotentialColor = function(monthlyRevBook){
    if (monthlyRevBook < 3) return 'red';
    if (monthlyRevBook < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.GetCompetitionColor = function(callback){
    chrome.runtime.sendMessage({type: "get-TotalResults"}, function(response){
        var totalResults = parseInt(response.TotalResults);
        if (totalResults < 500) return callback('green');
        if (totalResults < 1500) return callback('yellow');
        return callback('red');
    });
};

SearchAnalysisAlgorithm.prototype.SetBulletColor = function(object){
    $('#bullet-1').removeClass().addClass('bullet-' + this.GetPopularityColor(object.salesRankConclusionValue));
    $('#bullet-2').removeClass().addClass('bullet-' + this.GetPotentialColor(object.monthlyRevBook));
    this.GetCompetitionColor(function(color){
        $('#bullet-3').removeClass().addClass('bullet-' + color);
    });
};