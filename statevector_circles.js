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
 * Component that renders a statevector as circles with phases and amplitudes
 *
 */

// Number of values in addition to the circuit grid
// stored as metadata in the clip
var NUM_ADDITIONAL_METADATA_VALUES = 7;

// Threshold for regarding a state as having any probability
var PROBABILITY_THRESHOLD = 0.24;

var SV_GRID_POS_X = 689.0;
var SV_GRID_POS_Y = 5.0;
var SV_GRID_HEIGHT = 160;
var SV_GRID_STEP_WIDTH = 3.125;
var SV_GRID_HORIZ_PADDING = 2; // pixels between each of the four grids
var SV_GRID_FULL_SIZE_MAX_BASIS_STATES = 64;

var SCALES_SHORT_NAME = 'Scales';
var RAGAS_SHORT_NAME = 'Ragas';

var maxDisplayedSteps = 256;
var numSvGrids = 4;

// Inlet 0 receives "viz" messages with a statevector to display
// Inlet 1 receives global phase shift integer from 0 - NUM_PITCHES
// Inlet 2 receives instrument type selection:
//     0: kit (midi is chromatic, from 36 - 51
//     1: diatonic octave -1,
//     2: diatonic octave 0
//     3: diatonic octave 1
//     4: diatonic octave 2
//     5: diatonic octave 3
//     6: diatonic octave 4
//     7: diatonic octave 5
//     8: diatonic octave 6
// Inlet 3 receives name of current clip
// Inlet 4 receives 0 to shift global phase in such a way
//   that makes the first basis state (with probability above a threshold)
//   have a 0 pitch index (if possible).
//   Receiving 1 indicates that global phase should be locked.
// Inlet 5 receives number of semitones to transpose
// Inlet 6 receives messages that indicate whether notes are to be legato
// Inlet 7 receives messages that indicate whether scale is to be reversed
// Inlet 8 receives messages that indicate whether scale is to be halved
// Inlet 9 receives messages that indicate current scale type
// Inlet 10 receives messages that indicate current beats in cycle A
// Inlet 11 receives messages that indicate whether pitch num 15 is a rest
// Inlet 12 receives messages that indicate current beats in cycle B
// Inlet 13 receives 0 for scales, and 1 for ragas, to populate
//   the Scales/Ragas slider in the UI.
// Inlet 14 receives messages that indicate whether notes are to be stochastic
// Inlet 15 receives messages that indicate whether notes are to be stochastic
this.inlets = 16;

// Outlet 0 sends global phase shift
// Outlet 1 sends pitch transform index
// Outlet 2 sends number of semitones transposition
// Outlet 3 sends indication of whether notes are to be legato
// Outlet 4 sends indication of whether scale is to be reversed
// Outlet 5 sends indication of whether scale is to be halved
// Outlet 6 sends the current scale type value
// Outlet 7 sends the current beats in cycle A
// Outlet 8 sends indication of whether pitch num 15 is a rest
// Outlet 9 sends the current beats in a cycle B
// Outlet 10 sends 0 if pitch is to be locked, or 1 if phase is to be locked
// Outlet 11 sends width messages to this.device
// Outlet 12 sends 0 if scales, or 1 if ragas, are to be displayed in the UI
// Outlet 13 sends indication of whether notes are to be stochastic
// Outlet 14 sends indication of whether notes are to be quantized
this.outlets = 15;

sketch.default2d();
var vbrgb = [1., 1., 1., 1.];

// Current statevector
var svArray = [1.0, 0.0, 0.0, 0.0];


// Number of radians to add to the phase of each state to
// apply the desired global phase
var globalPhaseShift = 0.0;

// MIDI (0-127) representation of global phase shift value
var globalPhaseShiftMidi = 0;

// Flag that indicates not to zero the globalPhaseShift
var preserveGlobalPhaseShift = false;

// Flag that indicates whether note duration should be
// until the the next note begins playing.
var legato = false;

// Instrument type selection
// TODO: Find better name
var pitchTransformIndex = 0;

// Number of semitones to transpose
var numTransposeSemitones = 0;


// Use inverted scale
var reverseScale = false;

// Use half the number of pitches in the scale
var halfScale = false;

// Make pitch number 15 a rest
var restPitchNum15 = true;

// Compute note pitches with stochastic approach
var stochasticPitches = false;
var tmpStochasticPitches = false;


// Type of scale to use
var curScaleType = 0; //Major

// Flag that indicates whether to use ragas instead of scales
var useRagasInsteadOfScales = false;


// Length of cycle A
var curCycleLengthA = 2;

// Length of cycle B
var curCycleLengthB = 2;

var prevPiOver8Phase = 0;

var curClipPath = "";

var beatsPerMeasure = 4.0;

var curNumBasisStates = 4;

var quantizeNotes = false;

// Dictionary for sending notes to Live
var notesDict = {
  notes: []
};


// Array booleans indicating whether probability is above threshold
var basisStatesSignificantProbs = [];

// Array of cumulative probabilities for all basis states
var accumBasisStatesProbs = [];

// The phase for each basis state
var basisStatePiOver8Phases = [];


draw();
refresh();


function msg_int(val) {
  if (inlet != 3 && inlet != 14) {
    // Turn off stochastic behavior
    outlet(13, 'int', 0);
  }

  if (inlet == 1) {
    //preserveGlobalPhaseShift = (val > 0);
    globalPhaseShiftMidi = val;
    setGlobalPhaseShift(val);
  }
  else if (inlet == 2) {
    pitchTransformIndex = val;

    // Conditionally disable Folded and Inverted toggle buttons
    var foldedToggle = this.patcher.getnamed("folded_toggle");
    var invertedToggle = this.patcher.getnamed("inverted_toggle");

    foldedToggle.setattr('active', pitchTransformIndex == 0 ? 0 : 1);
    foldedToggle.setattr('ignoreclick', pitchTransformIndex == 0 ? 1 : 0);

    invertedToggle.setattr('active', pitchTransformIndex == 0 ? 0 : 1);
    invertedToggle.setattr('ignoreclick', pitchTransformIndex == 0 ? 1 : 0);

    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 3) {
    var tempPreserveGlobalPhaseShift = preserveGlobalPhaseShift;
    preserveGlobalPhaseShift = true;
    var qpo = this.patcher.getnamed("qasmpad");
    curClipPath = qpo.js.getPathByClipNameIdx(val);
    qpo.js.padNoteNamesDirty = true;
    populateCircGridFromClip();

    preserveGlobalPhaseShift = tempPreserveGlobalPhaseShift;
  }
  else if (inlet == 4) {
    // Preserve either global phase, or first pitch with above threshold probability
    preserveGlobalPhaseShift = (val > 0);

    // Conditionally disable phase shift
    var phaseShiftDial = this.patcher.getnamed("phase_shift_dial");
    phaseShiftDial.setattr('ignoreclick', val == 0);

    var tc = phaseShiftDial.getattr('textcolor', 1, 1, 1, 1);
    var alpha = val > 0 ? 1 : 0.2;
    phaseShiftDial.setattr('textcolor', tc[0], tc[1], tc[2], alpha);
    phaseShiftDial.setattr('slidercolor', tc[0], tc[1], tc[2], alpha);
    phaseShiftDial.setattr('tribordercolor', tc[0], tc[1], tc[2], alpha);
  }
  else if (inlet == 5) {
    //preserveGlobalPhaseShift = true;
    numTransposeSemitones = val;
    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 6) {
    // Make notes legato
    legato = (val > 0);
    computeProbsPhases();
  }
  else if (inlet == 7) {
    // Make scale reversed
    reverseScale = (val > 0);
    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 8) {
    // Make scale half its range
    halfScale = (val > 0);
    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 9) {
    // Set the scale type
    curScaleType = val;
    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 10) {
    // Set cycle A length
    curCycleLengthA = val;
    computeProbsPhases();
  }
  else if (inlet == 11) {
    // Make pitch number 15 a rest
    restPitchNum15 = (val > 0);
    var qpo = this.patcher.getnamed("qasmpad");
    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 12) {
    // Set cycle B length
    curCycleLengthB = val;
    computeProbsPhases();
  }
  else if (inlet == 13) {
    // Value 0 for scales, 1 for ragas
    useRagasInsteadOfScales = (val > 0);
    //curScaleType = 0;

    // TODO: Decide how to handle
    //outlet(6, 'int', 0); // Set to scale/raga index 0

    var qpo = this.patcher.getnamed("qasmpad");

    var scaleTypeDial = this.patcher.getnamed("scale_type");
    scaleTypeDial.setattr('_parameter_shortname',
      val == 0 ? SCALES_SHORT_NAME : RAGAS_SHORT_NAME);
    // TODO: Load slider/dial with scales or raga names
    scaleTypeDial.setattr('_parameter_range',
      qpo.js.getMusicalScaleNames(val > 0));

    qpo.js.padNoteNamesDirty = true;
    computeProbsPhases();
  }
  else if (inlet == 14) {
    // Use stochastic approach for note pitches
    stochasticPitches = (val > 0);

    var tempPreserveGlobalPhaseShift = preserveGlobalPhaseShift;
    preserveGlobalPhaseShift = true;
    computeProbsPhases();
    preserveGlobalPhaseShift = tempPreserveGlobalPhaseShift;
  }
  else if (inlet == 15) {
    // Quantize notes into harmonic intervals or chords
    quantizeNotes = (val > 0);
    computeProbsPhases();
  }
}


/**
 * Accept a viz message, which visualizes a statevector
 *
 * @param svlist Statevector as a list of floats, with each pair of floats
 *               expressing one complex number (without a character such as i
 *               that symbolizes an imaginary component.
 */
function viz(svlist) {
  // Turn off stochastic behavior
  outlet(13, 'int', 0);
  svArray = svlist.toString().split(' ');
  curNumBasisStates = svArray.length / 2;
  dimSvGrid();
  computeProbsPhases();
}


function dimSvGrid() {
  for (var gIdx = 0; gIdx < numSvGrids; gIdx++) {
    var svGrid = this.patcher.getnamed('svgrid[' + gIdx + ']');

    var gridWidth = Math.min(curNumBasisStates, SV_GRID_FULL_SIZE_MAX_BASIS_STATES) * SV_GRID_STEP_WIDTH;
    var posX = SV_GRID_POS_X + gIdx * (gridWidth + SV_GRID_HORIZ_PADDING);
    svGrid.setattr('presentation_position', posX, SV_GRID_POS_Y);
    svGrid.setattr('presentation_size', gridWidth, SV_GRID_HEIGHT);
    svGrid.setattr('columns', Math.floor(curNumBasisStates / numSvGrids));
  }
  outlet(11, 'setwidth', SV_GRID_POS_X + numSvGrids * (gridWidth + SV_GRID_HORIZ_PADDING));
}

function clearSvGrid() {
  for (var gIdx = 0; gIdx < numSvGrids; gIdx++) {
    var svGrid = this.patcher.getnamed('svgrid[' + gIdx + ']');
    svGrid.message('clear');
  }
}

function setSvGridCell(colIdx, rowIdx, measured) {
  var svGridIdx = Math.floor(colIdx / curNumBasisStates * numSvGrids);
  var svGrid = this.patcher.getnamed('svgrid[' + svGridIdx + ']');
  var svGridColIdx = colIdx % (curNumBasisStates / numSvGrids);

  if (measured) {
    svGrid.setattr('stepcolor', 0.0, 1.0, 0.0, 1.0);
  }
  else {
    svGrid.setattr('stepcolor', 0.0, 0.0, 1.0, 1.0);
  }

  svGrid.message('setcell', svGridColIdx + 1, rowIdx + 1, 127);
}


/**
 * Sample from the probability distribution of all basis states,
 * simulating a measurement
 */
function sampleBasisStatesProbDist() {
  var retBasisState = 0;
  var qpo = this.patcher.getnamed("qasmpad");

  if (accumBasisStatesProbs != null && accumBasisStatesProbs.length == curNumBasisStates) {
    var rand = Math.random();
    for (var idx = 0; idx < accumBasisStatesProbs.length; idx++) {
      retBasisState = idx;
      if (rand <= accumBasisStatesProbs[idx]) {
        break;
      }
    }
  }
  return retBasisState;
}


/**
 * Compute probabilities and phases
 */
function computeProbsPhases() {
  var qpo = this.patcher.getnamed("qasmpad");
  clearSvGrid();
  var pitchNums = [];

  var numBasisStates = svArray.length / 2;

  var numBasisStatesWithNonZeroProbability = 0;

  var gamakaType = qpo.js.GamakaTypes.NONE;

  var globalPhaseShifted = false;

  var cumulativeProbs = 0;

  accumBasisStatesProbs = [];

  basisStatePiOver8Phases = [];
  basisStatesSignificantProbs = [];

  for (var i = 0; i < curNumBasisStates; i++) {
    basisStatePiOver8Phases.push(0);
    basisStatesSignificantProbs.push(false);
  }

  for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
    var real = svArray[svIdx];
    var imag = svArray[svIdx + 1];

    var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
    var probability = Math.pow(Math.abs(amplitude), 2);
    if (probability > 0) {
      numBasisStatesWithNonZeroProbability++;
    }

    // For stochastic option, store the probabilities of all the states
    if (stochasticPitches) {
      cumulativeProbs += probability;
      accumBasisStatesProbs.push(cumulativeProbs);
    }
  }

  for (var svIdx = 0; svIdx < svArray.length; svIdx += 2) {
    var real = svArray[svIdx];
    var imag = svArray[svIdx + 1];

    var amplitude = Math.sqrt(Math.pow(Math.abs(real), 2) + Math.pow(Math.abs(imag), 2));
    var probability = Math.pow(Math.abs(amplitude), 2);
    var pitchNum = -1;

    if (probability > PROBABILITY_THRESHOLD / numBasisStatesWithNonZeroProbability) {
      var polar = cartesianToPolar(real, imag);

      // If first basis state with significant probability has non-zero phase,
      // shift global phase by its phase
      if (!preserveGlobalPhaseShift && !globalPhaseShifted) {
        globalPhaseShifted = true;
        if (polar.theta < 0) {
          polar.theta += 2 * Math.PI;
        }

        var piOver8Phase = Math.round(polar.theta / (Math.PI / (qpo.js.NUM_PITCHES / 2)));
        piOver8Phase += qpo.js.NUM_PITCHES - prevPiOver8Phase;
        piOver8Phase = piOver8Phase % qpo.js.NUM_PITCHES;
        globalPhaseShiftMidi = (qpo.js.NUM_PITCHES - piOver8Phase) % qpo.js.NUM_PITCHES;

        outlet(0, 'int', globalPhaseShiftMidi);
      }

      var shiftedPhase = polar.theta + globalPhaseShift;
      if (shiftedPhase < 0.0) {
        shiftedPhase += (2 * Math.PI);
      }
      pitchNum = Math.round(shiftedPhase / (2 * Math.PI) * qpo.js.NUM_PITCHES + qpo.js.NUM_PITCHES, 0) % qpo.js.NUM_PITCHES;

      if (basisStatePiOver8Phases.length > svIdx / 2 &&
        basisStatesSignificantProbs.length > svIdx / 2) {
        basisStatePiOver8Phases[svIdx / 2] = pitchNum;
        basisStatesSignificantProbs[svIdx / 2] = true;
      }
      else {
        post('\nUnexpected basisStatePiOver8Phases length: ' + basisStatePiOver8Phases.length +
        ' or basisStatesSignificantProbs length: ' + basisStatesSignificantProbs.length);
      }

      if (!stochasticPitches) {
        if (svIdx / 2 < maxDisplayedSteps) {
          setSvGridCell((svIdx / 2), pitchNum, false);
        }
      }
    }
    if (svIdx / 2 < maxDisplayedSteps) {
      if (!basisStateIncluded(svIdx / 2, numBasisStates, curCycleLengthA, curCycleLengthB)) {
        for (var pIdx = 0; pIdx < qpo.js.NUM_PITCHES; pIdx++) {
          setSvGridCell((svIdx / 2), pIdx, false);
        }
      }
    }
    if (!stochasticPitches) {
      pitchNums.push(pitchNum);
    }
  }


  // In the case that stochastic pitches are desired,
  // iterate once again over the basis states and push
  // stochastic pitches into pitchNums
  if (stochasticPitches) {
    for (var basisStateIdx = 0; basisStateIdx < basisStatePiOver8Phases.length; basisStateIdx++) {
      if (basisStatesSignificantProbs[basisStateIdx]) {
        var measBasisState = sampleBasisStatesProbDist();

        var po8Phase = basisStatePiOver8Phases[measBasisState];

        pitchNums.push(po8Phase);
        if (basisStateIdx < maxDisplayedSteps) {
          setSvGridCell(basisStateIdx, po8Phase, true);
        }
      }
      else {
        pitchNums.push(-1);
      }
    }
  }


  // Set the notes into the clip
  notesDict.notes = [];
  var clip = new LiveAPI(curClipPath);
  clip.call('remove_notes_extended', 0, 128, 0, 256);

  var foundFirstPitch = false;
  var formerPitchNum = 0;
  var successorPitchNum = 0;

  var currentMidiNum = 0;

  // Tracks the beats in the loop
  var beatIdx = 0;

  for (var pnIdx = 0; pnIdx < pitchNums.length; pnIdx++) {
    if (basisStateIncluded(pnIdx, numBasisStates, curCycleLengthA, curCycleLengthB)) {
      currentMidiNum = qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
        pitchTransformIndex,
        numTransposeSemitones,
        reverseScale,
        halfScale,
        curScaleType,
        useRagasInsteadOfScales,
        pitchNums[pnIdx] <= formerPitchNum);

      if (pitchNums[pnIdx] > -1 && !(restPitchNum15 && pitchNums[pnIdx] == 15) && currentMidiNum < 127) {
        if (!foundFirstPitch) {
          prevPiOver8Phase = pitchNums[pnIdx];
          foundFirstPitch = true;
        }

        var duration = 0.25;
        var successorNoteFound = false;
        for (var remPnIdx = pnIdx + 1; remPnIdx < pitchNums.length; remPnIdx++) {
          var remMidiNum = qpo.js.pitchIdxToMidi(pitchNums[remPnIdx],
            pitchTransformIndex,
            numTransposeSemitones,
            reverseScale,
            halfScale,
            curScaleType,
            useRagasInsteadOfScales,
            pitchNums[remPnIdx] <= formerPitchNum);
          if (pitchNums[remPnIdx] > -1 && !(restPitchNum15 && pitchNums[remPnIdx] == 15) && remMidiNum < 127) {
            successorNoteFound = true;
            successorPitchNum = pitchNums[remPnIdx];
            if (legato) {
              duration = (remPnIdx - pnIdx) / beatsPerMeasure;
            }
            break;
          }
        }
        if (!successorNoteFound) {
          if (legato) {
            // No successor note was found so duration of final note extends
            // to the end of the loop
            duration = (pitchNums.length - pnIdx) / beatsPerMeasure;
          }
        }

        if (pitchTransformIndex == 0) {
          notesDict.notes.push(
            {
              pitch: pitchNums[pnIdx] + 36,
              start_time: beatIdx / beatsPerMeasure,
              duration: duration,
              velocity: 100
            }
          );

        }
        else {
          gamakaType = pitchIdxToGamaka(pitchNums[pnIdx], curScaleType,
            useRagasInsteadOfScales, formerPitchNum);
          var gamakaPlayed = false;

          if (gamakaType == qpo.js.GamakaTypes.SLIDE_UP_2_PITCHES) {
            // Ensure that there is a pitch from which to slide
            if (pitchNums[pnIdx] >= 2) {
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx] - 2,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.25,
                  duration: duration * 0.75,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.SLIDE_DOWN) {
            // Ensure that the previous note is higher in pitch than the
            // gamaka note.
            if (formerPitchNum > 0 && formerPitchNum > pitchNums[pnIdx]) {
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.25,
                  duration: duration * 0.75,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.ASCENDING_SLIDE_OSCILLATE) {
            // Ensure that the previous note is lower in pitch than the
            // gamaka note, and that the following pitch is higher
            if (formerPitchNum >= 0 && formerPitchNum < pitchNums[pnIdx] &&
              successorPitchNum > pitchNums[pnIdx]) {

              // Begin slide from the previous note pitch
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration * 0.50,
                  velocity: 100
                }
              );
              // Slide up to pitch in the note following the gamaka
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(successorPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.33, // 1/3
                  //duration: duration * 0.25,
                  duration: duration * 0.50,
                  velocity: 100
                }
              );
              // Slide down to pitch in the gamaka note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  //start_time: beatIdx / beatsPerMeasure + duration * 0.375, // 6/16
                  start_time: beatIdx / beatsPerMeasure + duration * 0.66, // 2/3
                  //duration: duration * 0.25,
                  duration: duration * 0.34,
                  velocity: 100
                }
              );

              /*
              // Slide up to pitch in the note following the gamaka
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(successorPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.5625, // 9/16
                  duration: duration * 0.25,
                  velocity: 100
                }
              );
              // Slide down to pitch in the gamaka note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.75, // 12/16
                  duration: duration * 0.25,
                  velocity: 100
                }
              );
              */

              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.ASCENDING_OSCILLATE) {
            // Ensure that the previous note is lower in pitch than the
            // gamaka note.
            if (formerPitchNum > 0 && formerPitchNum < pitchNums[pnIdx]) {

              // Begin slide from the previous note pitch
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide up to pitch of the gamaka note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.25,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide down to the previous note pitch
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.5,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide back up to pitch of the gamaka note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.75,
                  duration: duration * 0.25,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.DESCENDING_OSCILLATE) {
            // Ensure that the previous note is higher in pitch than the
            // gamaka note.
            if (formerPitchNum > 0 && formerPitchNum > pitchNums[pnIdx]) {

              // Begin slide from the gamaka pitch
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide up to pitch of the previous note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.25,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide down to the gamaka note pitch
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.5,
                  duration: duration * 0.30,
                  velocity: 100
                }
              );
              // Slide back up to pitch of the previous note
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(formerPitchNum,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure + duration * 0.75,
                  duration: duration * 0.25,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.HAMMER_ON_CHROMATIC) {
            // Ensure that there is a lower pitch from which to hammer on
            if (pitchNums[pnIdx] >= 1) {
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum) - 1,
                  start_time: beatIdx / beatsPerMeasure,
                  //duration: duration * 0.15,
                  duration: 0.15,
                  velocity: 100
                }
              );
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  //start_time: beatIdx / beatsPerMeasure + duration * 0.10,
                  start_time: beatIdx / beatsPerMeasure + 0.10,
                  //duration: duration * 0.9,
                  duration: duration - 0.10,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }
          else if (gamakaType == qpo.js.GamakaTypes.HAMMER_ON_1_PITCH) {
            // Ensure that there is a lower pitch from which to hammer on
            if (pitchNums[pnIdx] >= 1) {
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx] - 1,
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  //duration: duration * 0.15,
                  duration: 0.15,
                  velocity: 100
                }
              );
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] <= formerPitchNum),
                  //start_time: beatIdx / beatsPerMeasure + duration * 0.10,
                  start_time: beatIdx / beatsPerMeasure + 0.10,
                  //duration: duration * 0.9,
                  duration: duration - 0.10,
                  velocity: 100
                }
              );
              gamakaPlayed = true;
            }
          }

          if (!gamakaPlayed) {
            var midiPitch = qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
              pitchTransformIndex,
              numTransposeSemitones,
              reverseScale,
              halfScale,
              curScaleType,
              useRagasInsteadOfScales,
              pitchNums[pnIdx] < formerPitchNum);

            if (midiPitch < 127) {
              notesDict.notes.push(
                {
                  pitch: qpo.js.pitchIdxToMidi(pitchNums[pnIdx],
                    pitchTransformIndex,
                    numTransposeSemitones,
                    reverseScale,
                    halfScale,
                    curScaleType,
                    useRagasInsteadOfScales,
                    pitchNums[pnIdx] < formerPitchNum),
                  start_time: beatIdx / beatsPerMeasure,
                  duration: duration,
                  velocity: 100
                }
              );
            }
          }
        }
        formerPitchNum = pitchNums[pnIdx];
      }
      beatIdx++;
    }
  }
  var numBeats = beatIdx;
  clip.set('loop_end', numBeats / beatsPerMeasure);

  var qpo = this.patcher.getnamed("qasmpad");
  var lowestOccupiedRow = qpo.js.lowestOccupiedRow();
  var quantizeFactor = 1;
  if (lowestOccupiedRow >= 0) {
    quantizeFactor = Math.pow(2, lowestOccupiedRow);
  }

  // Remove midi 127 notes and conditionally quantize to make chords
  for (var noteIdx = notesDict.notes.length - 1; noteIdx >= 0; noteIdx--) {
    if (notesDict.notes[noteIdx].pitch == 127) {
      notesDict.notes.splice(noteIdx, 1);
    }
    else if (quantizeNotes) {
      notesDict.notes[noteIdx].start_time = Math.floor((notesDict.notes[noteIdx].start_time / quantizeFactor)) * quantizeFactor;
    }
  }

  // Encode circuit grid into the clip, after the loop end
  var startIdx = numBeats;
  for (var gridIdx = 0; gridIdx < qpo.js.NUM_GRIDS; gridIdx++) {
    for (var colIdx = 0; colIdx < qpo.js.NUM_GRID_COLS; colIdx++) {
      for (var rowIdx = 0; rowIdx < qpo.js.NUM_GRID_ROWS; rowIdx++) {
        var gateMidi = qpo.js.circGrid[gridIdx][rowIdx][colIdx];
        if (gateMidi == -1) {
          gateMidi = 127;
        }

        notesDict.notes.push(
          {
            pitch: gateMidi,
            start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + (colIdx * qpo.js.NUM_GRID_ROWS + rowIdx)) / beatsPerMeasure,
            duration: 0.25,
          }
        );

      }
    }
  }

  // Encode global phase shift
  notesDict.notes.push(
    {
      pitch: globalPhaseShiftMidi,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS)) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode pitch transformation index
  notesDict.notes.push(
    {
      pitch: pitchTransformIndex,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 1) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode number of semitones transposition
  notesDict.notes.push(
    {
      pitch: numTransposeSemitones,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 2) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode scale type
  notesDict.notes.push(
    {
      pitch: curScaleType,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 3) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode cycle length A
  notesDict.notes.push(
    {
      pitch: curCycleLengthA,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 4) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode cycle length B
  notesDict.notes.push(
    {
      pitch: curCycleLengthB,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 5) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  // Encode flags
  // The value encoded is a binary representation, where:
  //   - 0b0000001 place represents legato
  //   - 0b0000010 place represents reverseScale
  //   - 0b0000100 place represents halfScale
  //   - 0b0001000 place represents restPitchNum15
  //   - 0b0010000 place represents useRagasInsteadOfScales
  //   - 0b0100000 place represents stochasticPitches
  //   - 0b1000000 place represents quantizeNotes
  var miscFlagsVal = 0;
  if (legato) {
    miscFlagsVal += 1;
  }
  if (reverseScale) {
    miscFlagsVal += 2;
  }
  if (halfScale) {
    miscFlagsVal += 4;
  }
  if (restPitchNum15) {
    miscFlagsVal += 8;
  }
  if (useRagasInsteadOfScales) {
    miscFlagsVal += 16;
  }
  if (stochasticPitches) {
    miscFlagsVal += 32;
  }
  if (quantizeNotes) {
    miscFlagsVal += 64;
  }

  notesDict.notes.push(
    {
      pitch: miscFlagsVal,
      start_time: (startIdx + (gridIdx * qpo.js.NUM_GRID_CELLS) + 6) / beatsPerMeasure,
      duration: 0.25,
    }
  );

  clip.call('add_new_notes', notesDict);


  // TODO: Refactor code below and its occurrence elsewhere into separate method
  //	 		 and ensure that it doesn't get called unnecessarily
  // Get truncated path that only includes track (e.g. live_set tracks 2)
  var trackPathTokens = curClipPath.split(' ');
  trackPathTokens.length = 3;
  var trackPath = trackPathTokens.join(' ');

  // Display the pads/notes corresponding to each phase
  qpo.js.populatePadNoteNames(trackPath, pitchTransformIndex,
    numTransposeSemitones, reverseScale, halfScale, curScaleType, useRagasInsteadOfScales, restPitchNum15);
}


/**
 * Reads a clip, populating the circuit grid if that data exists
 * @param clipPath
 */
function populateCircGridFromClip() {
  var notesArrayPeriod = 6;
  var qpo = this.patcher.getnamed("qasmpad");
  var clip = new LiveAPI(curClipPath);
  var loopEnd = clip.get('loop_end');

  qpo.js.resetCircGrid();

  var notes = clip.call('get_notes', loopEnd, 0, (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + NUM_ADDITIONAL_METADATA_VALUES, 128);

  if (notes[0] == 'notes' && notes[1] == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + NUM_ADDITIONAL_METADATA_VALUES) {
    for (var noteIdx = 0; noteIdx < (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + NUM_ADDITIONAL_METADATA_VALUES; noteIdx++) {
      var noteMidi = notes[noteIdx * notesArrayPeriod + 3];
      var noteStart = notes[noteIdx * notesArrayPeriod + 4];

      if (noteMidi < 127) {
        // Use the start time for each note for ascertaining
        // proper place in grid
        // TODO: Create class(es) to abstract Clip and notes?
        var adjNoteStart = noteStart - loopEnd;

        if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS)) {
          globalPhaseShiftMidi = noteMidi;

          // Send globalPhaseShift
          outlet(0, 'int', globalPhaseShiftMidi);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 1) {
          pitchTransformIndex = noteMidi;

          // Send pitch transform index
          outlet(1, 'int', pitchTransformIndex);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 2) {
          numTransposeSemitones = noteMidi;

          // Send pitch transform index TODO: Remove from here?
          outlet(1, 'int', pitchTransformIndex);

          // Send number of semitones transposition
          outlet(2, 'int', numTransposeSemitones);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 3) {
          curScaleType = noteMidi;

          // Note that current scale type value is sent later,
          // after useRagasInsteadOfScales is known
          //outlet(6, 'int', curScaleType);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 4) {
          curCycleLengthA = noteMidi;

          // Send current cycle length A
          outlet(7, 'int', curCycleLengthA);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 5) {
          curCycleLengthB = noteMidi;

          // Send current cycle length B
          outlet(9, 'int', curCycleLengthB);
        }
        else if (adjNoteStart * 4 == (qpo.js.NUM_GRID_CELLS * qpo.js.NUM_GRIDS) + 6) {
          legato = (noteMidi & 1) == 1; // legato is represented in 0b0000001 place
          reverseScale = (noteMidi & 2) == 2; // reverseScale is represented in 0b0000010 place
          halfScale = (noteMidi & 4) == 4; // halfScale is represented in 0b0000100 place
          restPitchNum15 = (noteMidi & 8) == 8; // restPitchNum15 is represented in 0b0001000 place
          useRagasInsteadOfScales = (noteMidi & 16) == 16; // useRagasInsteadOfScales is represented in 0b0010000 place
          tmpStochasticPitches = (noteMidi & 32) == 32; // stochasticPitches is represented in 0b0100000 place
          quantizeNotes = (noteMidi & 64) == 64; // quantizeNotes is represented in 0b1000000 place

          // Send states to UI controls
          outlet(3, 'int', legato ? 1 : 0);
          outlet(4, 'int', reverseScale ? 1 : 0);
          outlet(5, 'int', halfScale ? 1 : 0);
          outlet(8, 'int', restPitchNum15 ? 1 : 0);
          outlet(12, 'int', useRagasInsteadOfScales ? 1 : 0);
          outlet(14, 'int', quantizeNotes ? 1 : 0);

          // Send current scale type value, after useRagasInsteadOfScales is known.
          outlet(6, 'int', curScaleType);
        }
        else {
          var notePos = adjNoteStart * 4;
          var noteGrid = Math.floor(notePos / qpo.js.NUM_GRID_CELLS);
          var noteCol = Math.floor((notePos % qpo.js.NUM_GRID_CELLS) / qpo.js.NUM_GRID_ROWS);
          var noteRow = Math.floor((notePos % qpo.js.NUM_GRID_CELLS) % qpo.js.NUM_GRID_ROWS);

          var midiPitch = qpo.js.LOW_MIDI_PITCH +
            ((qpo.js.NUM_GRID_ROWS - noteRow - 1) * qpo.js.CONTR_MAT_COLS) + noteCol;
          var notePitchVelocity = [midiPitch, 127];
          qpo.js.setCircGridGate(notePitchVelocity);

          qpo.js.circGrid[noteGrid][noteRow][noteCol] = noteMidi;
          qpo.js.informCircuitBtn(noteGrid, noteRow, noteCol);
        }
      }
    }
  }
  else {
    // Reset circuit grid and UI controls
    qpo.js.resetCircGrid();

    outlet(0, 'int', 0);
    outlet(1, 'int', 0);
    outlet(2, 'int', 0);
    outlet(3, 'int', 0);
    outlet(4, 'int', 0);
    outlet(5, 'int', 0);
    outlet(6, 'int', 0);
    outlet(7, 'int', 2);
    outlet(8, 'int', 0);
    outlet(9, 'int', 2);
    outlet(10, 'int', 0); // Lock by pitch
    outlet(12, 'int', 0); // Set to scales (rather than ragas)
    outlet(13, 'int', 0); // Set to non stochastic note generation
  }

  // TODO: Refactor code below and its occurrence elsewhere into separate method
  //	 		 and ensure that it doesn't get call unnecessarily
  // Get truncated path that only includes track (e.g. live_set tracks 2)
  var trackPathTokens = curClipPath.split(' ');
  trackPathTokens.length = 3;
  var trackPath = trackPathTokens.join(' ');

  // Display the pads/notes corresponding to each phase
  qpo.js.populatePadNoteNames(trackPath, pitchTransformIndex, numTransposeSemitones,
    reverseScale, halfScale, curScaleType, useRagasInsteadOfScales, restPitchNum15);


  qpo.js.createQasmFromGrid();

  outlet(13, 'int', tmpStochasticPitches ? 1 : 0);
}


function pitchIdxToGamaka(pitchIdx, scaleRagaIdx, useRagas, formerPitchNum) {
  var qpo = this.patcher.getnamed("qasmpad");
  var gamakas = qpo.js.musicalScales[0].ascGamakas; // Default to Major scale ascending gamakas
  var scaleOffsets = qpo.js.musicalScales[0].ascOffsets; // Default to Major scale ascending offsets

  var scaleType = qpo.js.getMusicalScaleIndex(scaleRagaIdx, useRagas);

  if (scaleType < qpo.js.musicalScales.length) {
    gamakas = pitchIdx <= formerPitchNum ? qpo.js.musicalScales[scaleType].descGamakas : qpo.js.musicalScales[scaleType].ascGamakas;
    scaleOffsets = pitchIdx <= formerPitchNum ? qpo.js.musicalScales[scaleType].descOffsets : qpo.js.musicalScales[scaleType].ascOffsets;
  }

  if (pitchIdx < 0 || pitchIdx >= qpo.js.NUM_PITCHES) {
    post('\nIn pitchIdxToGamaka, pitchIdx unexpectedly: ' + pitchIdx + ', setting to 0');
    pitchIdx = 0;
  }

  var gamakaType = qpo.js.GamakaTypes.NONE;

  // Only return a gamaka if there is an associated pitch in the scale
  if (scaleOffsets[pitchIdx] != -1) {
    // For Ragas, if pitch and former pitch are the same (repeated note), hammer on second note
    if (qpo.js.musicalScales[scaleType].isRaga() && pitchIdx == formerPitchNum) {
      //gamakaType = qpo.js.GamakaTypes.HAMMER_ON_CHROMATIC;
      gamakaType = qpo.js.GamakaTypes.HAMMER_ON_1_PITCH;
    }
    else {
      gamakaType = gamakas[pitchIdx];
    }
  }
  return gamakaType;
}


/**
 * Given an integer from 0 - 127, calculates and implements
 * global phase adjustment.
 *
 * TODO: Accept input from Push 2 dial
 *
 * @param phaseShiftDialVal Integer from 0 - 127 received from
 *        global phase shift dial
 */
function setGlobalPhaseShift(phaseShiftDialVal) {
  var qpo = this.patcher.getnamed("qasmpad");
  var piOver8PhaseShift = phaseShiftDialVal;
  globalPhaseShift = piOver8PhaseShift * (2 * Math.PI / qpo.js.NUM_PITCHES);
  computeProbsPhases();
}


function basisStateIncluded(basisStateIdx, numBasisStates, cycleLengthA, cycleLengthB) {
  var cycleIncludedA = false;
  var cycleIncludedB = false;

  var closestA = 1;
  while (cycleLengthA > closestA) {
    closestA *= 2;
  }

  var closestB = 1;
  while (cycleLengthB > closestB) {
    closestB *= 2;
  }

  var cycleStart = 0;

  for (cycleStart = 0; cycleStart < numBasisStates; cycleStart += closestA) {
    if (basisStateIdx >= cycleStart && basisStateIdx < cycleStart + cycleLengthA) {
      cycleIncludedA = true;
      break;
    }
  }

  for (cycleStart = 0; cycleStart < numBasisStates; cycleStart += closestB) {
    if (basisStateIdx >= cycleStart && basisStateIdx < cycleStart + cycleLengthB) {
      cycleIncludedB = true;
      break;
    }
  }

  return cycleIncludedA && cycleIncludedB;
}


// Given an object in Cartesian coordinates x, y
// compute its Polar coordinates { r: …, theta: … }
function cartesianToPolar(x, y) {
  return {
    r: Math.sqrt(x * x + y * y),
    theta: Math.atan2(y, x)
  };
}


function draw() {
  var width = box.rect[2] - box.rect[0];


  with (sketch) {
    shapeslice(180, 1);
    // erase background
    glclearcolor(vbrgb[0], vbrgb[1], vbrgb[2], vbrgb[3]);
    glclear();

    glcolor(0, 0, 0, 1);

    moveto(-0.5, -0.4);
    fontsize(12);
    text("svgrid");
  }
}


/**
 * Force the view to be square
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
 * Attempt to resize the view
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


// TODO: Perhaps import a log2 function
/*
function calcNumQubitsFromNumBasisStates(nbsArg) {
  var nq = 0;
  var nbs = nbsArg;

  while (nbs > 1) {
    nbs /= 2;
    nq++;
  }
  return nq;
}
*/


