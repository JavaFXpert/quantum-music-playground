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
 * Button that represents a quantum gate on a Push 2 matrix
 */

this.midiNum = 0;


sketch.default2d();
var val = 0;
var vbrgb = [0., 0., 0., 0.];

// process arguments
if (jsarguments.length > 1) {
  this.midiNum = jsarguments[1];
}

draw();


function draw() {
  var width = box.rect[2] - box.rect[0];

  var defFontSize = 9;
  var defLineWidth = 0.5;

  with (sketch) {
    shapeslice(180, 1);
    // erase background
    glclearcolor(vbrgb[0], vbrgb[1], vbrgb[2], vbrgb[3]);
    glclear();

    glcolor(0, 0, 0, 1);
    gllinewidth(defLineWidth);

    //var curNodeType = qasmPadObj.js.curCircNodeType;
    if (midiNum != 43 && midiNum != 51 && midiNum != 59) {
      moveto(-0.8, -0.8);

      // Draw square
      lineto(0.8, -0.8);
      lineto(0.8, 0.8);
      lineto(-0.8, 0.8);
      lineto(-0.8, -0.8);
    }

    if (midiNum == 98) {
      // CircuitNodeTypes.H
      moveto(0.0, 0.0);
      glcolor(0.973, 0.305, 0.336, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.32, -0.4);
      text("H");
    }
    else if (midiNum == 99) {
      // CircuitNodeTypes.PHASE_2
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.30, -0.4);
      text("T");
    }

    else if (midiNum == 90) {
      // CircuitNodeTypes.RX_8
      moveto(0.0, 0.0);
      glcolor(0.008, 0.176, 0.609, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(1.0, 1.0, 1.0, 1.0);
      gllinewidth(1.0);
      framecircle(0.5, 0, 360);
      moveto(-0.4, 0.0);
      lineto(0.4, 0.0);
      moveto(0.0, -0.4);
      lineto(0.0, 0.4);
      gllinewidth(defLineWidth);

      // moveto(0.0, 0.0);
      // glcolor(0.621, 0.098, 0.32, 1.0);
      // plane(0.75, 0.75, 0.75, 0.75);
      // glcolor(1.0, 1.0, 1.0, 1.0);
      // moveto(-0.25, -0.4);
      // text("X");
    }
    else if (midiNum == 91) {
      // CircuitNodeTypes.PHASE_4
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.30, -0.4);
      text("S");
    }

    else if (midiNum == 82) {
      // CircuitNodeTypes.RY_8
      moveto(0.0, 0.0);
      glcolor(0.621, 0.098, 0.32, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(1.0, 1.0, 1.0, 1.0);
      moveto(-0.25, -0.4);
      text("Y");
    }
    else if (midiNum == 83) {
      // CircuitNodeTypes.PHASE_8
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.25, -0.4);
      text("Z");
    }

    else if (midiNum == 74) {
      // CircuitNodeTypes.CTRL
      moveto(0.0, 0.0);
      glcolor(1.0, 1.0, 1.0, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.008, 0.176, 0.609, 1.0);
      moveto(0.0, 0.0);
      circle(0.35, 0, 360);
    }
    else if (midiNum == 75) {
      // CircuitNodeTypes.PHASE_12
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.6, -0.35);
      text("S\u2020");
    }

    else if (midiNum == 66) {
      // CircuitNodeTypes.ANTI_CTRL
      moveto(0.0, 0.0);
      glcolor(1.0, 1.0, 1.0, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.008, 0.176, 0.609, 1.0);
      gllinewidth(1.0);
      moveto(0.0, 0.0);
      framecircle(0.30, 0, 360);
      gllinewidth(defLineWidth);
    }
    else if (midiNum == 67) {
      // CircuitNodeTypes.PHASE_14
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      moveto(-0.6, -0.35);
      text("T\u2020");
    }

    else if (midiNum == 58) {
      // CircuitNodeTypes.SWAP
      moveto(0.0, 0.0);
      glcolor(1.0, 1.0, 1.0, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.008, 0.176, 0.609, 1.0);
      gllinewidth(2.0);
      moveto(-0.4, -0.4);
      lineto(0.4, 0.4);
      moveto(-0.4, 0.4);
      lineto(0.4, -0.4);
      gllinewidth(defLineWidth);
    }

    else if (midiNum == 50) {
      // CircuitNodeTypes.QFT
      moveto(0.0, 0.0);
      glcolor(0.203, 0.691, 0.992, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(0.0, 0.0, 0.0, 1.0);
      fontsize(8);
      moveto(-0.65, -0.35);
      text("qft");
      fontsize(defFontSize);
    }

    else if (midiNum == 51) {
      // Draw hand character
      glcolor(0.008, 0.176, 0.609, 1.0);
      moveto(-0.6, -0.4);
      text("\u270b");
    }

    else if (midiNum == 42) {
      // CircuitNodeTypes.IDEN
      moveto(0.0, 0.0);
      glcolor(0.008, 0.176, 0.609, 1.0);
      plane(0.75, 0.75, 0.75, 0.75);
      glcolor(1.0, 1.0, 1.0, 1.0);
      moveto(-0.2, -0.4);
      text("I");
    }

    else if (midiNum == 43) {
      // Draw delete character
      glcolor(0.008, 0.176, 0.609, 1.0);
      moveto(-0.6, -0.4);
      text("\u232b");
    }

  }
}


/**
 * When button is clicked send a message and update its appearance.
 */
function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  // TODO: Change 'bob' remote message everywhere
  messnamed('alice', this.midiNum, 0);
  //messnamed('bob', this.midiNum, 127);

  draw();
  refresh();
}

onclick.local = 1;  //private


/**
 * Force the button to be square
 *
 * @param w Proposed width of button
 * @param h Proposed height of button
 */
function forcesize(w, h) {
  if (w != h) {
    h = w;
    box.size(w, h);
  }
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


