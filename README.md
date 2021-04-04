# Quantum Music Playground
## Summary

Playground for composing music using quantum states. Implemented as a Max for Live device in Ableton Live 11. Apache 2.0 licensed. Developed by James L. Weaver.

![Quantum Music Playground screenshot](./images/qmp_0_9_screenshot.png)



> Please note that it is ***not*** necessary to have prior knowledge of quantum computing in order to use Quantum Music Playground. We'll sneak in what you need to know as we go along, and will reference helpful (but not essential to internalize) resources.

## Introduction

The Quantum Music Playground is a tool for composing music, as well as an enjoyable way of gaining intuition about quantum circuits and states. It is implemented as a Max for Live device in the Ableton Live 11 digital audio workstation (DAW). The following screenshot shows an Ableton Live Session View that contains [MIDI](https://en.wikipedia.org/wiki/MIDI) clips that play an arrangement of the well known song entitled *Twinkle Twinkle Little Star*.

![Twinkle song kick drum part](./images/twinkle_kick_screenshot.png)



At the bottom of the screenshot is the Quantum Music Playground device, shown here expressing the kick drum part contained in the **Kick** clip in one of the tracks labeled **808 Core Kit**. In the center of the device is a [quantum circuit](https://qiskit.org/documentation/qc_intro.html#quantum-circuits), shown by itself in the following image.

<img src="./images/twinkle_kick_quantum_circuit.png" alt="Quantum Music Playground screenshot" width=40%/>



On the right side of the previous image are quantum operations that may be placed on the quantum circuit, which is on the left side of the image. For the kick drum part, we're using a couple of **H** gates on the wires labeled **q2** and **q3**. The result is that the **Bass Drum** will play a [four on the floor](https://en.wikipedia.org/wiki/Four_on_the_floor_(music)) drum pattern shown in the image below. If we consider each column a [sixteenth note](https://en.wikipedia.org/wiki/Sixteenth_note) in [4/4 time](https://en.wikipedia.org/wiki/Time_signature#Characteristics), then the horizontal axis of the sequence grid represents one measure, and the **Bass Drum** will play on each beat of the measure. 

<img src="./images/statevector_musical_representation.png" alt="Quantum Music Playground screenshot" width=60%/>



***TODO: Remove radians from the image, and introduce in a future image***

The logic by which a couple of H gates (also known as Hadamard gates) resulted in this drum pattern can be explained using some simple math:

First off, the wires labeled **q0** - **q7** on the quantum circuit represent the least significant digit through the most significant digit of a binary value. The reason that there are 16 columns in the previous grid, is that **q3** (the fourth wire) is the highest wire on which a gate is present. This defines a range of 2<sup>4</sup> binary numbers from `0000` - `1111`, and are labeled **Basis states** across the bottom of the previous image.

To calculate on which of these basis states the drum will play, take a look at the quantum circuit and sequence grid together in the following image.

<img src="./images/twinkle_kick_circuit_sequence.png" alt="Quantum Music Playground screenshot" width=100%/>

Each of the wires have an initial value of 0. Using the process of elimination:

- Because there are no gates on wire **q0**, the drum has a possibility of playing only on basis states whose 2<sup>0</sup> (least significant) digit is 0.
- Because there are no gates on wire **q1**, the drum has a possibility of playing only on basis states whose 2<sup>1</sup> digit is 0.
- Because there is an **H** gate on wire **q2**, the drum will play on basis states whose 2<sup>2</sup> digit is either 0 or 1. This is because the H gate puts a wire, also known as a qubit, in an equal superposition TODO: LEFT OFF HERE.



Examining the following musical representation of the same statevector reveals that the phase of a basis state is represented by the row in which a cell is filled. 

In the center of the device is a [quantum circuit](https://qiskit.org/documentation/qc_intro.html#quantum-circuits) whose resultant [statevector](https://qiskit.org/textbook/ch-states/representing-qubit-states.html#statevectors) is represented musically in the grid to the right of the circuit. For comparison, if you entered this circuit in the [IBM Quantum Composer](https://quantum-computing.ibm.com/) the circuit and resultant statevector would appear similar to the following image.

<img src="./images/twinkle_kick_ibm_quantum_composer.png" alt="Quantum Music Playground screenshot" width=70%/>



The bar graph shows that four of the basis states in the statevector have non-zero amplitudes, and that they all have a phase angle of 0 (as noted by the popup as well as the **Phase** color legend). As you interact with the Quantum Music Composer device, the MIDI information in the selected Ableton Live clip is updated with a sequence of notes as shown in the following image.

<img src="./images/kick_midi_clip.png" alt="Kick drum MIDI clip screenshot" width=50%/>



This one-measure sequence is looped, playing the kick (bass) drum once for each of the four beats in the measure. 



 