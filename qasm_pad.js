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
 * Quantum DJ device circuit pad that may be used even when
 * a Push 2 device is not connected.
 *
 * TODO: Conditionally disable shift gates up/down buttons
 * TODO: Identify color scheme that accommodate pi/8
 * TODO: Inquire surface number for Push
 * TODO: Implement cry gate
 * TODO: Implement / leverage chords & apeggiator
 * TODO: Implement one-shot (non-looping) clips
 * TODO: Clear Push pad when switching between Note and Session
 * TODO: Ensure that only MIDI clips are in dropdown
 * TODO: Use On/Off graphic on Push
 * TODO: Implement rule-based composition constraints, e.g.:
 *  - Ending on same note as beginning
 *  - Removing notes with LSB 111 in a four wire circuit
 *  - Penultimate note is 7, 1 or 2
 * TODO: Populate textbox with QASM for circuit
 *  - Test result after applying column of Hadamards
 */

// Lowest MIDI pitch on grid
var LOW_MIDI_PITCH = 36;

// Dimensions of controller pad matrix
var CONTR_MAT_ROWS = 8;
var CONTR_MAT_COLS = 8;

// Controller pad rows and columns reserved for circuit
var NUM_GRID_ROWS = 8;
var NUM_GRID_COLS = 6;

//  Number of controller pads reserved for the circuit
var NUM_GRID_CELLS = NUM_GRID_ROWS * NUM_GRID_COLS;

// Controller pad columns reserved for gates
var NUM_GATE_COLS = 2;

// Resolution of calculation from phase to notes or sounds in a kit.
// Also represents resolution of phase.
var NUM_PITCHES = 16;

// Lowest MIDI value of drum pad
var LOW_DRUMPAD_MIDI = 36;

// Maximum number of drum pads
var MAX_DRUMPADS = 16;

// Minimum number of qubits in a circuit
var MIN_CIRCUIT_WIRES = 2;

// Circuit node types
var CircuitNodeTypes = {
  EMPTY: -1,
  HAND: 0,
  // X: 1,
  // Y: 2,
  // Z: 3,
  // S: 4,
  // SDG: 5,
  // T: 6,
  // TDG: 7,
  H: 8,
  SWAP: 9,
  BARRIER: 10,
  CTRL: 11, // "control" part of multi-qubit gate
  ANTI_CTRL: 12, // "anti-control" part of multi-qubit gate
  TRACE: 13, // In the path between a gate part and a "control" or "swap" part
  MEASURE_Z: 14,
  IDEN: 15,

  CTRL_X: 21, // X gate that is associated with control qubit(s)

  RX_0: 30, // Rx
  RX_1: 31, // Rx pi/8
  RX_2: 32, // Rx pi/4
  RX_3: 33, // Rx 3pi/8
  RX_4: 34, // Rx pi/2
  RX_5: 35, // Rx 5pi/8
  RX_6: 36, // Rx 3pi/4
  RX_7: 37, // Rx 7pi/8
  RX_8: 38, // Rx pi (X)
  RX_9: 39, // Rx 9pi/8
  RX_10: 40, // Rx 5pi/4
  RX_11: 41, // Rx 11pi/8
  RX_12: 42, // Rx 3pi/2
  RX_13: 43, // Rx 13pi/8
  RX_14: 44, // Rx 7pi/4
  RX_15: 45, // Rx 15pi/8

  RY_0: 50, // Ry
  RY_1: 51, // Ry pi/8
  RY_2: 52, // Ry pi/4
  RY_3: 53, // Ry 3pi/8
  RY_4: 54, // Ry pi/2
  RY_5: 55, // Ry 5pi/8
  RY_6: 56, // Ry 3pi/4
  RY_7: 57, // Ry 7pi/8
  RY_8: 58, // Ry pi (Y)
  RY_9: 59, // Ry 9pi/8
  RY_10: 60, // Ry 5pi/4
  RY_11: 61, // Ry 11pi/8
  RY_12: 62, // Ry 3pi/2
  RY_13: 63, // Ry 13pi/8
  RY_14: 64, // Ry 7pi/4
  RY_15: 65, // Ry 15pi/8

  PHASE_0: 70, // Phase
  PHASE_1: 71, // Phase pi/8
  PHASE_2: 72, // Phase pi/4 (T)
  PHASE_3: 73, // Phase 3pi/8
  PHASE_4: 74, // Phase pi/2 (S)
  PHASE_5: 75, // Phase 5pi/8
  PHASE_6: 76, // Phase 3pi/4
  PHASE_7: 77, // Phase 7pi/8
  PHASE_8: 78, // Phase pi (Z)
  PHASE_9: 79, // Phase 9pi/8
  PHASE_10: 80, // Phase 5pi/4
  PHASE_11: 81, // Phase 11pi/8
  PHASE_12: 82, // Phase 3pi/2 (Sdg)
  PHASE_13: 83, // Phase 13pi/8
  PHASE_14: 84, // Phase 7pi/4 (Tdg)
  PHASE_15: 85, // Phase 15pi/8

  QFT: 90 // QFT
};


// Inlet 0 receives note messages that include velocity.
// Inlet 1 receives bang message to update clips
// Inlet 2 receives gate rotation messages
// Inlet 3 receives shift gates down messages
// Inlet 4 receives shift gates up messages
// Inlet 5 receives shift gates right messages
// Inlet 6 receives shift gates left messages
this.inlets = 7;

// Outlet 0 sends message to a simulator with generated QASM
// Outlet 1 sends messages to the midi clips list box
// Outlet 2 sends messages to the clip selector dial
// Outlet 3 sends messages to the gate rotator dial

// TODO: Modify, perhaps using four outlets (down, up, right, left)
// Outlet 4 sends messages to the gates shifter dial
this.outlets = 5;


// Flag that indicates whether the currently displayed pads/notes
// are dirty.
var padNoteNamesDirty = true;


// Flag that tracks whether the circuit should be cleared
// when the CircuitNodeTypes.EMPTY key is net pressed
var clearCircuitWhenEmptyKeyNextPressed = false;

var curCircNodeType = CircuitNodeTypes.H;

var highMidiPitch = (NUM_GRID_ROWS - 1) * CONTR_MAT_COLS + NUM_GRID_COLS + LOW_MIDI_PITCH - 1;

// TODO: Allocate the array and call refreshPadNoteNames method?
var padNoteNames = [];
refreshPadNoteNames();


// TODO: Dynamically initialize this array
var circGrid = [
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1]
];


var gateGrid = [
  [CircuitNodeTypes.H, CircuitNodeTypes.PHASE_2],
  [CircuitNodeTypes.RX_8, CircuitNodeTypes.PHASE_4],
  [CircuitNodeTypes.RY_8, CircuitNodeTypes.PHASE_8],
  [CircuitNodeTypes.CTRL, CircuitNodeTypes.PHASE_12],
  [CircuitNodeTypes.ANTI_CTRL, CircuitNodeTypes.PHASE_14],
  [CircuitNodeTypes.SWAP, CircuitNodeTypes.EMPTY],
  [CircuitNodeTypes.QFT, CircuitNodeTypes.EMPTY],
  [CircuitNodeTypes.IDEN, CircuitNodeTypes.EMPTY]
];


// Currently selected row/column on grid
var selCircGridRow = -1;
var selCircGridCol = -1;

// Current theme control_fg color
var controlFgColor = [0., 0., 0., 1.];

// Associates clip name to path
var clipsPaths = [];

// Array contain midi values of pads to blink
var padsToBlink = [];

// Tracks number of consecutive QFT gates in a column
var numConsecutiveQftRowsInCol = 0;


/**
 * Represents a control or anti-control, and the wire
 * on which it is present
 * @param wireNumArg
 * @param isAntiCtrlArg
 * @constructor
 */
function ControlWire(wireNumArg, isAntiCtrlArg) {
  this.wireNum = wireNumArg;
  this.isAntiCtrl = isAntiCtrlArg;
}


function bang() {
  if (inlet == 1) {
    // bang received to refresh list of clips
    populateMidiClipsList();
  }
  else if (inlet == 3) {
    // bang received to shift all gates down
    shiftAllGatesVertically(true);
  }
  else if (inlet == 4) {
    // bang received to shift all gates up
    shiftAllGatesVertically(false);
  }
  else if (inlet == 5) {
    //post('\nShifting gates right\n');

    // bang received to shift all gates right
    shiftAllGatesHorizontally(true);
  }
  else if (inlet == 6) {
    //post('\nShifting gates left\n');

    // bang received to shift all gates left
    shiftAllGatesHorizontally(false);
  }
}


function msg_int(val) {
  if (inlet == 2) {
    var piOver8Rotation = val;

    if (selCircGridRow >= 0 &&
      selCircGridRow < NUM_GRID_ROWS &&
      selCircGridCol >= 0 &&
      selCircGridCol < NUM_GRID_COLS) {

      var selNodeType = circGrid[selCircGridRow][selCircGridCol];
      var newNodeType = CircuitNodeTypes.EMPTY;

      var rotateGateDial = this.patcher.getnamed("rotate_gate");
      var rotateGateSelected = true;

      if ((selNodeType >= CircuitNodeTypes.RX_0 && selNodeType <= CircuitNodeTypes.RX_15) ||
        selNodeType == CircuitNodeTypes.CTRL_X) {

        newNodeType = CircuitNodeTypes.RX_0 + piOver8Rotation;
      }
      else if (selNodeType >= CircuitNodeTypes.RY_0 &&
        selNodeType <= CircuitNodeTypes.RY_15) {

        newNodeType = CircuitNodeTypes.RY_0 + piOver8Rotation;
      }
      else if (selNodeType >= CircuitNodeTypes.PHASE_0 &&
        selNodeType <= CircuitNodeTypes.PHASE_15) {

        newNodeType = CircuitNodeTypes.PHASE_0 + piOver8Rotation;
      }
      else {
        var rotateGateSelected = false;
      }

      // Conditionally disable rotate gate dial
      rotateGateDial.setattr('ignoreclick', !rotateGateSelected);

      var tc = rotateGateDial.getattr('textcolor', 1, 1, 1, 1);
      var alpha = rotateGateSelected ? 1 : 0.2;
      rotateGateDial.setattr('textcolor', tc[0], tc[1], tc[2], alpha);
      rotateGateDial.setattr('slidercolor', tc[0], tc[1], tc[2], alpha);
      rotateGateDial.setattr('tribordercolor', tc[0], tc[1], tc[2], alpha);


      if (newNodeType != CircuitNodeTypes.EMPTY) {
        circGrid[selCircGridRow][selCircGridCol] = newNodeType;

        refreshCircGrid();
        //informCircuitBtn(selCircGridRow, selCircGridCol);

        createQasmFromGrid();
      }
    }
  }
}

function control_fg(themeInfo) {
  if (inlet == 4) {
    controlFgColor = [arguments[0], arguments[1], arguments[2], arguments[3]];
    refreshCircGrid();
  }
}

function surface_bg(themeInfo) {
  // TODO: Remove a device wire?
}

function getPathByClipNameIdx(clipNameIdx) {
  if (clipNameIdx < clipsPaths.length) {
    var caratPos = clipsPaths[clipNameIdx].indexOf('^');
    if (caratPos > 0) {
      var clipPath = clipsPaths[clipNameIdx].substring(caratPos + 1);
      return clipPath;
    }
    else {
      return "";
    }
  }
  else {
    return "";
  }
}


sketch.default2d();
var val = 0;
var vbrgb = [1., 1., 1., 1.];
var last_x = 0;
var last_y = 0;

resetCircGrid();

draw();
refresh();


function list(lst) {
  if (inlet == 0) {
    setCircGridGate(arguments);
    //createQasmFromGrid();
  }
}


/**
 * Set all elements to EMPTY
 */
function resetCircGrid() {
  for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
    for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
      circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

      selCircGridRow = -1;
      selCircGridCol = -1;

      informCircuitBtn(rowIdx, colIdx);
    }
  }
}


/**
 * Refresh circuit button, for example after a theme change
 */
function refreshCircGrid() {
  for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
    for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
      informCircuitBtn(rowIdx, colIdx);
    }
  }
}


function shiftAllGatesVertically(shiftDown) {
  if (shiftDown) {
    if (rowIsEmpty(NUM_GRID_ROWS - 1)) {
      for (rowIdx = NUM_GRID_ROWS - 2; rowIdx >= 0; rowIdx--) {
        for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
          circGrid[rowIdx + 1][colIdx] = circGrid[rowIdx][colIdx];
          circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

          selCircGridRow = -1;
          selCircGridCol = -1;
          informCircuitBtn(rowIdx, colIdx);
          informCircuitBtn(rowIdx + 1, colIdx);
        }
      }
    }
  }
  else {
    if (rowIsEmpty(0)) {
      for (rowIdx = 1; rowIdx < NUM_GRID_ROWS; rowIdx++) {
        for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
          circGrid[rowIdx - 1][colIdx] = circGrid[rowIdx][colIdx];
          circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

          selCircGridRow = -1;
          selCircGridCol = -1;
          informCircuitBtn(rowIdx - 1, colIdx);
          informCircuitBtn(rowIdx, colIdx);
        }
      }
    }
  }
  createQasmFromGrid();
}


function shiftAllGatesHorizontally(shiftRight) {
  if (shiftRight) {
    if (colIsEmpty(NUM_GRID_COLS - 1)) {
      for (colIdx = NUM_GRID_COLS - 2; colIdx >= 0; colIdx--) {
        for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
          circGrid[rowIdx][colIdx + 1] = circGrid[rowIdx][colIdx];
          circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

          selCircGridRow = -1;
          selCircGridCol = -1;
          informCircuitBtn(rowIdx, colIdx);
          informCircuitBtn(rowIdx, colIdx + 1);
        }
      }
    }
  }
  else {
    if (colIsEmpty(0)) {
      for (colIdx = 1; colIdx < NUM_GRID_COLS; colIdx++) {
        for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
          circGrid[rowIdx][colIdx - 1] = circGrid[rowIdx][colIdx];
          circGrid[rowIdx][colIdx] = CircuitNodeTypes.EMPTY;

          selCircGridRow = -1;
          selCircGridCol = -1;
          informCircuitBtn(rowIdx, colIdx - 1);
          informCircuitBtn(rowIdx, colIdx);
        }
      }
    }
  }
  createQasmFromGrid();
}


function rowIsEmpty(rowIdx) {
  var rowEmpty = true;
  for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
    if (circGrid[rowIdx][colIdx] != CircuitNodeTypes.EMPTY) {
      rowEmpty = false;
      break;
    }
  }
  return rowEmpty;
}


function colIsEmpty(colIdx) {
  var colEmpty = true;
  for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
    if (circGrid[rowIdx][colIdx] != CircuitNodeTypes.EMPTY) {
      colEmpty = false;
      break;
    }
  }
  return colEmpty;
}


/**
 * Given an array with midi pitch and velocity,
 * populates the corresponding circuit grid element
 *
 * @param notePitchVelocity Array containing midi pitch and velocity
 */
function setCircGridGate(notePitchVelocity) {
  if (notePitchVelocity.length >= 2) {
    var pitch = notePitchVelocity[0];
    var velocity = notePitchVelocity[1];

    // Only process noteup events (when user releases controller button)
    if (velocity > 0) {
      return;
    }

    if (pitch >= LOW_MIDI_PITCH && pitch <= highMidiPitch + 4) {
      var gridRow = Math.floor((highMidiPitch - pitch) / CONTR_MAT_COLS);
      var gridCol = (highMidiPitch - pitch) % CONTR_MAT_COLS;

      if (gridCol >= 0 && gridCol < NUM_GRID_COLS) {

        gridCol = NUM_GRID_COLS - gridCol - 1;

        // User is placing on the circuit
        clearCircuitWhenEmptyKeyNextPressed = false;

        selCircGridRow = gridRow;
        selCircGridCol = gridCol;

        if (curCircNodeType != CircuitNodeTypes.HAND &&
          (circGrid[gridRow][gridCol] == CircuitNodeTypes.EMPTY ||
            curCircNodeType == CircuitNodeTypes.EMPTY)) {
          circGrid[gridRow][gridCol] = curCircNodeType;
        }
        else {
          //post('\nGate already present');
        }

        var newPiOver8Rotation = 0;
        if (circGrid[gridRow][gridCol] == CircuitNodeTypes.CTRL_X) {
          newPiOver8Rotation = NUM_PITCHES / 2;
        }
        else if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.RX_0 &&
          circGrid[gridRow][gridCol] <= CircuitNodeTypes.RX_15) {

          newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.RX_0;
        }
        else if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.RY_0 &&
          circGrid[gridRow][gridCol] <= CircuitNodeTypes.RY_15) {

          newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.RY_0;
        }
        else if (circGrid[gridRow][gridCol] >= CircuitNodeTypes.PHASE_0 &&
          circGrid[gridRow][gridCol] <= CircuitNodeTypes.PHASE_15) {

          newPiOver8Rotation = circGrid[gridRow][gridCol] - CircuitNodeTypes.PHASE_0;
        }
        // Set the current rotation on the gate rotator dial
        outlet(3, 'int', newPiOver8Rotation);

        refreshCircGrid();
        //informCircuitBtn(gridRow, gridCol);

        createQasmFromGrid();
      }
      else {
        // User is choosing a gate
        if (pitch == 43) {
          curCircNodeType = CircuitNodeTypes.EMPTY;
          if (clearCircuitWhenEmptyKeyNextPressed) {
            resetCircGrid();
            createQasmFromGrid();
            clearCircuitWhenEmptyKeyNextPressed = false;
          }
          else {
            // TODO: Uncomment next line after making it not easy to accidentally clear the circuit
            //clearCircuitWhenEmptyKeyNextPressed = true;
          }
        }
        else if (pitch == 51) {
          curCircNodeType = CircuitNodeTypes.HAND;
        }
        else {
          clearCircuitWhenEmptyKeyNextPressed = false;

          if (pitch == 98) {
            curCircNodeType = CircuitNodeTypes.H;
          }
          else if (pitch == 99) {
            curCircNodeType = CircuitNodeTypes.PHASE_2;
          }

          else if (pitch == 90) {
            curCircNodeType = CircuitNodeTypes.RX_8;
          }
          else if (pitch == 91) {
            curCircNodeType = CircuitNodeTypes.PHASE_4;
          }

          else if (pitch == 82) {
            curCircNodeType = CircuitNodeTypes.RY_8;
          }
          else if (pitch == 83) {
            curCircNodeType = CircuitNodeTypes.PHASE_8;
          }

          else if (pitch == 74) {
            curCircNodeType = CircuitNodeTypes.CTRL;
          }
          else if (pitch == 75) {
            curCircNodeType = CircuitNodeTypes.PHASE_12;
          }

          else if (pitch == 66) {
            curCircNodeType = CircuitNodeTypes.ANTI_CTRL;
          }
          else if (pitch == 67) {
            curCircNodeType = CircuitNodeTypes.PHASE_14;
          }

          else if (pitch == 58) {
            curCircNodeType = CircuitNodeTypes.SWAP;
          }

          else if (pitch == 50) {
            curCircNodeType = CircuitNodeTypes.QFT;
          }

          else if (pitch == 42) {
            curCircNodeType = CircuitNodeTypes.IDEN;
          }
        }
        refreshControllerPads();
      }
    }
  }
  else {
    post('Unexpected notePitchVelocity.length: ' + notePitchVelocity.length);
  }
}


/**
 * Analyze the circuit grid and create QASM code, sending
 * a statevector simulator message to an outlet.
 */
function createQasmFromGrid() {
  padsToBlink = [];

  var numCircuitWires = computeNumWires();
  var qasmHeaderStr = 'qreg q[' + numCircuitWires + '];' + ' creg c[' + numCircuitWires + '];';
  var qasmGatesStr = '';

  for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
    numConsecutiveQftRowsInCol = 0;
    for (var rowIdx = 0; rowIdx < numCircuitWires; rowIdx++) {
      qasmGatesStr = addGateFromGrid(qasmGatesStr, rowIdx, colIdx);
    }
  }

  // If circuit is empty, add an identity gate
  if (qasmGatesStr.trim().length == 0) {
    qasmGatesStr = ' id q[0];'
  }

  qasm = qasmHeaderStr + qasmGatesStr;
  refreshControllerPads();

  // Send statevector simulator message with QASM to outlet
  outlet(0, 'svsim', qasm);
}


/**
 * Creates a quantum gate from an element in the circuit grid
 * and adds it to the supplied QuantumCircuit instance
 *
 * @param qasmStr Current QASM string
 * @param gridRow Zero-based row number on circuit grid
 * @param gridCol Zero-based column number on circuit grid
 * @returns QASM string for the gate
 */
function addGateFromGrid(qasmStr, gridRow, gridCol) {
  var circNodeType = circGrid[gridRow][gridCol];

  // TODO: DRY
  if (circNodeType == CircuitNodeTypes.QFT) {
    numConsecutiveQftRowsInCol++;

    if (gridRow + 1 == computeNumWires()) {
      qasmStr += constructQftCircuit(gridRow + 1 - numConsecutiveQftRowsInCol,
        numConsecutiveQftRowsInCol);
    }
  }
  else {
    if (numConsecutiveQftRowsInCol > 0) {
      // One or more previous rows had consecutive QFT gates
      qasmStr += constructQftCircuit(gridRow - numConsecutiveQftRowsInCol, numConsecutiveQftRowsInCol);

      numConsecutiveQftRowsInCol = 0;
    }
  }

  if (circNodeType == CircuitNodeTypes.H) {
    qasmStr += ' h q[' + gridRow + '];';
  }

  else if ((circNodeType >= CircuitNodeTypes.RX_0 && circNodeType <= CircuitNodeTypes.RX_15) ||
    circNodeType == CircuitNodeTypes.CTRL_X) {

    var ctrlWires = ctrlWiresInColumn(gridCol, gridRow);
    var rads = 0;
    var fracRads = rads / Math.pow(2, ctrlWires.length - 1);

    if (circNodeType == CircuitNodeTypes.CTRL_X) {
      rads = Math.PI;
    }
    else {
      rads = (circNodeType - CircuitNodeTypes.RX_0) * Math.PI / (NUM_PITCHES / 2);
    }

    if (circNodeType == CircuitNodeTypes.CTRL_X || circNodeType == CircuitNodeTypes.RX_8) {
      if (ctrlWires.length > 0) {
        circNodeType = CircuitNodeTypes.CTRL_X;
      }
      else {
        circNodeType = CircuitNodeTypes.RX_8;
      }
      circGrid[gridRow][gridCol] = circNodeType;

      refreshCircGrid();
      //informCircuitBtn(gridRow, gridCol);
    }

    if (ctrlWires.length == 0) {
      qasmStr += ' rx(' + rads + ') q[' + gridRow + '];';
    }
    else if (ctrlWires.length == 1) {
      ctrlWireNum = ctrlWires[0].wireNum;
      if (ctrlWires[0].isAntiCtrl) {
        qasmStr += ' x q[' + ctrlWireNum + ']; crx(' + rads + ') q[' + ctrlWireNum + '],' + 'q[' + gridRow + ']; x q[' + ctrlWireNum + '];';
      }
      else {
        qasmStr += ' crx(' + rads + ') q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
      }
    }
    else if (ctrlWires.length == 2) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length == 3) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length == 4) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length >= 5) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
      qasmStr += ctrlWires[4].isAntiCtrl ? ' x q[' + ctrlWires[4].wireNum + ']; ' : '';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[4].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[3].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[3].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' crx(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
      qasmStr += ctrlWires[4].isAntiCtrl ? ' x q[' + ctrlWires[4].wireNum + ']; ' : '';
    }
  }

  else if (circNodeType >= CircuitNodeTypes.RY_0 && circNodeType <= CircuitNodeTypes.RY_15) {
    var radStr = piOver8RadiansStr(circNodeType - CircuitNodeTypes.RY_0);
    qasmStr += ' ry(' + radStr + ') q[' + gridRow + '];';
  }

  else if (circNodeType >= CircuitNodeTypes.PHASE_0 && circNodeType <= CircuitNodeTypes.PHASE_15) {
    var ctrlWires = ctrlWiresInColumn(gridCol, gridRow);
    var rads = (circNodeType - CircuitNodeTypes.PHASE_0) * Math.PI / (NUM_PITCHES / 2);
    var fracRads = rads / Math.pow(2, ctrlWires.length - 1);

    // TODO: Determine if the following two lines are necessary
    // circGrid[gridRow][gridCol] = circNodeType;
    // informCircuitBtn(gridRow, gridCol);

    if (ctrlWires.length == 0) {
      qasmStr += ' p(' + rads + ') q[' + gridRow + '];';
    }
    else if (ctrlWires.length == 1) {
      ctrlWireNum = ctrlWires[0].wireNum;
      if (ctrlWires[0].isAntiCtrl) {
        qasmStr += ' x q[' + ctrlWireNum + ']; cp(' + rads + ') q[' + ctrlWireNum + '],' + 'q[' + gridRow + ']; x q[' + ctrlWireNum + '];';
      }
      else {
        qasmStr += ' cp(' + rads + ') q[' + ctrlWireNum + '],' + 'q[' + gridRow + '];';
      }
    }
    else if (ctrlWires.length == 2) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length == 3) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length == 4) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
    }
    else if (ctrlWires.length >= 5) {
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
      qasmStr += ctrlWires[4].isAntiCtrl ? ' x q[' + ctrlWires[4].wireNum + ']; ' : '';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[4].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[3].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[3].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[3].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[2].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[2].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[1].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[1].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[1].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[2].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';

      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[3].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + (-fracRads) + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';
      qasmStr += ' cx q[' + ctrlWires[4].wireNum + '],' + 'q[' + ctrlWires[0].wireNum + '];';
      qasmStr += ' cp(' + fracRads + ') q[' + ctrlWires[0].wireNum + '],' + 'q[' + gridRow + '];';

      // un-NOT the anti-control wires
      qasmStr += ctrlWires[0].isAntiCtrl ? ' x q[' + ctrlWires[0].wireNum + ']; ' : '';
      qasmStr += ctrlWires[1].isAntiCtrl ? ' x q[' + ctrlWires[1].wireNum + ']; ' : '';
      qasmStr += ctrlWires[2].isAntiCtrl ? ' x q[' + ctrlWires[2].wireNum + ']; ' : '';
      qasmStr += ctrlWires[3].isAntiCtrl ? ' x q[' + ctrlWires[3].wireNum + ']; ' : '';
      qasmStr += ctrlWires[4].isAntiCtrl ? ' x q[' + ctrlWires[4].wireNum + ']; ' : '';
    }
  }


  else if (circNodeType == CircuitNodeTypes.SWAP) {
    var otherSwapGateWireNum = swapGateRowInColumn(gridCol, gridRow);
    if (otherSwapGateWireNum != -1 && otherSwapGateWireNum < gridRow) {
      circGrid[gridRow][gridCol] = CircuitNodeTypes.SWAP;

      refreshCircGrid();
      //informCircuitBtn(gridRow, gridCol);

      qasmStr += ' swap q[' + otherSwapGateWireNum + '],' + 'q[' + gridRow + '];';
    }
  }

  return qasmStr;
}


/**
 * Given a grid column, return the row, excluding the current row,
 * in which a swap gate exists.
 *
 * @param colNum
 * @param excludingRow
 * @returns Zero-based row in which a swap gate exists, -1 if not present.
 */
function swapGateRowInColumn(colNum, excludingRow) {
  var swapGateRow = -1;
  for (var rowNum = 0; rowNum < NUM_GRID_ROWS; rowNum++) {
    if (rowNum != excludingRow && circGrid[rowNum][colNum] == CircuitNodeTypes.SWAP) {
      swapGateRow = rowNum;

      // TODO Make function from next line
      var swapMidiPitchA = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - excludingRow - 1) * CONTR_MAT_COLS) + colNum;
      if (padsToBlink.indexOf(swapMidiPitchA) == -1) {
        padsToBlink.push(swapMidiPitchA);
      }

      var swapMidiPitchB = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - swapGateRow - 1) * CONTR_MAT_COLS) + colNum;
      if (padsToBlink.indexOf(swapMidiPitchB) == -1) {
        padsToBlink.push(swapMidiPitchB);
      }

      break;
    }
  }
  return swapGateRow;
}


/**
 * Given a grid column, return an array that indicates the CTRL
 * and ANTI_CTRL that exist, and in which rows.
 *
 * @param colNum Zero-based grid column to check for control
 * @param gateRowNum Row that contains gate for which control is sought
 * @return Array of ControlWire instances
 */
function ctrlWiresInColumn(colNum, gateRowNum) {
  var controlWires = [];
  for (var rowNum = 0; rowNum < NUM_GRID_ROWS; rowNum++) {
    if (circGrid[rowNum][colNum] == CircuitNodeTypes.CTRL ||
      circGrid[rowNum][colNum] == CircuitNodeTypes.ANTI_CTRL) {
      controlWires.push(new ControlWire(rowNum,
        circGrid[rowNum][colNum] == CircuitNodeTypes.ANTI_CTRL));

      // TODO Make function from next line
      var ctrlWireMidiPitch = LOW_MIDI_PITCH +
        ((NUM_GRID_ROWS - rowNum - 1) * CONTR_MAT_COLS) + colNum;
      if (padsToBlink.indexOf(ctrlWireMidiPitch) == -1) {
        padsToBlink.push(ctrlWireMidiPitch);
      }

      var gateWireMidiPitch = LOW_MIDI_PITCH +
        ((NUM_GRID_ROWS - gateRowNum - 1) * CONTR_MAT_COLS) + colNum;
      if (padsToBlink.indexOf(gateWireMidiPitch) == -1) {
        padsToBlink.push(gateWireMidiPitch);
      }
    }
  }
  return controlWires;
}


/**
 * Construct a QFT circuit
 * TODO: Create better algorithm
 *
 * @param wireNum Wire on which first QFT gate was encountered
 * @param numWires Number of wires that QFT will occupy
 * @returns QASM string for QFT gate
 */
function constructQftCircuit(wireNum, numWires) {
  var qftQasm = '';

  if (numWires == 1) {
    qftQasm += ' h q[' + wireNum + '];';
  }
  else if (numWires == 2) {
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
  }
  else if (numWires == 3) {
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
  }
  else if (numWires == 4) {
    qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 3) + '];';
  }
  else if (numWires == 5) {
    qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + (wireNum + 4) + '];';
  }
  else if (numWires == 6) {
    qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' h q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' h q[' + (wireNum + 5) + '];';
  }
  else if (numWires == 7) {
    qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/64) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' h q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' h q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' h q[' + (wireNum + 6) + '];';
  }
  else if (numWires == 8) {
    qftQasm += ' swap q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' swap q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' swap q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' swap q[' + wireNum + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' h q[' + wireNum + '];';
    qftQasm += ' cp(pi/2) q[' + wireNum + '],' + 'q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/4) q[' + wireNum + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' h q[' + (wireNum + 1) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' h q[' + (wireNum + 2) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/64) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' h q[' + (wireNum + 3) + '];';
    qftQasm += ' cp(pi/128) q[' + (wireNum + 0) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/64) q[' + (wireNum + 1) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' h q[' + (wireNum + 4) + '];';
    qftQasm += ' cp(pi/32) q[' + (wireNum + 2) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/16) q[' + (wireNum + 3) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' h q[' + (wireNum + 5) + '];';
    qftQasm += ' cp(pi/8) q[' + (wireNum + 4) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/4) q[' + (wireNum + 5) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' h q[' + (wireNum + 6) + '];';
    qftQasm += ' cp(pi/2) q[' + (wireNum + 6) + '],' + 'q[' + (wireNum + 7) + '];';
    qftQasm += ' h q[' + (wireNum + 7) + '];';
  }

  return qftQasm;
}


/**
 * Determine how many wires are represented on the circGrid
 */
function computeNumWires() {
  var numWires = 1;
  var foundPopulatedRow = false;
  var rowIdx = NUM_GRID_ROWS - 1;

  while (!foundPopulatedRow && rowIdx > 0) {
    for (var colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
      if (circGrid[rowIdx][colIdx] != CircuitNodeTypes.EMPTY) {
        numWires = rowIdx + 1;
        foundPopulatedRow = true;
      }
    }
    rowIdx--;
  }

  return Math.max(numWires, MIN_CIRCUIT_WIRES);
}


/**
 * Ask the relevant circuit button to ascertain and update its state
 *
 * @param rowIdx Zero-based row number on circuit grid
 * @param colIdx Zero-based column number on circuit grid
 */
function informCircuitBtn(gridRowIdx, gridColIdx) {
  var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - gridRowIdx - 1) * CONTR_MAT_COLS) + gridColIdx;
  var circBtnObj = this.patcher.getnamed('circbtn' + midiPitch);
  circBtnObj.js.updateDisplay(circGrid[gridRowIdx][gridColIdx], controlFgColor,
    gridRowIdx == selCircGridRow && gridColIdx == selCircGridCol);
}


/**
 * Output the circuit grid to the console for debug purposes
 */
function printCircGrid() {
  post('\n');
  for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
    for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
      post(circGrid[rowIdx][colIdx] + ' ');
    }
    post('\n');
  }
}


/**
 * Draw this component, which is currently just a label. The rest of
 * the UI consists of components placed in the Max UI designer tool.
 * TODO: Ascertain whether there is a better UI pattern to use.
 */
function draw() {
  var theta;
  var width = box.rect[2] - box.rect[0];


  with (sketch) {
    shapeslice(180, 1);
    // erase background
    glclearcolor(vbrgb[0], vbrgb[1], vbrgb[2], vbrgb[3]);
    glclear();

    glcolor(0, 0, 0, 1);

    moveto(-2.5, -0.4);
    fontsize(12);
    text("Push 2 proxy");
  }
}


function populateMidiClipsList() {
  // Send midi clips names to outlet
  outlet(1, 'clear');
  clipsPaths = [];
  var clipsNames = [];

  var live_set = new LiveAPI('live_set');
  var numTracks = live_set.getcount('tracks');

  for (var trackIdx = 0; trackIdx < numTracks; trackIdx++) {
    var track = new LiveAPI('live_set tracks ' + trackIdx);

    if (track.get('has_midi_input') != 0) {
      var numClipSlots = track.getcount('clip_slots');

      for (var clipSlotIdx = 0; clipSlotIdx < numClipSlots; clipSlotIdx++) {
        var clipSlot = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx);

        if (clipSlot.get('has_clip') != 0) {
          var clip = new LiveAPI('live_set tracks ' + trackIdx + ' clip_slots ' + clipSlotIdx + ' clip');

          var clipName = clip.getstring('name');
          if (clipName.length > 2) {
            if (clipName.substring(0, 1) == '\"') {
              clipName = clipName.substring(1, clipName.length - 1);
            }

            outlet(1, 'append', clipName);
            clipsPaths.push(clipName + '^' + clip.unquotedpath);
            clipsNames.push(clipName);
          }
        }
      }
    }
  }

  // TODO: Move
  var clipSelectDial = this.patcher.getnamed('clip_select');
  clipSelectDial.setattr('_parameter_range', clipsNames);

  // Zero the clip selector dial
  outlet(2, 'int', 0);
}


/**
 * Given a track path, pad/note names in display
 * @param trackPath
 */
function populatePadNoteNames(trackPath, pitchTransformIdx, transposeSemitones, reverseScale, halfScale, scaleType, useRagas, restPitchNum15) {
  if (padNoteNamesDirty) {
    padNoteNamesDirty = false;
    var track = new LiveAPI(trackPath);

    if (track.get('has_midi_input')) {
      var textbox = this.patcher.getnamed('pad_note[0]');
      var device = new LiveAPI(trackPath + ' devices ' + 0);
      var canHaveDrumPads = device.get('can_have_drum_pads') == 1;

      refreshPadNoteNames();

      if (canHaveDrumPads) {
        for (var drumPadIdx = 0; drumPadIdx < MAX_DRUMPADS; drumPadIdx++) {
          var drumPad =
            new LiveAPI(trackPath + ' devices ' + 0 + ' drum_pads ' + (LOW_DRUMPAD_MIDI + drumPadIdx));
          padNoteNames[drumPadIdx] = drumPad.getstring('name');
        }
      }

      for (var midiPitchIdx = 0; midiPitchIdx < NUM_PITCHES; midiPitchIdx++) {
        var noteName = '';
        if (restPitchNum15 && midiPitchIdx == NUM_PITCHES - 1) {
          noteName = 'REST';
        }
        else if (pitchTransformIdx == 0) {
          noteName = padNoteNames[midiPitchIdx];
        }
        else {
          noteName = padNoteNames[pitchIdxToMidi(midiPitchIdx, pitchTransformIdx, transposeSemitones,
            reverseScale, halfScale, scaleType, useRagas, false)];
        }

        // Update textbox
        textbox = this.patcher.getnamed('pad_note[' + midiPitchIdx + ']');
        textbox.setattr('text', removeQuotes(noteName));
      }
    }
  }
}

function refreshPadNoteNames() {
  padNoteNames = [];
  for (var midiNum = 0; midiNum <= 127; midiNum++) {
    padNoteNames.push(midi2NoteName(midiNum));
  }
}


function refreshControllerPads() {


  var controlSurface = new LiveAPI('control_surfaces 1'); //TODO: Inquire surface number
  //var controlNames = controlSurface.call('get_control_names');
  controlSurface.call('grab_midi');
  for (rowIdx = 0; rowIdx < NUM_GRID_ROWS; rowIdx++) {
    for (colIdx = 0; colIdx < NUM_GRID_COLS; colIdx++) {
      var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - rowIdx - 1) * CONTR_MAT_COLS) + colIdx;
      var padColor = circNodeType2Color(circGrid[rowIdx][colIdx]);

      controlSurface.call('send_midi', 144, midiPitch, 0);
      if (padsToBlink.indexOf(midiPitch) != -1) {
        controlSurface.call('send_midi', 147, midiPitch, padColor);
      }
      else {
        controlSurface.call('send_midi', 144, midiPitch, padColor);
      }
    }
  }

  // Refresh gate pads
  for (rowIdx = 0; rowIdx < CONTR_MAT_ROWS; rowIdx++) {
    for (colIdx = 0; colIdx < NUM_GATE_COLS; colIdx++) {
      var midiPitch = LOW_MIDI_PITCH + ((NUM_GRID_ROWS - rowIdx - 1) * CONTR_MAT_COLS) + NUM_GRID_COLS + colIdx;
      var padColor = circNodeType2Color(gateGrid[rowIdx][colIdx]);
      controlSurface.call('send_midi', 144, midiPitch, padColor);
    }
  }

  // For development, display all colors on pads
  // for (var midiNum = 36; midiNum < 100; midiNum++) {
  // 	var padColor = midiNum - 36;
  // 	//controlSurface.call('send_midi', 144, midiNum, padColor + 64);
  // 	controlSurface.call('send_midi', 144, midiNum, padColor);
  // }

  controlSurface.call('release_midi');
}


// Note ornaments in Carnatic music
var GamakaTypes = {
  NONE: -1,
  SLIDE_UP: 1, //
  SLIDE_UP_2_PITCHES: 2, //
  SLIDE_DOWN: 3, //
  ASCENDING_SLIDE_OSCILLATE: 4,
  ASCENDING_OSCILLATE: 5,
  DESCENDING_OSCILLATE: 6,
  HAMMER_ON_CHROMATIC: 7,  // Hammer-on from one semitone below
  HAMMER_ON_1_PITCH: 8  // Hammer-on from one pitch below
}


/**
 *
 * @param name
 * @param ascOffsets Array of offsets corresponding to scale degrees
 * @param descOffsets Required only if different than ascOffsets
 * @constructor
 */
function MusicalScale(nameArg, ascOffsetsArg, descOffsetsArg, ascGamakasArg, descGamakasArg) {
  this.name = nameArg;
  this.ascOffsets = ascOffsetsArg;
  this.ascGamakas = ascGamakasArg;
  this.descGamakas = descGamakasArg;

  if (typeof descOffsetsArg !== "undefined" &&
    descOffsetsArg.constructor === Array &&
    descOffsetsArg.length > 0) {
    this.descOffsets = descOffsetsArg;
  }
  else {
    this.descOffsets = ascOffsetsArg;
  }

  if (typeof ascGamakasArg !== "undefined" &&
    ascGamakasArg.constructor === Array &&
    ascGamakasArg.length > 0) {
    this.ascGamakas = ascGamakasArg;
  }
  else if (nameArg !== "undefined" && nameArg.indexOf("Raga") !== -1) {
    this.ascGamakas = [
      GamakaTypes.NONE,                      // Sa
      GamakaTypes.NONE,                      // Ri
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, // Ga
      GamakaTypes.NONE,                      // Ma
      GamakaTypes.NONE,                      // Pa
      GamakaTypes.ASCENDING_OSCILLATE,       // Da
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, // Ni
      GamakaTypes.NONE,                      // Sa
      GamakaTypes.NONE,                      // Ri
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, // Ga
      GamakaTypes.NONE,                      // Ma
      GamakaTypes.NONE,                      // Pa
      GamakaTypes.ASCENDING_OSCILLATE,       // Da
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, // Ni
      GamakaTypes.NONE,                      // Sa
      GamakaTypes.NONE                      // Ri
    ];
  }
  else {
    this.ascGamakas = [
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE
    ];
  }

  if (typeof descGamakasArg !== "undefined" &&
    descGamakasArg.constructor === Array &&
    descGamakasArg.length > 0) {
    this.descGamakas = descGamakasArg;
  }
  else if (nameArg !== "undefined" && nameArg.indexOf("Raga") !== -1) {
    //else if (this.isRaga()){
    this.descGamakas = [
      GamakaTypes.NONE,                      // Sa
      GamakaTypes.SLIDE_DOWN,                // Ri
      GamakaTypes.DESCENDING_OSCILLATE,      // Ga
      GamakaTypes.SLIDE_UP_2_PITCHES,        // Ma
      GamakaTypes.NONE,                      // Pa
      GamakaTypes.SLIDE_DOWN,                // Da
      GamakaTypes.DESCENDING_OSCILLATE,      // Ni
      GamakaTypes.SLIDE_UP_2_PITCHES,        // Sa
      GamakaTypes.SLIDE_DOWN,                // Ri
      GamakaTypes.DESCENDING_OSCILLATE,      // Ga
      GamakaTypes.SLIDE_UP_2_PITCHES,        // Ma
      GamakaTypes.NONE,                      // Pa
      GamakaTypes.SLIDE_DOWN,                // Da
      GamakaTypes.DESCENDING_OSCILLATE,      // Ni
      GamakaTypes.SLIDE_UP_2_PITCHES,        // Sa
      GamakaTypes.SLIDE_DOWN                // Ri
    ];
  }
  else {
    this.descGamakas = [
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE,
      GamakaTypes.NONE
    ];
  }
}

(MusicalScale.prototype).isRaga = function () {
  return this.name !== "undefined" && this.name.indexOf("Raga") !== -1;
};

// Supported musical scales
var musicalScales = [
  new MusicalScale('Major',
    [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24, 26]),
  new MusicalScale('NatMinor',
    [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24, 26]),
  new MusicalScale('HarmMinor',
    [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19, 20, 23, 24, 26]),
  new MusicalScale('MelMinor',
    [0, 2, 3, 5, 7, 9, 11, 12, 14, 15, 17, 19, 21, 23, 24, 26],
    [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24, 26]),
  new MusicalScale('Chrom',
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  new MusicalScale('PentMaj',
    [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36]),
  new MusicalScale('PentMin',
    [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34, 36]),
  new MusicalScale('TezetaMin',
    [0, 2, 3, 7, 8, 12, 14, 15, 19, 20, 24, 26, 27, 31, 32, 36]),
  new MusicalScale('Ambassel',
    [0, 1, 5, 7, 8, 12, 13, 17, 19, 20, 24, 25, 29, 31, 32, 36]),
  new MusicalScale('Raga01',
    [0, 1, 2, 5, 7, 8, 9, 12, 13, 14, 17, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga02',
    [0, 1, 2, 5, 7, 8, 10, 12, 13, 14, 17, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga03',
    [0, 1, 2, 5, 7, 8, 11, 12, 13, 14, 17, 19, 20, 23, 24, 25]),
  new MusicalScale('Raga04',
    [0, 1, 2, 5, 7, 9, 10, 12, 13, 14, 17, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga05',
    [0, 1, 2, 5, 7, 9, 11, 12, 13, 14, 17, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga06',
    [0, 1, 2, 5, 7, 10, 11, 12, 13, 14, 17, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga07',
    [0, 1, 3, 5, 7, 8, 9, 12, 13, 15, 17, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga08',
    [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga09',
    [0, 1, 3, 5, 7, 8, 11, 12, 13, 15, 17, 19, 20, 23, 24, 25]),
  new MusicalScale('Raga10',
    [0, 1, 3, 5, 7, 9, 10, 12, 13, 15, 17, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga11',
    [0, 1, 3, 5, 7, 9, 11, 12, 13, 15, 17, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga12',
    [0, 1, 3, 5, 7, 10, 11, 12, 13, 15, 17, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga13',
    [0, 1, 4, 5, 7, 8, 9, 12, 13, 16, 17, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga14',
    [0, 1, 4, 5, 7, 8, 10, 12, 13, 16, 17, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga15',
    [0, 1, 4, 5, 7, 8, 11, 12, 13, 16, 17, 19, 20, 23, 24, 25]),
  new MusicalScale('MalahariRaga',
    [0, 1, -1, 5, 7, 8, -1, 12, 13, -1, 17, 19, 20, -1, 24, 25],
    [0, 1, 4, 5, 7, 8, -1, 12, 13, 16, 17, 19, 20, -1, 24, 25]),
  new MusicalScale('Raga16',
    [0, 1, 4, 5, 7, 9, 10, 12, 13, 16, 17, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga17',
    [0, 1, 4, 5, 7, 9, 11, 12, 13, 16, 17, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga18',
    [0, 1, 4, 5, 7, 10, 11, 12, 13, 16, 17, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga19',
    [0, 2, 3, 5, 7, 8, 9, 12, 14, 15, 17, 19, 20, 21, 24, 26]),
  new MusicalScale('Raga20',
    [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24, 26]),
  new MusicalScale('Raga21',
    [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19, 20, 23, 24, 26]),
  new MusicalScale('Raga22',
    [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26],
    [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26],
    [GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, GamakaTypes.NONE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, GamakaTypes.NONE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE,
      GamakaTypes.NONE, GamakaTypes.NONE],
    [GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN, GamakaTypes.SLIDE_UP_2_PITCHES,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN, GamakaTypes.SLIDE_UP_2_PITCHES,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN,
      GamakaTypes.NONE, GamakaTypes.NONE]),
  new MusicalScale('AbheriRaga',
    [0, -1, 3, 5, 7, -1, 10, 12, -1, 15, 17, 19, -1, 22, 24, 26],
    [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26],
    [GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, GamakaTypes.NONE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE, GamakaTypes.NONE,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.ASCENDING_SLIDE_OSCILLATE,
      GamakaTypes.NONE, GamakaTypes.NONE],
    [GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN, GamakaTypes.SLIDE_UP_2_PITCHES,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN, GamakaTypes.SLIDE_UP_2_PITCHES,
      GamakaTypes.NONE, GamakaTypes.NONE,
      GamakaTypes.SLIDE_DOWN,
      GamakaTypes.NONE, GamakaTypes.NONE]),
  new MusicalScale('Raga23',
    [0, 2, 3, 5, 7, 9, 11, 12, 14, 15, 17, 19, 21, 23, 24, 26]),
  new MusicalScale('Raga24',
    [0, 2, 3, 5, 7, 10, 11, 12, 14, 15, 17, 19, 22, 23, 24, 26]),
  new MusicalScale('Raga25',
    [0, 2, 4, 5, 7, 8, 9, 12, 14, 16, 17, 19, 20, 21, 24, 26]),
  new MusicalScale('Raga26',
    [0, 2, 4, 5, 7, 8, 10, 12, 14, 16, 17, 19, 20, 22, 24, 26]),
  new MusicalScale('Raga27',
    [0, 2, 4, 5, 7, 8, 11, 12, 14, 16, 17, 19, 20, 23, 24, 26]),
  new MusicalScale('Raga28',
    [0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 22, 24, 26]),
  new MusicalScale('Raga29',
    [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24, 26]),
  new MusicalScale('Raga30',
    [0, 2, 4, 5, 7, 10, 11, 12, 14, 16, 17, 19, 22, 23, 24, 26]),
  new MusicalScale('Raga31',
    [0, 3, 4, 5, 7, 8, 9, 12, 15, 16, 17, 19, 20, 21, 24, 27]),
  new MusicalScale('Raga32',
    [0, 3, 4, 5, 7, 8, 10, 12, 15, 16, 17, 19, 20, 22, 24, 27]),
  new MusicalScale('Raga33',
    [0, 3, 4, 5, 7, 8, 11, 12, 15, 16, 17, 19, 20, 23, 24, 27]),
  new MusicalScale('Raga34',
    [0, 3, 4, 5, 7, 9, 10, 12, 15, 16, 17, 19, 21, 22, 24, 27]),
  new MusicalScale('Raga35',
    [0, 3, 4, 5, 7, 9, 11, 12, 15, 16, 17, 19, 21, 23, 24, 27]),
  new MusicalScale('Raga36',
    [0, 3, 4, 5, 7, 10, 11, 12, 15, 16, 17, 19, 22, 23, 24, 27]),
  new MusicalScale('Raga37',
    [0, 1, 2, 6, 7, 8, 9, 12, 13, 14, 18, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga38',
    [0, 1, 2, 6, 7, 8, 10, 12, 13, 14, 18, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga39',
    [0, 1, 2, 6, 7, 8, 11, 12, 13, 14, 18, 19, 20, 23, 24, 25]),
  new MusicalScale('Raga40',
    [0, 1, 2, 6, 7, 9, 10, 12, 13, 14, 18, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga41',
    [0, 1, 2, 6, 7, 9, 11, 12, 13, 14, 18, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga42',
    [0, 1, 2, 6, 7, 10, 11, 12, 13, 14, 18, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga43',
    [0, 1, 3, 6, 7, 8, 9, 12, 13, 15, 18, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga44',
    [0, 1, 3, 6, 7, 8, 10, 12, 13, 15, 18, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga45',
    [0, 1, 3, 6, 7, 8, 11, 12, 13, 15, 18, 19, 20, 23, 24, 25]),
  new MusicalScale('Raga46',
    [0, 1, 3, 6, 7, 9, 10, 12, 13, 15, 18, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga47',
    [0, 1, 3, 6, 7, 9, 11, 12, 13, 15, 18, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga48',
    [0, 1, 3, 6, 7, 10, 11, 12, 13, 15, 18, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga49',
    [0, 1, 4, 6, 7, 8, 9, 12, 13, 16, 18, 19, 20, 21, 24, 25]),
  new MusicalScale('Raga50',
    [0, 1, 4, 6, 7, 8, 10, 12, 13, 16, 18, 19, 20, 22, 24, 25]),
  new MusicalScale('Raga51',
    [0, 1, 4, 6, 7, 8, 11, 12, 13, 16, 18, 19, 20, 23, 24, 25]),
  new MusicalScale('Raga52',
    [0, 1, 4, 6, 7, 9, 10, 12, 13, 16, 18, 19, 21, 22, 24, 25]),
  new MusicalScale('Raga53',
    [0, 1, 4, 6, 7, 9, 11, 12, 13, 16, 18, 19, 21, 23, 24, 25]),
  new MusicalScale('Raga54',
    [0, 1, 4, 6, 7, 10, 11, 12, 13, 16, 18, 19, 22, 23, 24, 25]),
  new MusicalScale('Raga55',
    [0, 2, 3, 6, 7, 8, 9, 12, 14, 15, 18, 19, 20, 21, 24, 26]),
  new MusicalScale('Raga56',
    [0, 2, 3, 6, 7, 8, 10, 12, 14, 15, 18, 19, 20, 22, 24, 26]),
  new MusicalScale('Raga57',
    [0, 2, 3, 6, 7, 8, 11, 12, 14, 15, 18, 19, 20, 23, 24, 26]),
  new MusicalScale('Raga58',
    [0, 2, 3, 6, 7, 9, 10, 12, 14, 15, 18, 19, 21, 22, 24, 26]),
  new MusicalScale('Raga59',
    [0, 2, 3, 6, 7, 9, 11, 12, 14, 15, 18, 19, 21, 23, 24, 26]),
  new MusicalScale('Raga60',
    [0, 2, 3, 6, 7, 10, 11, 12, 14, 15, 18, 19, 22, 23, 24, 26]),
  new MusicalScale('Raga61',
    [0, 2, 4, 6, 7, 8, 9, 12, 14, 16, 18, 19, 20, 21, 24, 26]),
  new MusicalScale('Raga62',
    [0, 2, 4, 6, 7, 8, 10, 12, 14, 16, 18, 19, 20, 22, 24, 26]),
  new MusicalScale('Raga63',
    [0, 2, 4, 6, 7, 8, 11, 12, 14, 16, 18, 19, 20, 23, 24, 26]),
  new MusicalScale('Raga64',
    [0, 2, 4, 6, 7, 9, 10, 12, 14, 16, 18, 19, 21, 22, 24, 26]),
  new MusicalScale('Raga65',
    [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 24, 26]),
  new MusicalScale('Raga66',
    [0, 2, 4, 6, 7, 10, 11, 12, 14, 16, 18, 19, 22, 23, 24, 26]),
  new MusicalScale('Raga67',
    [0, 3, 4, 6, 7, 8, 9, 12, 15, 16, 18, 19, 20, 21, 24, 27]),
  new MusicalScale('Raga68',
    [0, 3, 4, 6, 7, 8, 10, 12, 15, 16, 18, 19, 20, 22, 24, 27]),
  new MusicalScale('Raga69',
    [0, 3, 4, 6, 7, 8, 11, 12, 15, 16, 18, 19, 20, 23, 24, 27]),
  new MusicalScale('Raga70',
    [0, 3, 4, 6, 7, 9, 10, 12, 15, 16, 18, 19, 21, 22, 24, 27]),
  new MusicalScale('Raga71',
    [0, 3, 4, 6, 7, 9, 11, 12, 15, 16, 18, 19, 21, 23, 24, 27]),
  new MusicalScale('Raga72',
    [0, 3, 4, 6, 7, 10, 11, 12, 15, 16, 18, 19, 22, 23, 24, 27]),
];


function getMusicalScaleNames(retrieveRagas) {
  var scaleNames = [];
  for (var scalesIdx = 0; scalesIdx < musicalScales.length; scalesIdx++) {
    if (musicalScales[scalesIdx].isRaga() == retrieveRagas) {
      scaleNames.push(musicalScales[scalesIdx].name);
    }
  }
  return scaleNames;
}


function getMusicalScaleIndex(scaleRagaIdx, retrieveRaga) {
  var musicalScaleIdx = 0;

  for (var scalesIdx = 0; scalesIdx < musicalScales.length; scalesIdx++) {
    if (musicalScales[scalesIdx].isRaga() == retrieveRaga) {
      if (musicalScaleIdx >= scaleRagaIdx) {
        return scalesIdx;
      }
      else {
        musicalScaleIdx++;
      }
    }
  }
  return 0;
}


/**
 * Given a pi/8 rotation, returns a String that expresses
 * it in radians
 *
 * @param piOver8Arg int in range 0-15 inclusive
 * @returns String that expresses radians
 */
function piOver8RadiansStr(piOver8Arg) {
  radStr = '0';
  if (piOver8Arg == 1) {
    radStr = 'pi/8';
  }
  else if (piOver8Arg == 2) {
    radStr = 'pi/4';
  }
  else if (piOver8Arg == 3) {
    radStr = '3*pi/8';
  }
  else if (piOver8Arg == 4) {
    radStr = 'pi/2';
  }
  else if (piOver8Arg == 5) {
    radStr = '5*pi/8';
  }
  else if (piOver8Arg == 6) {
    radStr = '3*pi/4';
  }
  else if (piOver8Arg == 7) {
    radStr = '7*pi/8';
  }
  else if (piOver8Arg == 8) {
    radStr = 'pi';
  }
  else if (piOver8Arg == 9) {
    radStr = '9*pi/8';
  }
  else if (piOver8Arg == 10) {
    radStr = '5*pi/4';
  }
  else if (piOver8Arg == 11) {
    radStr = '11*pi/8';
  }
  else if (piOver8Arg == 12) {
    radStr = '3*pi/2';
  }
  else if (piOver8Arg == 13) {
    radStr = '13*pi/8';
  }
  else if (piOver8Arg == 14) {
    radStr = '7*pi/4';
  }
  else if (piOver8Arg == 15) {
    radStr = '15*pi/8';
  }
  return radStr;
}


/**
 * Convert a midi note number into a note name
 * @param noteNum MIDI number for a note
 * @returns Name (e.g. C3) of the note
 */
function midi2NoteName(noteNum) {
  var note = '';
  if (noteNum >= 0 && noteNum <= 127) {
    var octave = Math.floor(noteNum / 12) - 2;
    var note = "C C#D D#E F F#G G#A A#B ".substring((noteNum % 12) * 2, (noteNum % 12) * 2 + 2);
    note = note.trim() + octave;
  }
  else {
    post('Supplied noteNum ' + noteNum + ' is unexpectedly out of range');
  }
  return note;
}


/**
 * Remove quotes from a string
 * @param str
 * @returns {string}
 */
function removeQuotes(str) {
  var unquotedStr = str;
  if (str.length >= 3) {
    if (str.charAt(0) == '\"' &&
      str.charAt(str.length - 1) == '\"') {
      unquotedStr = str.substring(1, str.length - 1);
    }
  }
  return unquotedStr;
}


/**
 * Given a circuit node type, compute a color.
 * @param circNodeTypeNum
 * @returns {number}
 */
function circNodeType2Color(circNodeTypeNum) {
  var colorNum = 0;

  if (circNodeTypeNum == CircuitNodeTypes.EMPTY) {
    colorNum = 0;
  }
  if (circNodeTypeNum == CircuitNodeTypes.H) {
    colorNum = 122;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.CTRL) {
    colorNum = 123;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.ANTI_CTRL) {
    colorNum = 7;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.CTRL_X) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.IDEN) {
    colorNum = 124;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.SWAP) {
    colorNum = 51;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.QFT) {
    colorNum = 43;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RX_0) {
    colorNum = 25;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_1) {
    colorNum = 25;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_2) {
    colorNum = 127;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_3) {
    colorNum = 127;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_4) {
    colorNum = 68;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_5) {
    colorNum = 68;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_6) {
    colorNum = 67;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_7) {
    colorNum = 67;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_8) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_9) {
    colorNum = 2;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_10) {
    colorNum = 4;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_11) {
    colorNum = 4;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_12) {
    colorNum = 3;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_13) {
    colorNum = 3;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_14) {
    colorNum = 29;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RX_15) {
    colorNum = 29;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.RY_0) {
    colorNum = 8;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_1) {
    colorNum = 8;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_2) {
    colorNum = 10;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_3) {
    colorNum = 10;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_4) {
    colorNum = 11;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_5) {
    colorNum = 11;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_6) {
    colorNum = 31;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_7) {
    colorNum = 31;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_8) {
    colorNum = 32;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_9) {
    colorNum = 32;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_10) {
    colorNum = 89;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_11) {
    colorNum = 89;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_12) {
    colorNum = 93;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_13) {
    colorNum = 93;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_14) {
    colorNum = 97;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.RY_15) {
    colorNum = 97;
  }

  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_0) {
    colorNum = 95;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_1) {
    colorNum = 95;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_2) {
    colorNum = 103;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_3) {
    colorNum = 103;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_4) {
    colorNum = 99;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_5) {
    colorNum = 99;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_6) {
    colorNum = 125;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_7) {
    colorNum = 125;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_8) {
    colorNum = 18;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_9) {
    colorNum = 18;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_10) {
    colorNum = 19;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_11) {
    colorNum = 19;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_12) {
    colorNum = 24;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_13) {
    colorNum = 24;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_14) {
    colorNum = 113;
  }
  else if (circNodeTypeNum == CircuitNodeTypes.PHASE_15) {
    colorNum = 113;
  }

  return colorNum;
}

/**
 * Compute a MIDI pitch given a diatonic pitch, octave number, and
 * number of semitones to transpose.
 * @param pitchIdx Diatonic pitch index (0 - NUM_PITCHES-1)
 * @param transposeSemitones Number of semitones to transpose the outputted note (0 - 11)
 * @returns {number}
 */
function pitchIdxToMidi(pitchIdx, octaveNumPlus2, transposeSemitones,
                        reverseScale, halfScale, scaleRagaIdx, useRagas, useDescOffsets) {
  var scaleOffsets = musicalScales[0].ascOffsets; // Default to Major scale

  var scaleType = getMusicalScaleIndex(scaleRagaIdx, useRagas);

  if (scaleType < musicalScales.length) {
    scaleOffsets = useDescOffsets ? musicalScales[scaleType].descOffsets : musicalScales[scaleType].ascOffsets;
  }

  var octaveNum = octaveNumPlus2 - 2;
  var midiPitch = 0;
  if (reverseScale) {
    pitchIdx = NUM_PITCHES - pitchIdx - 1;
  }
  if (halfScale) {
    pitchIdx = Math.floor(pitchIdx / 2.0);
  }

  if (pitchIdx < 0 || pitchIdx >= NUM_PITCHES) {
    // TODO: Diagnose why this condition often occurs
    //post('\nIn pitchIdxToMidi, pitchIdx unexpectedly: ' + pitchIdx + ', setting to 0');
    pitchIdx = 0;
  }

  if (scaleOffsets[pitchIdx] != -1) {
    midiPitch = octaveNum * 12 + 24 + scaleOffsets[pitchIdx];
    midiPitch += transposeSemitones;
  }
  else {
    // Scale doesn't contain requested degree so signal with 127
    midiPitch = 127;
  }

  return midiPitch;
}










