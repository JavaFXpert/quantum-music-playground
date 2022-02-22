## Quantum Music Playground Tutorial

The Quantum Music Playground represents one of many possible approaches for leveraging quantum computing to composing music. Quantum Music Playground take an approach that rendering beats and melodies from statevectors that model quantum states. For example, Figure 1 shows a four qubit quantum circuit and quantum state whose basis state amplitudes are all the same. The phases of the basis states differ, however, progressing from 0 radians to 15π/8 radians. 

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/scale_circuit_composer.png" alt="Quantum Music Playground screenshot" width=100%/>

*Figure 1. Representing a sequence of phases in IBM Quantum Circuit Composer*



The quantum circuit and state shown in Figure 1 may be created in the Quantum Music Playground as shown in Figure 2. The notes corresponding to each of the basis states are played in sequence. The amplitude of a given basis states controls the likelihood that a given basis state will be played, and its phase controls the pitch played.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/scale_qmp.png" alt="Quantum Music Playground screenshot" width=100%/>

*Figure 2. Representing a sequence of pitches in Quantum Music Playground*



The Quantum Music Playground is not only a tool for composing music, but it is also an enjoyable way of gaining intuition about quantum circuits and states. It is implemented as a Max for Live device in the Ableton Live 11 digital audio workstation (DAW), and includes a MicroQiskit quantum simulator. As an example, Figure 3 shows an Ableton Live Session View that contains MIDI clips that play an arrangement of the well known song entitled *Twinkle Twinkle Little Star*. 



![Twinkle song kick drum part](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_kick_screenshot.png)

*Figure 3. Twinkle Twinkle Little Star in Quantum Music Composer*



The song is played using Piano, Bass and various percussion instruments, and the clips are expressed using quantum circuits.

At the bottom of Figure 3 is the Quantum Music Playground device, shown here expressing the kick drum part contained in the **Kick** clip in one of the tracks labeled **808 Core Kit**. In the center of the device is a quantum circuit, shown by itself in the Figure 4.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_kick_quantum_circuit.png" alt="Quantum Music Playground screenshot" width=40%/>

*Figure 4. Expressing the kick drum in Twinkle Twinkle.*



On the right side of the quantum circuit is a toolbox with quantum operations that may be placed on the quantum circuit. For the kick drum part, we're using a couple of **H** gates on the wires labeled **q2** and **q3**. The result is that the **Bass Drum** will play a four on the floor drum pattern shown in the sequence grid in Figure 5. This sequence grid represents one measure in 4/4 time, and each column represents a sixteenth note. The bass drum is playing on each of the four beats in the measure.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/statevector_musical_representation.png" alt="Quantum Music Playground screenshot" width=60%/>

*Figure 5. Sequence grid representing one measure in 4/4 time.*



The logic by which a couple of **H** gates (also known as *Hadamard* gates) resulted in this drum pattern can be explained using some basic math:

First off, the wires labeled **q0** - **q7** on the quantum circuit represent the least significant digit through the most significant digit of a binary value. The reason that there are 16 columns in the previous grid is that **q3** (the fourth wire) is the highest wire on which a gate is present. This defines a range of 2<sup>4</sup> binary numbers from `0000` - `1111`, and are labeled **Basis states** across the bottom of the previous image. Each *basis state* represents a step in our musical sequence. 

> **A bit about basis states**
>
> A basis state, sometime referred to as a *computational basis state*, is a concept used in quantum computing to represent a component of a quantum state. In this example, the quantum circuit defines a quantum state that is comprised of 16 basis states. Each basis state contains a complex number from which two important values may be derived: 
>
> - The *probability amplitude* that represents the likelihood that this basis state will be the result when measuring the quantum state, and 
> - the *phase angle* of this basis state. 
>
> Both of these concepts will be revisited at appropriate times. For now, it is important to understand that there is one binary digit in each basis state for each wire in a quantum circuit, where the number of wires is determined by the highest wire on which a gate is present. It is also necessary to know that the rightmost binary digit of each basis state corresponds to the topmost wire, labeled **q0**. As you may know, the rightmost binary digit is referred to as being in position 0, because its place value is 2<sup>0</sup> in the binary numbering system.

To calculate on which of these sequence steps the bass drum will play, take a look at the quantum circuit and the sequence grid together in Figure 6 while reading the explanation that follows.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_kick_circuit_sequence.png" alt="Quantum Music Playground screenshot" width=100%/>

*Figure 6. Quantum circuit and corresponding sequence grid.*



Each of the wires in the quantum circuit contains an initial value of 0.

- Because there are no gates on wire **q0**, the drum may only play on basis states whose 0 (least significant) position contains 0.
- Because there are no gates on wire **q1**, the drum may only play on basis states whose 1 position contains 0.
- Because there is an **H** gate on wire **q2**, the drum may play on basis states whose 2 position contains either 0 or 1. This is because the **H** gate puts the wire into a combination of 0 and 1.
- Because there is an **H** gate on wire **q3**, the drum may play on basis states whose 3 position contains either 0 or 1.

Putting that all together, the bass drum will play on all of the basis states whose 0 and 1 positions contain 0, which are `0000`, `0100`, `1000` and `1100`. 

You may be wondering why the bass drum, and not the other percussion instruments, are played as a result of this quantum circuit. The short answer is that the Quantum Music Playground chooses instruments and pitches based upon the phase angles mentioned earlier. The next section contains a more complete and satisfying explanation.

## Choosing instruments and pitches

Up to this point we've created a simple bass drum beat pattern by placing Hadamard gates on a quantum circuit. Now we're going to choose a different instrument to provide a cymbal crash at the beginning of each measure. As before, at the bottom of the Figure 7 is the Quantum Music Playground device, now expressing the cymbal part contained in the **Crash** clip in another one of the tracks labeled **808 Core Kit**. You may navigate to the that clip by selecting **Crash** from the dropdown list to the right of the **Load clips** button in the Quantum Music Playground device.

![Twinkle song cymbal part](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_crash_full_screenshot.png)

*Figure 7. Expressing the cymbal part contained in the Crash clip*



Let's examine the Quantum Music Playground device by itself in the following image.

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_crash_qmp.png)

*Figure 8. Zooming in on the cymbal part contained in the Crash clip*



The quantum circuit in this **Crash** clip contains just one gate, namely the **I** (also known as Identity) gate. The **I** gate doesn't alter the state of a wire, but it's used here to set the number of basis states, and therefore steps, to 16 for this clip. The length of this **Crash** clip is now the same length as the **Kick** clip, so as each clip is playing in a loop, the cymbal and the bass drum will play together on the downbeat of the measure, followed by the bass drum playing on the remaining three beats. 

To see why the **Cymbal**, rather than the **Bass Drum**, will be played, take a look at the disabled **Phs shft** slider and notice the value of 13 at the bottom. This indicates that the global phase angle shift, often referred to as *global phase shift*, of the quantum state is 13π/8 radians (292.5 degrees). This happens to correspond with the value of 13 to the right of the **Cymbal** row in the Figure 9.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/twinkle_crash_musical_sequence.png" alt="Twinkle Crash musical sequence" width=80%/>

*Figure 9. Using global phase shift to play the Cymbal*



As mentioned previously, each individual basis state contains a phase angle. Shifting the global phase by π/8 radians (22.5 degrees) shifts each individual phase by π/8 radians, which results in moving the notes up one instrument or pitch.

### Shifting the phase angles of basis states

To create an interesting beat pattern or melody, it is usually necessary to shift the phase angles of various basis states. A common way to accomplish this is to follow an **H** gate with a *phase* gate. To demonstrate this, we'll play hi-hat cymbals, shifting back and forth from open to closed hi-hats. The bottom of Figure 10 shows the Quantum Music Playground device, now expressing the hi-hat part contained in the **Hats A** clip in yet another one of the tracks labeled **808 Core Kit**.  

![Twinkle song hats part](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_full_screenshot.png)

*Figure 10. Expressing the hi-hat part contained in the Hats A clip* 



Now we'll examine the Quantum Music Playground device by itself in Figure 11. The quantum circuit in this **Hats A** clip contains a column of four **H** gates on wires **q0** - **q3**, which defines one measure with a beat pattern full of sixteenth notes. The circuit also contains two of the *phase gates* obtained from right column of the toolbox, and a *control gate modifier* taken from the toolbox's left column. 

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_qmp.png)

*Figure 11. Zooming in on the hi-hat part contained in the Hats A clip* 



We'll discuss phase gates and control gate modifiers shortly, but let's analyze the results of progressively adding gates to this circuit. The Figure 12 shows the Quantum Music Playground device after placing only the **H** gates. 

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_qmp_h_gates.png)

*Figure 12. Status after placing only the H gates* 



As with the **Kick** clip earlier, the **H** gates play a beat pattern on the **Bass Drum**. Next, Figure 13 shows the **Phase** button selected and the **Phs shft** slider adjusted so that the **Closed Hi-hat** is played with the same beat pattern, having been shifted by a global phase. 

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_qmp_global_phase_shift.png)

*Figure 13. Status after shifting global phase* 



To play the **Open Hi-hat** on the third sixteenth note of every beat, we employ one of the *phase gates*, specifically the **S** gate, as shown in Figure 14. 

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_qmp_s_gate.png)

*Figure 14. Using a phase gate to play the Open Hi-hat* 



The **S** gate rotates the phase on a wire by 4π/8 radians, which rotates the phase on each of the basis states whose corresponding position contains a 1. This is seen more clearly in Figure 15, in which the rotation is performed on every basis state whose bit in position 1 is 1

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/twinkle_hats_musical_sequence_s.png" alt="Twinkle Crash musical sequence" width=80%/>

*Figure 15. Zooming in on using a phase gate to play the Open Hi-hat* 



Finally, to play the **Open Hi-hat** on the fourth sixteenth note of every beat, we employ another one of the *phase gates*, specifically the **S†** gate, in conjunction with the control gate modifier. This is shown in Figure 16.

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_hats_qmp_sdg_gate.png)

*Figure 16. Tweaking the sequence with a controlled-S gate* 



The **S†** gate rotates the phase on a wire by 12π/8 radians. However, when a control gate modifier is placed in the same column, the **S†** gate only operates when the control wire has a value of 1. This rotates the phase on each of the basis states whose positions corresponding to the **S†** gate and the control gate modifier both contain a 1. This is seen more clearly in the Figure 17, in which the rotation is performed on every basis state whose bits in positions 0 and 1 are both 1.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/twinkle_hats_musical_sequence_sdg.png" alt="Twinkle Crash musical sequence" width=80%/>

*Figure 17. Zooming in on the effects of using the controlled-S gate* 



## Playing with rhythm

So far, the rhythms we've created have consisted of instruments playing at consistent time intervals. For example, our **Kick** clip played the bass drum on the four beats of the measure, and the **Hats A** clip played the hi-hats on each sixteenth note. Now we'll discuss how to create syncopated rhythms, beginning with playing on the off-beats. To demonstrate this, we'll play a snare drum on beat two of a measure, and a hand clap on beat four of the measure, but neither will be played on beats one and three. The bottom of the Figure 18 shows the Quantum Music Playground device, now expressing the **Snare Drum** and **Hand Clap** parts contained in the **Snare/Clap** clip in another one of the tracks labeled **808 Core Kit**.

![Twinkle song cymbal part](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_snare_full_screenshot.png)

*Figure 18. Expressing the Snare Drum and Hand Clap parts* 



Looking at the Figure 19, we see that there are some similarities to the previous example in which open and closed hi-hats were played, but there are some differences to point out as well. 

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_snare_qmp.png)

*Figure 19. Zooming in on the Snare Drum and Hand Clap parts* 



One difference is that the Phase gate on the quantum circuit is labeled **z1**, but there is no **z1** gate in the toolbox. This is because out of the 16 possible phase gates that rotate multiples of π/8 radians, only five of them (**T**, **S**, **Z**, **S†** and **T†**) have names. The rest are expressed in Quantum Music Playground with a lower case **z** and the number of π/8 radians by which they rotate the phase. Here is a table of phase gates and their rotations expressed in π/8 radians.

| Phase gate:      | z0   | z1   | T    | z3   | S    | z5   | z6   | z7   | Z    | z9   | z10  | z11  | S†   | z13  | T†   | z15  |
| ---------------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| **π/8 radians**: | 0    | 1    | 2    | 3    | 4    | 5    | 6    | 7    | 8    | 9    | 10   | 11   | 12   | 13   | 14   | 15   |



When a gate is placed, or selected on the quantum circuit with the ✋ tool (near the bottom right in the toolbox), it may be rotated by adjusting the **Rotate** slider, or clicking and dragging the gate vertically.



Another difference from the previous example is that an **X** gate, also known as a *NOT* gate or a *bit-flip* gate, is leveraged on wire **q2** to make the instruments play on the off beats. This is seen more clearly in Figure 20, where the notes appear on some basis states whose bit in positions 2 is 1, because the **X** gate flipped that wire to having a value of 1.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/twinkle_snare_musical_sequence.png" alt="Twinkle snare/clap musical sequence" width=80%/>

*Figure 20. Making instruments play on the off-beats* 



### Leveraging the CNOT gate for more syncopation

Let's discuss how to create more syncopated rhythms, leveraging the CNOT gate. This gate is also known as the *controlled-NOT* gate, as well as the *controlled-X gate*. To demonstrate this technique, we'll play a simple bass line in a syncopated fashion. The bottom of the Figure 21 shows the Quantum Music Playground device, now expressing the note pitches to be played by the bass guitar in the **Bass B** clip of the track labeled **Basic Electr**.

![Twinkle song cymbal part](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_bass_b_full_screenshot.png)

*Figure 21. Using C-NOT gate for syncopation* 



Looking at Figure 22, you'll notice that note pitches are specified rather than percussion instruments. The main point of this example, however, is the use of the control gate modifier with the **X** gate, turning it into a *CNOT* gate. Notice that the bit is flipped only when the control wire has a value of 1. This flips the bit in the position on which the **X** gate is placed, but only on the basis states whose position corresponding to the control gate modifier contain a 1.

![Quantum Music Playground screenshot](/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/v095/twinkle_bass_b_qmp.png)

*Figure 22. Zooming in on using C-NOT gate for syncopation* 



This is seen more clearly in Figure 23, in which the notes appear on some basis states whose bit in position 0 is 1, because the **X** gate conditionally flipped that wire to having a value of 1.

<img src="/Users/James.Weaver@ibm.com/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect/quantum-dj-max/images/twinkle_bass_b_musical_sequence.png" alt="Twinkle snare/clap musical sequence" width=80%/>

*Figure 23. Examining the resulting sequence in terms of basis states* 

TODO: Decide how much more functionality to include.

### Conclusion

The Quantum Music Playground represents one of many possible approaches for leveraging quantum computing to composing music.

TODO: Finish Conclusion