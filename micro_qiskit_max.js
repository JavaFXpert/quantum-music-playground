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
 * MicroQiskit implementation in Max
 *
 */
var math = require("math.min.js").math;

// Inlet 0 receives simulator messages that include a QASM string
this.inlets = 1;

// Outlet 0 sends a statevector as a list of floats, with each pair of floats
// expressing one complex number (without a character such as i that symbolizes
// an imaginary component.
this.outlets = 1;

sketch.default2d();
var val = 0;
var vbrgb = [1., 1., 1., 1.];

draw();

function draw() {
  var width = box.rect[2] - box.rect[0];


  with (sketch) {
    shapeslice(180, 1);
    // erase background
    glclearcolor(vbrgb[0], vbrgb[1], vbrgb[2], vbrgb[3]);
    glclear();

    glcolor(0, 0, 0, 1);

    moveto(-1.3, -0.4);
    fontsize(24);
    text("µQiskit");
  }
}

function onresize(w, h) {
  draw();
  refresh();
}

onresize.local = 1; //private


/**
 * Accept an svsim message
 */
function svsim(qasm) {
  //post('qasm: ' + qasm);
  var qc = createQuantumCircuitFromQasm(qasm);
  if (qc != null) {
    var statevector = simulate(qc, 0, 'statevector');
    //post('\nstatevector: ' + statevector);
    var svSpaceDelim = statevector.toString().replace(/,/g, ' ');

    outlet(0, 'viz', svSpaceDelim);
  }
  else {
    post('\nUnexpectedly, qc: ' + qc);
  }
}


/**
 * Process QASM and return a QuantumCircuit
 */
function createQuantumCircuitFromQasm(qasm) {
  var quantumCircuit = null;
  var numQuantumWires = 0;
  var numClassicalWires = 0;

  var qasmArray = qasm.split(';');

  for (var tokenIdx = 0; tokenIdx < qasmArray.length; tokenIdx++) {
    var instruction = qasmArray[tokenIdx].trim();

    if (instruction.length > 0) {
      var keywordArgumentArray = instruction.split(' ');
      if (keywordArgumentArray.length == 2) {
        var keyword = keywordArgumentArray[0];
        var argument = keywordArgumentArray[1];

        var qArgArray = argument.split(',');
        var qNumArray = [];

        // Extract all of the wire numbers
        for (var qArgIdx = 0; qArgIdx < qArgArray.length; qArgIdx++) {
          var qArg = qArgArray[qArgIdx];
          var leftBracketPos = qArg.indexOf('[');
          var rightBracketPos = qArg.indexOf(']');
          if (leftBracketPos > 0 && rightBracketPos > 0) {
            var qArgInt = parseInt(qArg.substring(leftBracketPos + 1, rightBracketPos));
            if (qArgInt >= 0) {
              qNumArray.push(qArgInt);
            }
          }
        }

        if (qNumArray.length > 0) {
          if (qNumArray[0] >= 0) {
            keyword = keyword.trim();
            if (keyword == 'qreg') {
              numQuantumWires = qNumArray[0];
            }
            else if (keyword == 'creg') {
              numClassicalWires = qNumArray[0];
            }
            else {
              // Subsequent instructions should be added to quantum circuit
              // so make sure it is created
              if (quantumCircuit == null) {
                quantumCircuit = new QuantumCircuit(numQuantumWires, numClassicalWires);
              }

              // TODO: Expand list of gates supported
              if (keyword == 'h') {
                quantumCircuit.h(qNumArray[0]);
              }
              else if (keyword == 'x') {
                quantumCircuit.x(qNumArray[0]);
              }
              else if (keyword == 'y') {
                quantumCircuit.y(qNumArray[0]);
              }
              else if (keyword == 'z') {
                quantumCircuit.z(qNumArray[0]);
              }
              else if (keyword == 's') {
                quantumCircuit.s(qNumArray[0]);
              }
              else if (keyword == 'sdg') {
                quantumCircuit.sdg(qNumArray[0]);
              }
              else if (keyword == 't') {
                quantumCircuit.t(qNumArray[0]);
              }
              else if (keyword == 'tdg') {
                quantumCircuit.tdg(qNumArray[0]);
              }
              else if (keyword == 'swap' && qNumArray.length == 2) {
                quantumCircuit.swap(qNumArray[0], qNumArray[1]);
              }


              else if (keyword == 'rx(pi)') {
                // Use X gate for pi rotation
                quantumCircuit.x(qNumArray[0]);
              }
              else if (keyword.substring(0, 3) == 'rx(') {
                quantumCircuit.rx(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }

              else if (keyword == 'cx' && qNumArray.length == 2) {
                quantumCircuit.cx(qNumArray[0], qNumArray[1]);
              }
              else if (keyword == 'crx(pi)' && qNumArray.length == 2) {
                // Use CX gate for pi rotation
                quantumCircuit.cx(qNumArray[0], qNumArray[1]);
              }
              else if (keyword.substring(0, 4) == 'crx(') {
                var rads = numFromParen(keyword);
                if (Math.abs(rads - Math.PI) < 0.0001) {
                  quantumCircuit.cx(qNumArray[0], qNumArray[1]);
                }
                else {
                  quantumCircuit.crx(rads, qNumArray[0], qNumArray[1]);
                }
              }


              else if (keyword == 'ry(pi)') {
                // Use Y gate for pi rotation
                quantumCircuit.y(qNumArray[0]);
              }
              else if (keyword.substring(0, 3) == 'ry(') {
                quantumCircuit.ry(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }


              else if (keyword.substring(0, 3) == 'rz(') {
                quantumCircuit.rz(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }

              else if (keyword.substring(0, 4) == 'crz(') {
                quantumCircuit.crz(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }


              else if (keyword.substring(0, 2) == 'p(') {
                quantumCircuit.p(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }

              else if (keyword.substring(0, 3) == 'cp(') {
                quantumCircuit.cp(numFromParen(keyword), qNumArray[0], qNumArray[1]);
              }
            }
          }
        }
      }
    }
  }

  return quantumCircuit;
}


function numFromParen(strWithParen) {
  var numInParen = 0;
  if (strWithParen != null) {
    var leftPos = strWithParen.indexOf('(');
    var rightPos = strWithParen.indexOf(')');
    if (leftPos >= 0 && rightPos > leftPos + 1) {
      var exprStr = strWithParen.substring(leftPos + 1, rightPos);
      exprStr = exprStr.replace(/pi/g, '3.14159');
      numInParen = eval(exprStr);
    }
  }
  return numInParen;
}


// This is a JavaScript version of Qiskit. For the full version, see qiskit.org.
// It has many more features, and access to real quantum computers.
var r2 = 0.70710678118;

function QuantumCircuit(n, m) {
  this.numQubits = n;
  this.numClbits = m;
  this.data = [];
}

(QuantumCircuit.prototype).h = function (q) {
  this.data.push(['h', q]);
  return this;
};
(QuantumCircuit.prototype).x = function (q) {
  this.data.push(['x', q]);
  return this;
};
(QuantumCircuit.prototype).rx = function (theta, q) {
  this.data.push(['rx', theta, q]);
  return this;
};
(QuantumCircuit.prototype).cx = function (s, t) {
  this.data.push(['cx', s, t]);
  return this;
};
(QuantumCircuit.prototype).crx = function (theta, s, t) {
  this.data.push(['crx', theta, s, t]);
  return this;
};
(QuantumCircuit.prototype).cp = function (theta, s, t) {
  this.data.push(['cp', theta, s, t]);
  return this;
};
(QuantumCircuit.prototype).crz = function (theta, s, t) {
  this.h(t);
  this.crx(theta, s, t);
  this.h(t);
  return this;
};
(QuantumCircuit.prototype).swap = function (s, t) {
  this.data.push(['swap', s, t]);
  return this;
};

(QuantumCircuit.prototype).rz = function (theta, q) {
  this.h(q);
  this.rx(theta, q);
  this.h(q);
  return this;
};
(QuantumCircuit.prototype).p = function (theta, q) {
  this.data.push(['p', theta, q]);
  return this;
};

(QuantumCircuit.prototype).ry = function (theta, q) {
  this.rx(Math.PI / 2, q);
  this.rz(theta, q);
  this.rx(-Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).z = function (q) {
  this.p(Math.PI, q);
  return this;
};
(QuantumCircuit.prototype).s = function (q) {
  this.p(Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).sdg = function (q) {
  this.p(-Math.PI / 2, q);
  return this;
};
(QuantumCircuit.prototype).t = function (q) {
  this.p(Math.PI / 4, q);
  return this;
};
(QuantumCircuit.prototype).tdg = function (q) {
  this.p(-Math.PI / 4, q);
  return this;
};
(QuantumCircuit.prototype).y = function (q) {
  this.rz(Math.PI, q);
  this.x(q);
  return this;
};
(QuantumCircuit.prototype).measure = function (q, b) {
  if (q >= this.numQubits) {
    throw 'Index for qubit out of range.';
  }
  if (b >= this.numClbits) {
    throw 'Index for output bit out of range.';
  }
  this.data.push(['m', q, b]);
  return this;
};
var simulate = function (qc, shots, get) {
  var superpose = function (x, y) {
    var sup = [
      [(x[0] + y[0]) * r2, (x[1] + y[1]) * r2],
      [(x[0] - y[0]) * r2, (x[1] - y[1]) * r2]
    ];
    return sup;
  };
  var turn = function (x, y, theta) {
    var trn = [
      [
        x[0] * Math.cos(theta / 2) + y[1] * Math.sin(theta / 2),
        x[1] * Math.cos(theta / 2) - y[0] * Math.sin(theta / 2)
      ],
      [
        y[0] * Math.cos(theta / 2) + x[1] * Math.sin(theta / 2),
        y[1] * Math.cos(theta / 2) - x[0] * Math.sin(theta / 2)
      ]
    ];
    return trn;
  };
  var phaseTurn = function (x, y, theta) {
    var phsTrn = [
      y[0] * Math.cos(theta) - y[1] * Math.sin(theta),
      y[1] * Math.cos(theta) + y[0] * Math.sin(theta)
    ];
    return phsTrn;
  };
  var k = [];
  for (j = 0; j < Math.pow(2, qc.numQubits); j++) {
    k.push([0, 0]);
  }
  k[0] = [1.0, 0.0];
  var outputMap = {};
  for (var idx = 0; idx < qc.data.length; idx++) {
    var gate = qc.data[idx];
    if (gate[0] == 'm') {
      outputMap[gate[2]] = gate[1];
    }
    else if (gate[0] == "x" || gate[0] == "h" || gate[0] == "rx" || gate[0] == "p") {
      var j = gate.slice(-1)[0];
      for (var i0 = 0; i0 < Math.pow(2, j); i0++) {
        for (var i1 = 0; i1 < Math.pow(2, qc.numQubits - j - 1); i1++) {
          var b0 = i0 + Math.pow(2, (j + 1)) * i1;
          var b1 = b0 + Math.pow(2, j);
          if (gate[0] == 'x') {
            var temp0 = k[b0];
            var temp1 = k[b1];
            k[b0] = temp1;
            k[b1] = temp0;
          }
          else if (gate[0] == 'h') {
            var sup = superpose(k[b0], k[b1]);
            k[b0] = sup[0];
            k[b1] = sup[1];
          }
          else if (gate[0] == 'rx') {
            var theta = gate[1];
            var trn = turn(k[b0], k[b1], theta);
            k[b0] = trn[0];
            k[b1] = trn[1];
          }
          else if (gate[0] == 'p') {
            var theta = gate[1];
            var phsTrn = phaseTurn(k[b0], k[b1], theta);
            k[b1] = phsTrn;
          }
        }
      }
    }
    else if (gate[0] == 'cx' || gate[0] == 'swap' || gate[0] == 'crx' || gate[0] == 'cp') {
      var s, t, theta;
      if (gate[0] == 'cx' || gate[0] == 'swap') {
        s = gate[1];
        t = gate[2];
      }
      else if (gate[0] == 'crx') {
        theta = gate[1];
        s = gate[2];
        t = gate[3];
      }
      else if (gate[0] == 'cp') {
        theta = gate[1];
        s = gate[2];
        t = gate[3];
      }

      var l = Math.min(s, t);
      var h = Math.max(s, t);
      for (var i0 = 0; i0 < Math.pow(2, l); i0++) {
        // Prevent a swap from executing twice
        var swapExecuted = false;

        for (var i1 = 0; i1 < Math.pow(2, (h - l - 1)); i1++) {
          for (var i2 = 0; i2 < Math.pow(2, (qc.numQubits - h - 1)); i2++) {
            var b00 = i0 + Math.pow(2, l + 1) * i1 + Math.pow(2, h + 1) * i2;
            var b01 = i0 + Math.pow(2, t);
            var b10 = b00 + Math.pow(2, s);
            var b11 = b10 + Math.pow(2, t);

            if (gate[0] == 'cx') {
              var tmp10 = k[b10];
              var tmp11 = k[b11];
              k[b10] = tmp11;
              k[b11] = tmp10;
            }
            else if (gate[0] == 'swap' && !swapExecuted) {
              var tmp10 = k[b10];
              var tmp01 = k[b01];
              k[b01] = tmp10;
              k[b10] = tmp01;
              swapExecuted = true;
            }
            else if (gate[0] == 'crx') {
              theta = gate[1];
              var trn = turn(k[b10], k[b11], theta);
              k[b10] = trn[0];
              k[b11] = trn[1];
            }
            else if (gate[0] == 'cp') {
              theta = gate[1];
              var phsTrn = phaseTurn(k[b10], k[b11], theta);
              k[b11] = phsTrn;
            }
          }
        }
      }
    }
  }
  if (get == 'statevector') {
    return k;
  }
  else {
    var m = [];
    for (var idx = 0; idx < qc.numQubits; idx++) {
      m.push(false);
    }
    for (var i = 0; i < qc.data.length; i++) {
      var gate = qc.data[i];
      for (var j = 0; j < qc.numQubits; j++) {
        if (((gate.slice(-1)[0] == j) && m[j])) {
          throw ('Incorrect or missing measure command.');
        }
        m[j] = (gate[0] == 'm' && gate[1] == j && gate[2] == j);
      }
    }
    var probs = [];
    for (var i = 0; i < k.length; i++) {
      probs.push((Math.pow(k[i][0], 2) + Math.pow(k[i][1], 2)));
    }
    if (get == 'counts' || get == 'memory') {
      var me = [];
      for (var idx = 0; idx < shots; idx++) {
        var cumu = 0.0;
        var un = true;
        var r = Math.random();
        for (var j = 0; j < probs.length; j++) {
          var p = probs[j];
          cumu += p;
          if (r < cumu && un) {
            var bitStr = j.toString(2);
            var padStr = Math.pow(10, qc.numQubits - bitStr.length).toString().substr(1, qc.numQubits);
            var rawOut = padStr + bitStr;
            var outList = [];
            for (var i = 0; i < qc.numClbits; i++) {
              outList.push('0');
            }
            for (var bit in outputMap) {
              outList[qc.numClbits - 1 - bit] =
                rawOut[qc.numQubits - 1 - outputMap[bit]];
            }
            var out = outList.join("");
            me.push(out);
            un = false;
          }
        }
      }
      if (get == 'memory') {
        return m;
      }
      else {
        var counts = {};
        for (var meIdx = 0; meIdx < me.length; meIdx++) {
          var out = me[meIdx];
          if (counts.hasOwnProperty(out)) {
            counts[out] += 1;
          }
          else {
            counts[out] = 1;
          }
        }
        return counts;
      }
    }
  }
};

