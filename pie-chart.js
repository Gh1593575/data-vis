function PieChart(x, y, diameter) {
  this.x = x;
  this.y = y;
  this.diameter = diameter;
  
  /* Start own code */
  this.innerDiameter = diameter * 0.55; 
  this.labelSpace = 30;

  this.animStart = null;     
  this.animDuration = 900;   

  this.resetAnimation = function() {
    this.animStart = null;
  };

  this.get_radians = function(data) {
    var total = 0;
    for (var i = 0; i < data.length; i++) {
      total += data[i];
    }
    
    var radians = [];
    for (let i = 0; i < data.length; i++) {
      radians.push((data[i] / total) * TWO_PI);
    }
    return radians;
  };

  this.easeOutCubic = function(t) {
    return 1 - pow(1 - t, 3);
  };
  /* End own code */

  this.draw = function(data, labels, colours, title) {
    // Test that data is not empty and that each input array is the
    // same length.
    /* Start own code */
    if (!data || data.length === 0) {
      console.log('PieChart Data is empty');
      return;
    } 

    if (this.animStart === null) {
      this.animStart = millis();
    }
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);
    var isAnimating = progress < 1;

    var revealLimit = eased * TWO_PI;
    var fadeAlpha = eased * 255;

    var angles = this.get_radians(data);
    var hoveredIndex = -1; 
    
    var total = 0;
    for (var i = 0; i < data.length; i++) {
      total += data[i];
    }

    if (!isAnimating) {
      var d = dist(mouseX, mouseY, this.x, this.y);

      if (d < this.diameter / 2 && d > this.innerDiameter / 2) {
        var mouseAngle = atan2(mouseY - this.y, mouseX - this.x);
        if (mouseAngle < 0) {
          mouseAngle += TWO_PI;
        }

        var checkAngle = 0;
        for (var i = 0; i < data.length; i++) {
          if (mouseAngle >= checkAngle && mouseAngle < checkAngle + angles[i]) {
            hoveredIndex = i;
            break; 
          }
          checkAngle += angles[i];
        }
      }
    }

    // https://p5js.org/examples/form-pie-chart.html

    var lastAngle = 0;
    for (var i = 0; i < data.length; i++) {
      var colour = colours ? colours[i] : map(i, 0, data.length, 0, 255);

      var sliceStart = lastAngle;
      var sliceEnd = lastAngle + angles[i];

      var visibleEnd = min(sliceEnd, revealLimit);

      if (visibleEnd > sliceStart) {
        fill(colour);
        stroke('#2c2f36'); 
        strokeWeight(2);

        var activeDiameter = this.diameter;
        if (i === hoveredIndex) {
          activeDiameter += 20; 
        }

        arc(this.x, this.y,
            activeDiameter, activeDiameter,
            // Hack for 0!
            sliceStart, visibleEnd + 0.001);
      }

      if (labels) {
        this.makeLegendItem(labels[i], i, colour, fadeAlpha, i === hoveredIndex);
      }
      lastAngle += angles[i];
    }

    fill('#2c2f36'); 
    stroke('#2c2f36'); 
    ellipse(this.x, this.y, this.innerDiameter, this.innerDiameter);

    if (hoveredIndex !== -1) {
      var percentage = (data[hoveredIndex] / total) * 100;
      
      noStroke();
      textAlign('center', 'center'); 
      
      fill(255);
      textSize(36); 
      text(percentage.toFixed(1) + "%", this.x, this.y - 12);
      
      fill(200);
      textSize(14);
      text(labels[hoveredIndex], this.x, this.y + 18);
      
    } else if (!isAnimating) {
      noStroke();
      fill(150); 
      textAlign('center', 'center');
      textSize(14);
      text("Hover over\nsegments", this.x, this.y);
    }

    if (title) {
      noStroke();
      fill(255, fadeAlpha); 
      textAlign('left', 'center');
      textSize(24);
      text(title, this.x - this.diameter / 2, this.y - this.diameter * 0.6);
    }
  };

  this.makeLegendItem = function(label, i, colour, alpha, isHovered) {
    var x = this.x + 50 + this.diameter / 2;
    var y = this.y + (this.labelSpace * i) - this.diameter / 3;
    var baseBoxSize = this.labelSpace / 2;
    var boxWidth = isHovered ? baseBoxSize * 1.35 : baseBoxSize;
    var boxHeight = boxWidth;
    var boxX = isHovered ? x - (boxWidth - baseBoxSize) / 2 : x;
    var boxY = isHovered ? y - (boxHeight - baseBoxSize) / 2 : y;

    var c = color(colour);

    fill(red(c), green(c), blue(c), alpha);
    stroke(52, 54, 64, alpha); 
    strokeWeight(1);
    rect(boxX, boxY, boxWidth, boxHeight, 2);

    if (isHovered) {
      noFill();
      stroke(255, alpha);
      strokeWeight(1.5);
      rect(boxX, boxY, boxWidth, boxHeight, 2);
    }

    fill(255, alpha);
    noStroke();
    textAlign('left', 'center');
    textSize(isHovered ? 15.5 : 14);
    textStyle(isHovered ? BOLD : NORMAL);
    text(label, x + baseBoxSize + 10, y + baseBoxSize / 2);
    textStyle(NORMAL);
  };
  /* End own code */
}