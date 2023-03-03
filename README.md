# node-libfive

libfive bindings for nodejs.

See https://libfive.com/ for more detalis about libfive.

## Features

All of libfive has been bound in `libfive.js`.

libfive also contains a standard library of functions exposed as a library,
which I've created bindings for, in `libfive-stdlib.js`. This contains functions
like `box_exact`, `sphere`, `reflect_x`, `scale_y`, etc.

`index.js` contains a useful but still very early wrapper for idiomatic
JavaScript.

This is all a labor of love. Any help to maintain or grow this to completion
would greatly be appreciated.

Yeah the documentation is completely lacking. Just look at the examples and
code for now - sorry!

## Usage

See `examples/shipping-box.js` for the most complete example right now.

The libfive library usually installs into `/usr/local/lib/` so that's where
this binding package looks for it.

I suggest downloading `nodemon` and use it with your favorite STL viewer so
you can edit JavaScript and on save see the changes instantly.
