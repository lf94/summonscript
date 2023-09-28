# SummonScript

<p align="center">
<img width="320" src="/logo.png" />
</p>
<p align="center">Manifest manifold models with magical machinations.</p>
<p align="center">In other words: use code to model objects.</p>

## Features

* Use code to describe models
* Streaming mesh viewer for a tight feedback loop
* Compatible with any text editor
* Small technology stack
* Has a fun theme around magic :D

## Installation

You'll need three things: NodeJS 0.19, Zig 0.11 and raylib.

Honestly the versions of these shouldn't matter too much.

Then run `npm install` so it can install koffi, the FFI binding package. (Imagine
that, a single JS dependency for this project :)

Finally, go into `viewer/` and build it with `zig build`. The binary is output to
`zig-out/` so feel free to install it anywhere.

You're done.

## Usage

You're going to want to start the viewer first so it's listening for mesh data.

Look at `examples/` and maybe run a couple. They're all JavaScript, so you simply
do `node examples/something.js`!

And that's literally all to it. How you want to setup the rest of your environment
is completely up to you. For example, in my editor, I type `:cad` and it starts
the viewer and opens a new file. On save, it runs the script so the viewer updates.

## Background

This system falls into the realm of [code CAD](https://learn.cadhub.xyz/blog/curated-code-cad/").

Why another code CAD system? Simple, because systems like OpenSCAD, Cadquery, replicad,
and basically everything else cannot describe or handle complex models.

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

