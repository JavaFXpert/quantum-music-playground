/*
 * Copyright 2021 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Button that represents a circuit element on a Push 2 matrix
 */

this.midiNum = 0;

// TODO: Remove this if not required (see same line below)
//this.qasmPadObj = this.patcher.getnamed("qasmpad");

this.circNodeType = -1; // CircuitNodeTypes.EMPTY;

this.prevDragY = 0;

this.controlFgColor = [0., 0., 0., 1.];

function updateDisplay(nodeType, controlFgList) {
  this.controlFgColor = controlFgList;
  box.size(24.0, 19.5);
  this.circNodeType = nodeType;
  draw();
  refresh();
}


sketch.default2d();
var val = 0;
var vbrgb = [0., 0., 0., 0.];

// process arguments
if (jsarguments.length > 1) {
  this.midiNum = jsarguments[1];
}


function draw() {
  this.qpo = this.patcher.getnamed("qasmpad");

  // var theta;
  // var width = box.rect[2] - box.rect[0];

  var defFontSize = 9;
  var defLineWidth = 0.5;


  with (sketch) {
    shapeslice(180, 1);
    // erase background
    glclearcolor(vbrgb[0], vbrgb[1], vbrgb[2], vbrgb[3]);
    glclear();

    glcolor(controlFgColor);
    gllinewidth(defLineWidth);

    fontsize(defFontSize);

    var curNodeType = circNodeType;

    if (curNodeType == qpo.js.CircuitNodeTypes.EMPTY ||
      curNodeType == qpo.js.CircuitNodeTypes.CTRL_X ||
      curNodeType == qpo.js.CircuitNodeTypes.CTRL ||
      curNodeType == qpo.js.CircuitNodeTypes.ANTI_CTRL ||
      curNodeType == qpo.js.CircuitNodeTypes.SWAP ||
      curNodeType == 0) {
      // Draw empty circuit wire
      moveto(-1.2, 0.0);
      lineto(1.2, 0.0);
    }
    else {
      moveto(-0.8, -0.8);

      // Draw square
      lineto(0.8, -0.8);
      lineto(0.8, 0.8);
      lineto(-0.8, 0.8);
      lineto(-0.8, -0.8);

      // Draw connector
      moveto(-1.2, 0.0);
      lineto(-0.8, -0.0);
      moveto(0.8, 0.0);
      lineto(1.2, 0.0);
    }


    if (curNodeType >= qpo.js.CircuitNodeTypes.RX_0 && curNodeType <= qpo.js.CircuitNodeTypes.RX_15) {
      moveto(0.0, 0.0);
      glcolor(0.621, 0.098, 0.32, 1.0);
      plane(0.8, 0.8, 0.8, 0.8);
      glcolor(1.0, 1.0, 1.0, 1.0);
    }
    else if (curNodeType >= qpo.js.CircuitNodeTypes.RY_0 && curNodeType <= qpo.js.CircuitNodeTypes.RY_15) {
      moveto(0.0, 0.0);
      glcolor(0.621, 0.098, 0.32, 1.0);
      plane(0.8, 0.8, 0.8, 0.8);
      glcolor(1.0, 1.0, 1.0, 1.0);
    }
    else if ((curNodeType >= qpo.js.CircuitNodeTypes.PHASE_0 && curNodeType <= qpo.js.CircuitNodeTypes.PHASE_15) ||
      curNodeType == qpo.js.CircuitNodeTypes.QFT) {
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.8, 0.8, 0.8, 0.8);
      glcolor(0.0, 0.0, 0.0, 1.0);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.IDEN) {
      moveto(0.0, 0.0);
      glcolor(0.008, 0.176, 0.609, 1.0);
      plane(0.8, 0.8, 0.8, 0.8);
      glcolor(1.0, 1.0, 1.0, 1.0);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.CTRL_X) {
      moveto(0.0, 0.0);
      glcolor(0.008, 0.176, 0.609, 1.0);
      circle(0.8, 0, 360);
      glcolor(1.0, 1.0, 1.0, 1.0);
    }
    // else {
    //   moveto(0.0, 0.0);
    //   glcolor(0.0, 0.0, 0.0, 0.0);
    //   plane(0.8, 0.8, 0.8, 0.8);
    //   glcolor(1.0, 1.0, 1.0, 1.0);
    // }


    if (curNodeType == qpo.js.CircuitNodeTypes.H) {
      moveto(0.0, 0.0);
      glcolor(0.973, 0.305, 0.336, 1.0);
      plane(0.8, 0.8, 0.8, 0.8);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.4, -0.4);
      text("H");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.CTRL) {
      glcolor(0.008, 0.176, 0.609, 1.0);
      moveto(0.0, 0.0);
      circle(0.35, 0, 360);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.ANTI_CTRL) {
      glcolor(0.008, 0.176, 0.609, 1.0);
      gllinewidth(1.0);
      moveto(0.0, 0.0);
      framecircle(0.30, 0, 360);
      gllinewidth(defLineWidth);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.CTRL_X) {
      gllinewidth(1.0);
      moveto(-0.4, 0.0);
      lineto(0.4, 0.0);
      moveto(0.0, -0.4);
      lineto(0.0, 0.4);
      gllinewidth(defLineWidth);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.IDEN) {
      moveto(-0.2, -0.4);
      text("I");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.SWAP) {
      glcolor(0.008, 0.176, 0.609, 1.0);
      gllinewidth(2.0);
      moveto(-0.4, -0.4);
      lineto(0.4, 0.4);
      moveto(-0.4, 0.4);
      lineto(0.4, -0.4);
      gllinewidth(defLineWidth);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.QFT) {
      fontsize(8);
      moveto(-0.65, -0.35);
      text("qft");
      fontsize(defFontSize);
    }

    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_0) {
      moveto(-0.6, -0.4);
      text("x0");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_1) {
      moveto(-0.6, -0.4);
      text("x1");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_2) {
      moveto(-0.6, -0.4);
      text("x2");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_3) {
      moveto(-0.6, -0.4);
      text("x3");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_4) {
      moveto(-0.6, -0.4);
      text("x4");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_5) {
      moveto(-0.6, -0.4);
      text("x5");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_6) {
      moveto(-0.6, -0.4);
      text("x6");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_7) {
      moveto(-0.6, -0.4);
      text("x7");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_8) {
      moveto(-0.3, -0.4);
      text("X");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_9) {
      moveto(-0.6, -0.4);
      text("x9");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_10) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x10");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_11) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x11");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_12) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x12");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_13) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x13");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_14) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x14");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RX_15) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("x15");
      fontsize(defFontSize);
    }

    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_0) {
      moveto(-0.6, -0.4);
      text("y0");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_1) {
      moveto(-0.6, -0.4);
      text("y1");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_2) {
      moveto(-0.6, -0.4);
      text("y2");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_3) {
      moveto(-0.6, -0.4);
      text("y3");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_4) {
      moveto(-0.6, -0.4);
      text("y4");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_5) {
      moveto(-0.6, -0.4);
      text("y5");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_6) {
      moveto(-0.6, -0.4);
      text("y6");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_7) {
      moveto(-0.6, -0.4);
      text("y7");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_8) {
      moveto(-0.3, -0.4);
      text("Y");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_9) {
      moveto(-0.6, -0.4);
      text("y9");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_10) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y10");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_11) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y11");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_12) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y12");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_13) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y13");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_14) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y14");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.RY_15) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("y15");
      fontsize(defFontSize);
    }

    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_0) {
      moveto(-0.6, -0.4);
      text("z0");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_1) {
      moveto(-0.6, -0.4);
      text("z1");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_2) {
      moveto(-0.30, -0.4);
      text("T");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_3) {
      moveto(-0.6, -0.4);
      text("z3");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_4) {
      moveto(-0.3, -0.4);
      text("S");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_5) {
      moveto(-0.6, -0.4);
      text("z5");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_6) {
      moveto(-0.6, -0.4);
      text("z6");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_7) {
      moveto(-0.6, -0.4);
      text("z7");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_8) {
      moveto(-0.3, -0.4);
      text("Z");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_9) {
      moveto(-0.6, -0.4);
      text("z9");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_10) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("z10");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_11) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("z11");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_12) {
      moveto(-0.65, -0.35);
      text("S\u2020");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_13) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("z13");
      fontsize(defFontSize);
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_14) {
      moveto(-0.65, -0.35);
      text("T\u2020");
    }
    else if (curNodeType == qpo.js.CircuitNodeTypes.PHASE_15) {
      fontsize(6);
      moveto(-0.65, -0.35);
      text("z15");
      fontsize(defFontSize);
    }
  }
}


/**
 * When button is clicked send a message and update its appearance.
 */
function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  // TODO: Change 'alice' remote message everywhere
  messnamed('alice', this.midiNum, 0);

  draw();
  refresh();
}

onclick.local = 1;  //private


/**
 * When button is dragged, rotate if applicable
 */
function ondrag(x, y, but, cmd, shift, capslock, option, ctrl) {
  this.qpo = this.patcher.getnamed("qasmpad");
  var dragResolution = 4;
  if (but == 0) {
    this.prevDragY = y;
    return;
  }
  if (y + dragResolution < this.prevDragY) {
    this.prevDragY = y;
    if ((circNodeType >= qpo.js.CircuitNodeTypes.RX_0 && circNodeType < qpo.js.CircuitNodeTypes.RX_15)) {
      messnamed('rotate_gate', circNodeType + 1 - qpo.js.CircuitNodeTypes.RX_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType == qpo.js.CircuitNodeTypes.CTRL_X) {
      messnamed('rotate_gate', qpo.js.CircuitNodeTypes.RX_9 - qpo.js.CircuitNodeTypes.RX_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType >= qpo.js.CircuitNodeTypes.RY_0 && circNodeType < qpo.js.CircuitNodeTypes.RY_15) {
      messnamed('rotate_gate', circNodeType + 1 - qpo.js.CircuitNodeTypes.RY_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType >= qpo.js.CircuitNodeTypes.PHASE_0 && circNodeType < qpo.js.CircuitNodeTypes.PHASE_15) {
      messnamed('rotate_gate', circNodeType + 1 - qpo.js.CircuitNodeTypes.PHASE_0);
      messnamed('alice', this.midiNum, 0);
    }
  }
  else if (y - dragResolution > this.prevDragY) {
    this.prevDragY = y;
    if (circNodeType > qpo.js.CircuitNodeTypes.RX_0 && circNodeType <= qpo.js.CircuitNodeTypes.RX_15) {
      messnamed('rotate_gate', circNodeType - 1 - qpo.js.CircuitNodeTypes.RX_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType == qpo.js.CircuitNodeTypes.CTRL_X) {
      messnamed('rotate_gate', qpo.js.CircuitNodeTypes.RX_7 - qpo.js.CircuitNodeTypes.RX_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType > qpo.js.CircuitNodeTypes.RY_0 && circNodeType <= qpo.js.CircuitNodeTypes.RY_15) {
      messnamed('rotate_gate', circNodeType - 1 - qpo.js.CircuitNodeTypes.RY_0);
      messnamed('alice', this.midiNum, 0);
    }
    else if (circNodeType > qpo.js.CircuitNodeTypes.PHASE_0 && circNodeType <= qpo.js.CircuitNodeTypes.PHASE_15) {
      messnamed('rotate_gate', circNodeType - 1 - qpo.js.CircuitNodeTypes.PHASE_0);
      messnamed('alice', this.midiNum, 0);
    }
  }
}

ondrag.local = 1;  //private


/**
 * Force the button to be square
 *
 * @param w Proposed width of button
 * @param h Proposed height of button
 */
function forcesize(w, h) {
  // if (w != h) {
  //   h = w;
    //box.size(24.0, 19.5);
  // }
}

forcesize.local = 1; //private


/**
 * Attempt to resize the button
 *
 * @param w Proposed width of button
 * @param h Proposed height of button
 */
function onresize(w, h) {
  forcesize(w, h);
  draw();
  refresh();
}

onresize.local = 1; //private


