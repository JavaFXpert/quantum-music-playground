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



On the right side of the quantum circuit is a toolbox with quantum operations that may be placed on the quantum circuit, which is on the left side of the image. For the kick drum part, we're using a couple of **H** gates on the wires labeled **q2** and **q3**. The result is that the **Bass Drum** will play a [four on the floor](https://en.wikipedia.org/wiki/Four_on_the_floor_(music)) drum pattern shown in the sequence grid below. This sequence grid represents one measure in [4/4 time](https://en.wikipedia.org/wiki/Time_signature#Characteristics), and each column represents a [sixteenth note](https://en.wikipedia.org/wiki/Sixteenth_note). As you can see, the bass drum is playing on each of the four beats in the measure.

<img src="./images/statevector_musical_representation.png" alt="Quantum Music Playground screenshot" width=80%/>



***TODO: Remove radians from the image, and introduce in a future image***

The logic by which a couple of H gates (also known as Hadamard gates) resulted in this drum pattern can be explained using some basic math:

First off, the wires labeled **q0** - **q7** on the quantum circuit represent the least significant digit through the most significant digit of a binary value. The reason that there are 16 columns in the previous grid is that **q3** (the fourth wire) is the highest wire on which a gate is present. This defines a range of 2<sup>4</sup> binary numbers from `0000` - `1111`, and are labeled **Basis states** across the bottom of the previous image. Each *basis state* represents a step in our musical sequence. 

> **A bit about basis states**
>
> A basis state, sometime referred to as a *computational basis state*, is a concept used in quantum computing to represent a component of a quantum state. In this example, the quantum circuit defines a quantum state that is comprised of 16 basis states. Each basis state contains a complex number from which two important values can be derived: The *probability* that this basis state will be the result when measuring the quantum state, and the *phase angle* of this basis state. Both of these concepts will be covered at appropriate times in this tutorial. For now, it is important to understand that there is one binary digit in each basis state for each wire in a quantum circuit, where the number of wires is determined by the highest wire on which a gate is present. It is also necessary to know that the rightmost binary digit of each basis state corresponds to the topmost wire, labeled **q0**. As you may know, the rightmost binary digit is referred to as being in position 0, because its place value is 2<sup>0</sup> in the binary numbering system.

To calculate on which of these sequence steps the bass drum will play, take a look at the quantum circuit and the sequence grid together in this image while reading the explanation that follows.

<img src="./images/twinkle_kick_circuit_sequence.png" alt="Quantum Music Playground screenshot" width=100%/>

Each of the wires in the quantum circuit contains an initial value of 0.

- Because there are no gates on wire **q0**, the drum may only play on basis states whose 0 (least significant) position contains 0.
- Because there are no gates on wire **q1**, the drum may only play on basis states whose 1 position contains 0.
- Because there is an **H** gate on wire **q2**, the drum may play on basis states whose 2 position contains either 0 or 1. This is because the H gate puts the wire into a combination of 0 and 1.
- Because there is an **H** gate on wire **q3**, the drum may play on basis states whose 3 position contains either 0 or 1.

Putting that all together, the bass drum will play on all of the basis states whose 0 and 1 positions contain 0, which are `0000`, `0100`, `1000` and `1100`. 



> **Try it out:**
>
> Experiment with simple bass drum beat patterns by removing and placing **H** gates on the quantum circuit. To remove a gate, press the ⌫ tool (bottom right of toolboxl) and press a gate to delete. To add an **H** gate, press the **H** gate (upper left in toolbox) and press a location on the quantum circuit.



You may be wondering why the bass drum, and not the other instruments, are played as a result of this quantum circuit. The short answer is that the Quantum Music Playground chooses instruments and pitches based upon the phase angles mentioned earlier. The next section contains a more complete and satisfying explanation.

## Choosing instruments and pitches

Up to this point we've created a simple bass drum beat pattern by placing Hadamard gates on a quantum circuit. Now we're going to choose a different instrument to provide a cymbal crash at the beginning of each measure. As before, at the bottom of the following screenshot is the Quantum Music Playground device, now expressing the cymbal part contained in the **Crash** clip in another one of the tracks labeled **808 Core Kit**. 

![Twinkle song cymbal part](./images/twinkle_crash_full_screenshot.png)



Let's examine the Quantum Music Playground device by itself in the following image.

![Quantum Music Playground screenshot](./images/twinkle_crash_qmp.png)



The quantum circuit in this **Crash** clip contains just one gate, namely the **I** (also known as identity) gate. The **I** gate doesn't alter the state of a wire, but it's used here to set the number of basis states, and therefore steps, to 16 for this clip. The length of this **Crash** clip is now the same length as the **Kick** clip, so as each clip is playing in a loop, the cymbal and the bass drum will play together on the downbeat of the measure, followed by the bass drum playing on the remaining three beats. 

To see why the Cymbal, rather than the Bass Drum, will be played, take a look at the disabled **Phs shft** slider and notice the value of 13 at the bottom. This indicates that the global phase angle shift, often referred to as *global phase shift*, of the quantum state is 13π/8 radians (292.5 degrees). This happens to correspond with the value of 13 to the right of the **Cymbal** row in the following image.

<img src="./images/twinkle_crash_musical_sequence.png" alt="Twinkle Crash musical sequence" width=80%/>



As mentioned previously, each individual basis state contains a phase angle. Shifting the global phase by π/8 radians (22.5 degrees) shifts each individual phase by π/8 radians, which results in moving the notes up one instrument or pitch.

> **Try it out:**
>
> Experiment with shifting the global phase angle by selecting the **Phase** button, moving the **Phs shft** slider up or down, and then selecting the **Pitch** button to keep the global phase from automatically shifting.

### Shifting the phase angles of basis states

To create an interesting beat pattern or melody, it is usually necessary to shift the phase angles of various basis states. A common way to accomplish this is to follow an **H** gate with a *phase* gate. To demonstrate this, we'll play hi-hat cymbals, shifting back and forth from open to closed hi-hats. The bottom of the following screenshot shows the Quantum Music Playground device, now expressing the hi-hat part contained in the **Hats A** clip in yet another one of the tracks labeled **808 Core Kit**.  

![Twinkle song hats part](./images/twinkle_hats_full_screenshot.png)



Now we'll examine the Quantum Music Playground device by itself in the following image.

![Quantum Music Playground screenshot](./images/twinkle_hats_qmp.png)



The quantum circuit in this **Hats A** clip contains a column of four H gates on wires **q0** - **q3**, which defines one measure with a beat pattern full of sixteenth notes. The circuit also contains two of the *phase gates* obtained from right column of the toolbox, and a *control gate modifier* taken from the toolbox's left column. We'll discuss phase gates and control gate modifiers shortly, but let's analyze the results of progressively adding gates to this circuit. The following image shows the Quantum Music Playground device after placing only the **H** gates.

 ![Quantum Music Playground screenshot](./images/twinkle_hats_qmp_h_gates.png)



As with the **Kick** clip earlier, the **H** gates play a beat pattern on the Bass Drum. Next, the following image shows the **Phase** button selected and the **Phs shft** slider adjusted so that the **Closed Hi-hat** is played with the same beat pattern, having been shifted by a global phase. 

![Quantum Music Playground screenshot](./images/twinkle_hats_qmp_global_phase_shift.png)



To play the **Open Hi-hat** on the third sixteenth note of every beat, we employ one of the *phase gates*, specifically the **S** gate. 

![Quantum Music Playground screenshot](./images/twinkle_hats_qmp_s_gate.png)



The **S** gate rotates the phase on a wire by 4π/8 radians, which rotates the phase on each of the basis states whose corresponding position contains a 1. This is seen more clearly in the following image, in which the rotation is performed on every basis state whose bit in position 1 is 1

<img src="./images/twinkle_hats_musical_sequence_s.png" alt="Twinkle Crash musical sequence" width=80%/>



Finally, to play the **Open Hi-hat** on the fourth sixteenth note of every beat, we employ another one of the *phase gates*, specifically the **S†** gate, in conjunction with the control gate modifier. 

![Quantum Music Playground screenshot](./images/twinkle_hats_qmp_sdg_gate.png)



The **S†** gate rotates the phase on a wire by 12π/8 radians. However, when a control gate modifier is placed in the same column, the **S†** gate only operates when the control wire has a value of 1. This rotates the phase on each of the basis states whose positions corresponding to the **S†** gate and the control gate modifier both contain a 1. This is seen more clearly in the following image, in which the rotation is performed on every basis state whose bits in positions 0 and 1 are 1.

<img src="./images/twinkle_hats_musical_sequence_sdg.png" alt="Twinkle Crash musical sequence" width=80%/>



============= FODDER BELOW =================









Examining the following musical representation of the same statevector reveals that the phase of a basis state is represented by the row in which a cell is filled. 

In the center of the device is a [quantum circuit](https://qiskit.org/documentation/qc_intro.html#quantum-circuits) whose resultant [statevector](https://qiskit.org/textbook/ch-states/representing-qubit-states.html#statevectors) is represented musically in the grid to the right of the circuit. For comparison, if you entered this circuit in the [IBM Quantum Composer](https://quantum-computing.ibm.com/) the circuit and resultant statevector would appear similar to the following image.

<img src="./images/twinkle_kick_ibm_quantum_composer.png" alt="Quantum Music Playground screenshot" width=70%/>



The bar graph shows that four of the basis states in the statevector have non-zero amplitudes, and that they all have a phase angle of 0 (as noted by the popup as well as the **Phase** color legend). As you interact with the Quantum Music Composer device, the MIDI information in the selected Ableton Live clip is updated with a sequence of notes as shown in the following image.

<img src="./images/kick_midi_clip.png" alt="Kick drum MIDI clip screenshot" width=50%/>



This one-measure sequence is looped, playing the kick (bass) drum once for each of the four beats in the measure. 



 