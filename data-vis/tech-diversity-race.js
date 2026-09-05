function TechDiversityRace() {

  // Name for the visualisation to appear in the menu bar.
  this.name = 'Tech Diversity: Race';

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = 'tech-diversity-race';

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function() {
    var self = this;
    this.data = loadTable(
      './data/tech-diversity/race-2018.csv', 'csv', 'header',
      // Callback function to set the value
      // this.loaded to true.
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // Create a select DOM element.
    this.select = createSelect();
    /* Start own code */
    // Hide immediately — only reveal when this chart is actually drawing.
    this.select.elt.style.display = 'none';
    this.positionSelect(this.select, width - 180, 20);
    /* End own code */

    // Fill the options with all company names.
    var companies = this.data.columns;
    // First entry is empty.
    for (let i = 1; i < companies.length; i++) {
      this.select.option(companies[i]);
    }
  };

  /* Start own code */
  this.positionSelect = function(select, canvasX, canvasY) {
    var canvasElt = document.querySelector('#app canvas');
    if (canvasElt) {
      var rect = canvasElt.getBoundingClientRect();
      select.position(rect.left + window.scrollX + canvasX,
                       rect.top + window.scrollY + canvasY);
    } else {
      select.position(canvasX, canvasY); // fallback
    }
  };
  /* End own code */

  this.destroy = function() {
    this.select.remove();
    /* Start own code */
    this.pie.resetAnimation();
    /* End own code */
  };

  // Create a new pie chart object.
  this.pie = new PieChart(width / 2, height / 2, width * 0.4);

  /* Start own code */
  this.drawTitle = function() {
    var titleText = 'Tech Diversity: Race';

    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(24);
    text(titleText, 20, 16);

    var underlineY = 16 + 32;
    stroke(255);
    strokeWeight(3);
    line(20, underlineY, 120, underlineY);
  };
  /* End own code */

  this.draw = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // Keep the dropdown pinned to the canvas right edge every frame.
    if (this.select) {
      this.select.elt.style.display = 'block';
      this.positionSelect(this.select, width - 180, 20);
    }
    /* Start own code */
    this.drawTitle();
    /* End own code */

    // Get the value of the company we're interested in from the
    // select item.
    var companyName = this.select.value();

    // Get the column of raw data for companyName.
    var col = this.data.getColumn(companyName);

    // Convert all data strings to numbers.
    col = stringsToNumbers(col);

    // Copy the row labels from the table (the first item of each row).
    var labels = this.data.getColumn(0);

    // Colour to use for each category.
    var colours = ['#9D4EDD', '#00F5FF', '#FF4D85', '#00E676', '#FFC400', '#C792EA'];

    // Draw the pie chart!
    /* Start own code */
    this.pie.draw(col, labels, colours, null);
    /* End own code */
  };
}