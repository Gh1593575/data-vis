/* Start own code */
function BubbleVis() {
  this.name = 'Food Consumption';
  this.id = 'bubble-chart';
  this.loaded = false;

  this.bubbles = [];
  this.years = [];
  this.maxAmt = 0;
  this.currentYearIndex = 0;

  this.select = null;

  this.preload = function () {
    var self = this;
    this.data = loadTable("data/food-consumption/foodData.csv", "csv", "header", function () {
      self.loaded = true;
    });
  };

  this.setup = function () {
    if (!this.loaded) return;

    this.bubbles = [];
    this.years = [];
    this.maxAmt = 0;

    this.select = createSelect();
    this.positionSelect(this.select, width - 220, 20);
    this.select.style('font-size', '16px');
    this.select.style('padding', '5px');

    var rows = this.data.getRows();
    var numColumns = this.data.getColumnCount();

    for (var i = 5; i < numColumns; i++) {
      var y = this.data.columns[i];
      this.years.push(y);
      this.select.option(y); 
    }

    let self = this;
    this.select.changed(function () {
      self.changeYear(self.select.value());
    });

    for (var i = 0; i < rows.length; i++) {
      if (rows[i].get(0) != "") {
        var b = new Bubble(rows[i].get(0));

        for (var j = 5; j < numColumns; j++) {
          if (rows[i].get(j) != "") {
            var n = rows[i].getNum(j);
            if (n > this.maxAmt) {
              this.maxAmt = n; 
            }
            b.data.push(n);
          } else {
            b.data.push(0);
          }
        }
        this.bubbles.push(b);
      }
    }

    if (this.years.length > 0) {
      this.changeYear(this.years[0]);
    }
  };

  this.changeYear = function (year) {
    var yearIndex = this.years.indexOf(year);
    if (yearIndex === -1) return;

    this.currentYearIndex = yearIndex;

    for (var i = 0; i < this.bubbles.length; i++) {
      var val = this.bubbles[i].data[yearIndex];
      this.bubbles[i].target_size = map(val, 0, this.maxAmt, 10, 180);
    }
  };

  this.positionSelect = function (sel, canvasX, canvasY) {
    var canvasElt = document.querySelector('#app canvas');
    if (canvasElt) {
      var rect = canvasElt.getBoundingClientRect();
      sel.position(rect.left + window.scrollX + canvasX,
                   rect.top  + window.scrollY + canvasY);
    } else {
      sel.position(canvasX, canvasY);
    }
  };

  this.destroy = function () {
    if (this.select) {
      this.select.remove();
    }
    this.bubbles = [];
  };

  this.draw = function () {
    if (!this.loaded) {
      noStroke();
      fill(255);
      textAlign(CENTER, CENTER);
      text("Loading Food Data...", width / 2, height / 2);
      return;
    }

    // Keep the dropdown pinned to the canvas right edge every frame.
    if (this.select) this.positionSelect(this.select, width - 220, 20);
    noStroke();
    fill(255);
    textSize(24);
    textAlign(LEFT, TOP);
    text("Food Consumption by Year", 20, 16);

    stroke(255);
    strokeWeight(3);
    line(20, 48, 120, 48);

    for (var i = 0; i < this.bubbles.length; i++) {
      this.bubbles[i].update(this.bubbles);
    }

    var hoveredBubble = null;
    var closestDist = Infinity;
    for (var i = 0; i < this.bubbles.length; i++) {
      var b = this.bubbles[i];
      var d = dist(mouseX, mouseY, b.pos.x, b.pos.y);
      if (d < b.size / 2 && d < closestDist) {
        closestDist = d;
        hoveredBubble = b;
      }
    }
    var anyHovered = hoveredBubble !== null;

    for (var i = 0; i < this.bubbles.length; i++) {
      var b = this.bubbles[i];
      if (b !== hoveredBubble) {
        b.draw(false, anyHovered);
      }
    }
    if (hoveredBubble) {
      hoveredBubble.draw(true, true);
    }

    if (hoveredBubble) {
      this.drawTooltip(hoveredBubble);
    }
  };

  this.drawTooltip = function (bubble) {
    var year = this.years[this.currentYearIndex];
    var value = bubble.data[this.currentYearIndex];
    var label = bubble.name;
    var subLabel = year + ':  ' + value.toFixed(1);

    push();
    textSize(14);
    textStyle(BOLD);
    var titleWidth = textWidth(label);
    textStyle(NORMAL);
    textSize(13);
    var subWidth = textWidth(subLabel);

    var boxW = max(titleWidth, subWidth) + 24;
    var boxH = 54;
    var tx = constrain(mouseX + 16, 10, width - boxW - 10);
    var ty = constrain(mouseY - boxH - 12, 10, height - boxH - 10);

    noStroke();
    fill(44, 47, 54, 235); 
    stroke(74, 77, 89);
    strokeWeight(1);
    rect(tx, ty, boxW, boxH, 6);

    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(14);
    text(label, tx + 12, ty + 10);

    textStyle(NORMAL);
    fill(220);
    textSize(13);
    text(subLabel, tx + 12, ty + 30);
    pop();
  };
}
/*End own code*/