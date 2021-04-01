# Quantum Music Playground
## Summary

Playground for composing music using quantum states. Implemented as a Max for Live device in Ableton Live 11. Apache 2.0 licensed. Developed by James L. Weaver.

![Quantum Music Playground screenshot](./images/qmp_0_9_screenshot.png)



## Introduction

The Quantum Music Playground is a tool for composing music, as well as an enjoyable way of gaining intuition about quantum circuits and states. It is implemented as a Max for Live device in the Ableton Live 11 digital audio workstation (DAW). The following screenshot shows an Ableton Live Session View that contains [MIDI](https://en.wikipedia.org/wiki/MIDI) clips that play the well known song entitled *Twinkle Twinkle Little Star*.

![Twinkle song kick drum part](./images/twinkle_kick_screenshot.png)



At the bottom of the screenshot is the Quantum Music Playground device, shown here composing the kick drum part contained in the **Kick** clip in one of the tracks labeled **808 Core Kit**. In the center of the device is a [quantum circuit](https://qiskit.org/documentation/qc_intro.html#quantum-circuits) whose resultant [statevector](https://qiskit.org/textbook/ch-states/representing-qubit-states.html#statevectors) is represented musically in the grid to the right of the circuit. For comparison, if you entered this circuit in the [IBM Quantum Composer](https://quantum-computing.ibm.com/) the circuit and resultant statevector would appear similar to the following image.

<img src="./images/twinkle_kick_ibm_quantum_composer.png" alt="Quantum Music Playground screenshot" width=70%/>



The bar graph shows that four of the basis states in the statevector have non-zero amplitudes, and that they all have a phase angle of 0 (as noted by the popup as well as the **Phase** color legend). Examining the following musical representation of the same statevector reveals that the phase of a basis state is represented by the row in which a cell is filled. If we consider each cell a 16th note in 4/4 time, the **Bass Drum** will play a [four on the floor](https://en.wikipedia.org/wiki/Four_on_the_floor_(music)) drum pattern. 

<img src="./images/statevector_musical_representation.png" alt="Quantum Music Playground screenshot" width=70%/>



As you interact with the Quantum Music Composer device, the MIDI information in the selected clip is updated.

