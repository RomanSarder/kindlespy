/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function CategoryAnalysisAlgorithm(){
    if ( CategoryAnalysisAlgorithm.prototype._singletonInstance )
        return CategoryAnalysisAlgorithm.prototype._singletonInstance;
    CategoryAnalysisAlgorithm.prototype._singletonInstance = this;
}

CategoryAnalysisAlgorithm.prototype.GetPopularityColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 24999) return 'green';
    if (salesRank < 60000) return 'yellow';
    return 'red';
}

CategoryAnalysisAlgorithm.prototype.GetPotentialColor = function(avgMonthlyRevString){
    var avgMonthlyRev = parseInt(avgMonthlyRevString);
    if (avgMonthlyRev < 200) return 'red';
    if (avgMonthlyRev < 1000) return 'yellow';
    return 'green';
}

CategoryAnalysisAlgorithm.prototype.GetCompetitionColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 4600) return 'red';
    if (salesRank < 14000) return 'yellow';
    return 'green';
}

CategoryAnalysisAlgorithm.prototype.SetBulletColor = function(object){
    $('#bullet-1').removeClass().addClass('bullet-' + this.GetPopularityColor(object.salesRank20));
    $('#bullet-2').removeClass().addClass('bullet-' + this.GetPotentialColor(object.avgMonthlyRev));
    $('#bullet-3').removeClass().addClass('bullet-' + this.GetCompetitionColor(object.salesRank20));
};