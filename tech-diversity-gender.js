function TechDiversityGender() {

  // Name for the visualisation to appear in the menu bar.
  this.name = 'Tech Diversity: Gender';

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = 'tech-diversity-gender';

  // Layout object to store all common plot layout parameters and
  // methods.
  /* Start own code */
  this.layout = {
    topMargin: 55, 
    bottomMargin: 90,
    barHeightRatio: 0.75, 
    cornerRadius: 4,
    textPad: 16, 
  };
  /* End own code */

  // Middle of the plot: for 50% line.
  this.midX = width / 2;

  // Default visualisation colours.
  /* Start own code */
  this.femaleColour = color(167, 85, 247);   
  this.maleColour = color(74, 108, 247);     
  this.textColour = color(230, 230, 235);    
  this.axisColour = color(140, 142, 152);  
  /* End own code */

  // Property to represent whether data has been loaded.
  this.loaded = false;

  /* Start own code */
  this.animStart = null;    
  this.animDuration = 900;  

  this.resetAnimation = function() {
    this.animStart = null;
  };

  this.easeOutCubic = function(t) {
    return 1 - pow(1 - t, 3);
  };
  /* End own code */

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function() {
    var self = this;
    this.data = loadTable(
      './data/tech-diversity/gender-2018.csv', 'csv', 'header',
      // Callback function to set the value
      // this.loaded to true.
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    // Font defaults.
    /* Start own code */
    textSize(12);
    /* End own code */
  };

  this.destroy = function() {
    /* Start own code */
    this.resetAnimation();
    /* End own code */
  };

  this.draw = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    /* Start own code */
    if (this.animStart === null) {
      this.animStart = millis();
    }
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);
    var isAnimating = progress < 1;

    var titleText = "Tech Diversity: Gender";
    var titleX = 20; 
    var titleY = 16; 

    noStroke();
    fill(255, 255, 255, eased * 255);
    textAlign(LEFT, TOP);
    textSize(24);
    text(titleText, titleX, titleY);

    var underlineY = titleY + 32;
    stroke(255, 255, 255, eased * 255);
    strokeWeight(3);
    line(titleX, underlineY, titleX + 100, underlineY);

    this.midX = width / 2;
    textSize(12);

    var totalRows = this.data.getRowCount();

    var maxNameWidth = 0;
    for (var n = 0; n < totalRows; n++) {
      var w = textWidth(this.data.getString(n, 'company'));
      if (w > maxNameWidth) maxNameWidth = w;
    }
    var labelGutter = (maxNameWidth / 2) + this.layout.textPad;

    var maxHalfWidth = (width / 2) - labelGutter - 20;
    var availableHeight = height - this.layout.topMargin - this.layout.bottomMargin;
    var rowHeight = availableHeight / totalRows;
    var barHeight = max(4, rowHeight * this.layout.barHeightRatio);

    var hoveredRow = -1;
    if (!isAnimating) {
      for (var i = 0; i < totalRows; i++) {
        var y = this.layout.topMargin + i * rowHeight + (rowHeight - barHeight) / 2;
        if (mouseY >= y && mouseY <= y + barHeight) {
          hoveredRow = i;
          break;
        }
      }
    }

    noStroke();

    for (var i = 0; i < totalRows; i++) {
      var y = this.layout.topMargin + i * rowHeight + (rowHeight - barHeight) / 2;
      var isHovered = (i === hoveredRow);

      var company = {
        'name': this.data.getString(i, 'company'),
        'female': this.data.getNum(i, 'female'),
        'male': this.data.getNum(i, 'male'),
      };

      var femaleW = this.mapPercentToWidth(company.female, maxHalfWidth) * eased;
      var maleW = this.mapPercentToWidth(company.male, maxHalfWidth) * eased;

      push();
      fill(this.femaleColour);
      if (isHovered) {
        stroke(255);
        strokeWeight(2);
      } else {
        noStroke();
      }
      rect(this.midX - femaleW - labelGutter, isHovered ? y - 1 : y, femaleW, isHovered ? barHeight + 2 : barHeight, this.layout.cornerRadius);
      pop();

      push();
      fill(this.maleColour);
      if (isHovered) {
        stroke(255);
        strokeWeight(2);
      } else {
        noStroke();
      }
      rect(this.midX + labelGutter, isHovered ? y - 1 : y, maleW, isHovered ? barHeight + 2 : barHeight, this.layout.cornerRadius);
      pop();

      fill(red(this.textColour), green(this.textColour), blue(this.textColour), eased * 255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(isHovered ? 14 : 12);
      text(company.name, this.midX, y + barHeight / 2);
    }

    this.drawAxisAndLegend(totalRows, rowHeight, maxHalfWidth, labelGutter, eased);

    if (hoveredRow !== -1) {
      var company = {
        'name': this.data.getString(hoveredRow, 'company'),
        'female': this.data.getNum(hoveredRow, 'female'),
        'male': this.data.getNum(hoveredRow, 'male'),
      };
      
      var tooltipText = company.name + " — Female: " + company.female + "% | Male: " + company.male + "%";
      
      push();
      fill('#2c2f36');          
      stroke('#4a4d59');        
      strokeWeight(1);
      textSize(14);
      
      var tWidth = textWidth(tooltipText);
      var toolX = constrain(mouseX + 15, 10, width - tWidth - 30);
      var toolY = mouseY - 35;
      
      rect(toolX, toolY, tWidth + 20, 30, 4); 
      
      noStroke();
      fill(255);                
      textAlign(LEFT, CENTER);
      text(tooltipText, toolX + 10, toolY + 15);
      pop();
    }
  };

  this.drawAxisAndLegend = function(totalRows, rowHeight, maxHalfWidth, labelGutter, alphaFrac) {
    var axisY = this.layout.topMargin + totalRows * rowHeight + 15;
    var leftBound = this.midX - maxHalfWidth - labelGutter;
    var rightBound = this.midX + maxHalfWidth + labelGutter;
    var alpha = alphaFrac * 255;

    stroke(255, 255, 255, alpha);
    strokeWeight(1);
    line(leftBound, axisY, rightBound, axisY);

    var percents = [0, 25, 50, 75, 100];
    for (var i = 0; i < percents.length; i++) {
      var p = percents[i];

      var leftX = this.midX - labelGutter - this.mapPercentToWidth(p, maxHalfWidth);
      var rightX = this.midX + labelGutter + this.mapPercentToWidth(p, maxHalfWidth);

      stroke(255, 255, 255, alpha);
      strokeWeight(1);
      line(leftX, axisY, leftX, axisY + 8);
      line(rightX, axisY, rightX, axisY + 8);

      noStroke();
      fill(255, 255, 255, alpha);
      textAlign(CENTER, TOP);
      textSize(10);
      text(p + '%', leftX, axisY + 12);
      text(p + '%', rightX, axisY + 12);
    }

    noStroke();
    var legendY = axisY + 45;

    fill(red(this.femaleColour), green(this.femaleColour), blue(this.femaleColour), alpha);
    ellipse(this.midX - 70, legendY, 12, 12);
    fill(red(this.textColour), green(this.textColour), blue(this.textColour), alpha);
    textAlign(LEFT, CENTER);
    textSize(12);
    text('Female', this.midX - 58, legendY);

    fill(red(this.maleColour), green(this.maleColour), blue(this.maleColour), alpha);
    ellipse(this.midX + 20, legendY, 12, 12);
    fill(red(this.textColour), green(this.textColour), blue(this.textColour), alpha);
    textAlign(LEFT, CENTER);
    textSize(12);
    text('Male', this.midX + 32, legendY);
  };

  this.mapPercentToWidth = function(percent, maxHalfWidth) {
    return map(percent, 0, 100, 0, maxHalfWidth);
  };
  /* End own code */
}