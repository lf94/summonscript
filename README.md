# node-libfive

libfive bindings for nodejs.

See https://libfive.com/ for more details about libfive.

## Features

All of libfive has been bound in `libfive.js`.

libfive also contains a standard library of functions exposed as a library,
which I've created bindings for, in `libfive-stdlib.js`. This contains functions
like `box_exact`, `sphere`, `reflect_x`, `scale_y`, etc.

`index.js` is an early wrapper for a nicer JS-focused API interface.

The documentation is completely lacking. Please look at the examples and
code for now - sorry!

## Usage

Obviously libfive is required. The library, libfive.so, must be located in
`/usr/local/lib/`, since this is where the bindings are searched.
