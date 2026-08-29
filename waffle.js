/*Start own code*/
function GridPanel(posX, posY, panelW, panelH, colsCount, rowsCount, dataTable, fieldName, categoryList) {
    var fieldValues = dataTable.getColumn(fieldName);
    var swatchPalette = (function() {
        push();
        colorMode(HSB, 360, 100, 100, 255);
        var hueValues = [345, 265, 200, 140, 40];
        var built = [];
        for (var h = 0; h < hueValues.length; h++) {
            built.push(color(hueValues[h], 65, 90));
        }
        pop();
        return built;
    })();
    var categoryStats = [];
    var cells = [];
    var activeHoverName = null;

    this.findCategoryIndex = function (categoryName) {
        for (var i = 0; i < categoryStats.length; i++) {
            if (categoryName === categoryStats[i].name) {
                return i;
            }
        }
        return -1;
    }

    this.computeCategoryStats = function () {
        for (var i = 0; i < categoryList.length; i++) {
            categoryStats.push({
                "name": categoryList[i],
                "count": 0,
                "color": swatchPalette[i % swatchPalette.length]
            });
        }

        for (var i = 0; i < fieldValues.length; i++) {
            var foundIndex = this.findCategoryIndex(fieldValues[i]);
            if (foundIndex != -1) {
                categoryStats[foundIndex].count++
            }
        }

        for (var i = 0; i < categoryStats.length; i++) {
            categoryStats[i].cellShare = round((categoryStats[i].count / fieldValues.length) * (rowsCount * colsCount));
        }
    }

    this.buildCells = function () {
        var cellTotal = colsCount * rowsCount;
        var cellAssignments = [];

        for (var i = 0; i < categoryStats.length; i++) {
            for (var j = 0; j < categoryStats[i].cellShare; j++) {
                if (cellAssignments.length < cellTotal) {
                    cellAssignments.push(categoryStats[i]);
                }
            }
        }

        while (cellAssignments.length < cellTotal) {
            cellAssignments.push(categoryStats[categoryStats.length - 1]);
        }

        var cellWidth = panelW / colsCount;
        var cellHeight = panelH / rowsCount;
        var cellIndex = 0;

        for (var i = 0; i < rowsCount; i++) {
            cells.push([])
            for (var j = 0; j < colsCount; j++) {
                cells[i].push(new Cell(
                    posX + (j * cellWidth),
                    posY + (i * cellHeight),
                    cellWidth,
                    cellHeight,
                    cellAssignments[cellIndex]
                ));
                cellIndex++;
            }
        }
    }

    this.computeCategoryStats();
    this.buildCells();

    this.refreshHoverState = function (mx, my) {
        activeHoverName = null;
        for (var i = 0; i < cells.length; i++) {
            for (var j = 0; j < cells[i].length; j++) {
                if (cells[i][j].isPointInside(mx, my)) {
                    activeHoverName = cells[i][j].categoryData.name;
                    return;
                }
            }
        }
    }

    this.getActiveHoverName = function () {
        return activeHoverName;
    }

    this.render = function () {
        var raisedCells = [];

        for (var i = 0; i < cells.length; i++) {
            for (var j = 0; j < cells[i].length; j++) {
                var cell = cells[i][j];
                if (activeHoverName !== null && cell.categoryData.name === activeHoverName) {
                    raisedCells.push(cell);
                } else {
                    cell.render(false);
                }
            }
        }

        for (var k = 0; k < raisedCells.length; k++) {
            raisedCells[k].render(true);
        }
    }

    this.renderTooltip = function (mx, my) {
        if (!activeHoverName) return;

        var matchedCategory = null;
        for (var c = 0; c < categoryStats.length; c++) {
            if (categoryStats[c].name === activeHoverName) {
                matchedCategory = categoryStats[c];
                break;
            }
        }
        if (!matchedCategory) return;

        var percentValue = ((matchedCategory.count / fieldValues.length) * 100).toFixed(1);
        var tipText = matchedCategory.name + ": " + percentValue + "% (" + matchedCategory.count + ")";

        push();
        fill('#2c2f36');
        stroke('#4a4d59');
        strokeWeight(1);
        textSize(14);

        var tipWidth = textWidth(tipText);

        var tipX = mx + 15;
        var tipY = my - 35;

        if (tipX + tipWidth + 20 > width) {
            tipX = mx - tipWidth - 25;
        }
        if (tipY < 0) {
            tipY = my + 20;
        }

        rect(tipX, tipY, tipWidth + 20, 30, 4);
        noStroke();
        fill(255);
        textAlign(LEFT, CENTER);
        text(tipText, tipX + 10, tipY + 15);
        pop();
    }
}
/*End own code*/