# SummonScript

<p align="center">
<img width="320" src="/logo.png" />
</p>
<p align="center">Manifest manifold models with magical machinations.</p>
<p align="center">In other words: use code to model objects.</p>

## Features

* Use code (JavaScript) to describe models
* Compatible with any text editor
* Streaming mesh viewer for a tight feedback loop
* Forever non-breaking version changes
* Small technology stack
* Has a fun theme around magic :D
* Can possibly make you feel like a young programmer again? :ooo

## Screenshots

![Repeating cubes in a circle](/repeat.png)
![A gear](/gear.png)
![A sphere with surface details](/gyroid.png)

## Demos

* Overview: https://youtu.be/kqYgkv2R5Ig
* Gear case study: https://youtu.be/mS1kLKEyC1g
* Surface level details: https://youtu.be/o58s1bPI1ZA

## Installation

You'll need to gather four ingredients: NodeJS 0.19, Zig 0.11, raylib and libfive.

Honestly the versions of these shouldn't matter *too* much.

I suggest searching how to install all of these, as their instructions could
change at any time, or could be easier for your platform of choice.

I apologize I don't follow the defacto expectation of binaries being available.
I have reasons for this but they aren't important to mention here.

---

After installing those, run `npm install` so it can install koffi, the FFI
binding package. (Imagine that, a single JS dependency for this project :)

Finally, go into `4_viewer/` and build it with `zig build`. The binary is output
to `zig-out/` so feel free to install it anywhere.

You have completed the first leg of your journey.

## Usage

You're going to want to start the viewer first so you can see something.

The default view is just a white window.

Head on over to `1_tutorial/`. Then check out `2_examples/` and maybe run a couple.

To run anything, you run it like an ordinary JavaScript file: `node file.js`

And that's literally all to it.

How you want to setup the rest of your environment is completely up to you.
For example, in my editor, I type `:cad` and it starts the viewer and opens a
new file. On save, it runs the script so the viewer updates. On quit it'll close
the viewer too.

## Community

Use GitHub Issues for basically everything.

If you want more personal communication, come see us in
[irc.libera.chat #summonscript](https://web.libera.chat/).

## Calling all math wizards and math witches

I need your help. SDFs are a difficult subject for me. In particular, it is
difficult to create SDF code for sketching. At the least we need to be able
to combine lines, arcs, and beziers. I will help you in any way I can with the
system, but the actual math is out of my reach. Thank you for reading my plea.

Of course, if you come up with any other SDFs to add to SummonScript I would
love to merge them in. You will see my threshold for merging is very liberal.
I care most of all that code CAD is successful, and I need all the help I can
get my hands on.

## Background

This system falls into the realm of [code CAD](https://learn.cadhub.xyz/blog/curated-code-cad/).

Why another code CAD system? Simple, because systems like OpenSCAD, Cadquery, replicad,
and basically everything else cannot describe or handle complex models without
bringing your computer to its knees.

How am I able to offer something better? By sitting on the shoulder's of giants.

SummonScript is based on SDFs, Signed Distance Fields, a subject which is continually
growing in popularity year over year. It uses libfive to turn these mystical mathematical
objects into meshes.

The language the models are in is JavaScript. No, this doesn't mean code is run
in web browsers. I have intentionally kept SummonScript a desktop-first technology
in order to maintain a low tech (low-tech? :) stack. In theory as long as the OS
can run NodeJS, SummonScript will run there. Pretty sick right?

The last puzzle piece was being able to use any text editor to write code and
being able to see the changes quickly. This involved designing a 3D viewer in Zig
that uses a UNIX socket to read mesh data from SummonScripts. It's very small and
will continue to be. Any other code CAD systems are free to use this as well. It
remains quick even on complex models because it uses progressive rendering.

## I am looking for businesses who want to try code CAD!

As a testament to code CAD, I would absolutely love to put code CAD to real
work. I'm looking for anyone in particular that would have designed something
with traditional CAD, but is willing to put some faith into code CAD.

I will do an evaluation on how much work it would take and what it would cost.

I will also consult fellow code CAD enthusiasts.

Your final CAD product will be put on display here as a seminal case study in
the strengths and weaknesses of code CAD.

## Thanks

I would like to first thank those individuals who have created amazing technology
that is completely free. In particular this is a shoutout to mkeeter (libfive),
Koromix (koffi), raysan5 (raylib), the  Zig team, the V8 team, and
Inigo Quilez (SDFs). Without any one of these people, this project would
probably not exist.

Next I would sincerely like to thank all of the people in the code CAD space who
have given their time to me over the years. I will most likely forget to mention
someone, so please let me know if I've missed you.

* The OpenSCAD team (special thanks to InPhase)
* Doug Moen
* #openscad on libera
* replicad team
* CadQuery team
* my partner who's had to deal with me asking "come look!" a million times :D
* my friends who had to suffer similarly
* rask (code, knowledge contributions)
