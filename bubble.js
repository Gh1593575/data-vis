/*Start own code*/
function Bubble(name) {
  this.name = name;
  this.pos = createVector(width / 2 + random(-50, 50), height / 2 + random(-50, 50));
  this.velocity = createVector(0, 0); 
  this.size = 10;
  this.target_size = 10;
  this.data = [];

  this.hue = random(0, 360);
  this.baseSaturation = random(55, 75);
  this.baseBrightness = random(82, 96);

  this.hoverScale = 1;       
  this.targetHoverScale = 1;

  this.driftSeedX = random(1000);
  this.driftSeedY = random(1000);

  this.getDisplayColor = function (isHovered, anyHovered) {
    push();
    colorMode(HSB, 360, 100, 100, 255);
    var c;
    if (isHovered) {
      c = color(this.hue,
                min(100, this.baseSaturation + 20),
                min(100, this.baseBrightness + 4),
                255);
    } else if (anyHovered) {
      c = color(this.hue,
                this.baseSaturation * 0.35,
                this.baseBrightness * 0.5,
                255);
    } else {
      c = color(this.hue, this.baseSaturation, this.baseBrightness, 255);
    }
    pop();
    return c;
  };

  this.truncateToWidth = function (str, maxWidth) {
    if (textWidth(str) <= maxWidth) return str;
    var truncated = str;
    while (truncated.length > 0 && textWidth(truncated + '…') > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated.length > 0 ? truncated + '…' : '';
  };

  this.draw = function (isHovered, anyHovered) {
    this.targetHoverScale = isHovered ? 1.18 : 1;
    this.hoverScale = lerp(this.hoverScale, this.targetHoverScale, 0.2);

    var displaySize = this.size * this.hoverScale;
    var displayColor = this.getDisplayColor(isHovered, anyHovered);

    push();

    if (isHovered) {
      drawingContext.shadowBlur = 25;
      drawingContext.shadowColor = displayColor.toString();
    }

    noStroke();
    fill(displayColor);
    ellipse(this.pos.x, this.pos.y, displaySize);

    if (isHovered) {
      drawingContext.shadowBlur = 0;
      noFill();
      stroke(255, 220);
      strokeWeight(2);
      ellipse(this.pos.x, this.pos.y, displaySize);
    }

    if (displaySize > 34) {
      var fontSize = constrain(displaySize / 6, 9, 13);
      textSize(fontSize);
      var maxTextWidth = displaySize - 16;
      var labelText = this.truncateToWidth(this.name, maxTextWidth);

      if (labelText.length > 0) {
        var tw = textWidth(labelText);
        var boxW = min(tw + 12, displaySize - 4);
        var boxH = fontSize + 8;

        noStroke();
        fill(20, 21, 26, anyHovered && !isHovered ? 90 : 190);
        rectMode(CENTER);
        rect(this.pos.x, this.pos.y, boxW, boxH, 4);
        rectMode(CORNER);

        fill(255, anyHovered && !isHovered ? 140 : 255);
        textAlign(CENTER, CENTER);
        text(labelText, this.pos.x, this.pos.y);
      }
    }

    pop();
  };

  this.update = function (_bubbles) {
    var center = createVector(width / 2, height / 2);
    var force = p5.Vector.sub(center, this.pos);
    force.mult(0.003);
    this.velocity.add(force);

    var spacingPadding = 12;
    for (var i = 0; i < _bubbles.length; i++) {
      if (_bubbles[i] !== this) { 
        var v = p5.Vector.sub(this.pos, _bubbles[i].pos);
        var d = v.mag();
        var minDistance = (this.size / 2) + (_bubbles[i].size / 2) + spacingPadding;

        if (d < minDistance) {
          var overlap = minDistance - d;
          v.normalize();
          v.mult(overlap * 0.08); 
          this.velocity.add(v);
        }
      }
    }

    var driftAngle = noise(this.driftSeedX, frameCount * 0.003) * TWO_PI * 2;
    var drift = p5.Vector.fromAngle(driftAngle);
    drift.mult(0.045);
    this.velocity.add(drift);

    this.velocity.mult(0.88); 
    this.pos.add(this.velocity);

    this.size = lerp(this.size, this.target_size, 0.1);

    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
  };
}
/* End own code */