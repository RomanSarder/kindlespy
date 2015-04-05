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

SearchAnalysisAlgorithm.prototype.GetCompetitionColor = function(totalResults){
    if (totalResults < 500) return 'green';
    if (totalResults < 1500) return 'yellow';
    return 'red';
};

SearchAnalysisAlgorithm.prototype.SetBulletColor = function(object){
    var _this = this;
    $('#bullet-1').removeClass().addClass('bullet-' + this.GetPopularityColor(object.salesRankConclusionValue));
    $('#bullet-2').removeClass().addClass('bullet-' + this.GetPotentialColor(object.monthlyRevBook));
    Popup.sendMessage({type: "get-TotalResults"}, function(response){
        $('#bullet-3').removeClass().addClass('bullet-' + _this.GetCompetitionColor(parseInt(response.TotalResults)));
    });
};