/* Start own code */
/* Custom Waffle Chart / Grid rendering implementation */
function WaffleVis() {
  this.name = 'Workout Distribution';
  this.id = 'waffle-chart';
  this.loaded = false;
  this.isInitialized = false;

  this.gridPanels = [];
  this.sortMenu = null;

  this.weekdaySchedule = [
    { field: "mon_training", label: "Monday", order: 0 },
    { field: "tue_training", label: "Tuesday", order: 1 },
    { field: "wed_training", label: "Wednesday", order: 2 },
    { field: "thu_training", label: "Thursday", order: 3 },
    { field: "fri_training", label: "Friday", order: 4 },
    { field: "sat_training", label: "Saturday", order: 5 },
    { field: "sun_training", label: "Sunday", order: 6 }
  ];

  this.categoryOptions = [
    "Weightlifting",
    "Mixed/CrossFit",
    "Endurance/Hyrox",
    "Boxing",
    "Rest"
  ];

  this.preload = function() {
    var self = this;
    this.data = loadTable("data/workout-survey/Survey_Dataset_Structured.csv", "csv", "header", function() {
      self.loaded = true;
    });
  };

  this.setup = function() {
  };

  this.alignDropdown = function(menuElement, canvasX, canvasY) {
    var canvasElement = document.querySelector('#app canvas');
    if (canvasElement) {
      var boundsRect = canvasElement.getBoundingClientRect();
      menuElement.position(boundsRect.left + window.scrollX + canvasX,
                            boundsRect.top + window.scrollY + canvasY);
    } else {
      menuElement.position(canvasX, canvasY); 
    }
  };

  this.rebuildGrids = function() {
    this.gridPanels = [];
    for (var i = 0; i < this.weekdaySchedule.length; i++) {
      var entry = this.weekdaySchedule[i];
      if (i < 4) {
        this.gridPanels.push(new GridPanel(20 + (i * 220), 100, 200, 200, 10, 10, this.data, entry.field, this.categoryOptions));
      } else {
        this.gridPanels.push(new GridPanel(20 + (i - 4) * 220, 350, 200, 200, 10, 10, this.data, entry.field, this.categoryOptions));
      }
    }
  };

  this.applySort = function() {
    if (!this.sortMenu) return;
    var chosenFilter = this.sortMenu.value().replace('Sort: ', '');

    if (chosenFilter === 'Chronological') {
      this.weekdaySchedule.sort(function(a, b) { return a.order - b.order; });
    } else {
      var self = this;
      this.weekdaySchedule.sort(function(a, b) {
        var tallyA = 0;
        var tallyB = 0;
        var columnA = self.data.getColumn(a.field);
        var columnB = self.data.getColumn(b.field);

        for (var i = 0; i < columnA.length; i++) if (columnA[i] === chosenFilter) tallyA++;
        for (var i = 0; i < columnB.length; i++) if (columnB[i] === chosenFilter) tallyB++;

        return tallyB - tallyA;
      });
    }
    this.rebuildGrids();
  };

  this.destroy = function() {
    this.gridPanels = [];
    this.isInitialized = false;
    if (this.sortMenu) {
      this.sortMenu.remove();
      this.sortMenu = null;
    }
  };

  this.draw = function() {
    if (!this.loaded) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text("Loading Survey Data...", width / 2, height / 2);
      return;
    }

    if (!this.isInitialized) {
      this.sortMenu = createSelect();
      this.alignDropdown(this.sortMenu, width - 180, 20);

      this.sortMenu.option('Sort: Chronological');
      for (var i = 0; i < this.categoryOptions.length; i++) {
        this.sortMenu.option('Sort: ' + this.categoryOptions[i]);
      }

      var self = this;
      this.sortMenu.changed(function() {
        self.applySort();
      });

      this.rebuildGrids();
      this.isInitialized = true;
    }

    // Keep the dropdown pinned to the canvas right edge every frame.
    if (this.sortMenu) this.alignDropdown(this.sortMenu, width - 180, 20);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(24);
    text("Weekly Training Distribution", 20, 16);

    stroke(255);
    strokeWeight(3);
    line(20, 48, 120, 48);

    for (var i = 0; i < this.gridPanels.length; i++) {
      this.gridPanels[i].refreshHoverState(mouseX, mouseY);
    }

    var activeCategoryName = null;
    for (var i = 0; i < this.gridPanels.length; i++) {
      var hoverResult = this.gridPanels[i].getActiveHoverName();
      if (hoverResult) {
        activeCategoryName = hoverResult;
        break;
      }
    }

    this.renderLegend(activeCategoryName);

    for (var i = 0; i < this.gridPanels.length; i++) {
      this.gridPanels[i].render();

      fill(255);
      textSize(16);
      textAlign(CENTER, BOTTOM);
      if (i < 4) {
         text(this.weekdaySchedule[i].label, 20 + (i * 220) + 100, 325);
      } else {
         text(this.weekdaySchedule[i].label, 20 + (i - 4) * 220 + 100, 575);
      }
    }

    for (var i = 0; i < this.gridPanels.length; i++) {
      this.gridPanels[i].renderTooltip(mouseX, mouseY);
    }
  };

  this.renderLegend = function(activeCategoryName) {
    var hueValues = [345, 265, 200, 140, 40];

    push();
    colorMode(HSB, 360, 100, 100, 255);

    var panelX = 910;
    var panelY = 100;
    var rowGap = 28;
    var swatchDim = 14;

    for (var i = 0; i < this.categoryOptions.length; i++) {
      var rowY = panelY + i * rowGap;
      var isActive = (this.categoryOptions[i] === activeCategoryName);

      var currentSwatchDim = isActive ? swatchDim * 1.35 : swatchDim;
      var markerX = isActive ? panelX - 4 : panelX;
      var markerY = isActive ? rowY - 3 : rowY;

      noStroke();
      fill(hueValues[i % hueValues.length], 65, 90);
      rect(markerX, markerY, currentSwatchDim, currentSwatchDim, 3);

      if (isActive) {
        colorMode(RGB, 255);
        noFill();
        stroke(255, 220);
        strokeWeight(1.5);
        rect(markerX, markerY, currentSwatchDim, currentSwatchDim, 3);
        colorMode(HSB, 360, 100, 100, 255);
      }

      colorMode(RGB, 255);
      noStroke();
      fill(255);
      textAlign(LEFT, CENTER);
      textSize(isActive ? 13 : 12);
      textStyle(isActive ? BOLD : NORMAL);
      text(this.categoryOptions[i], panelX + swatchDim + 8, rowY + swatchDim / 2);
      textStyle(NORMAL);
      colorMode(HSB, 360, 100, 100, 255);
    }

    pop();
  };
}
/*End own code*/