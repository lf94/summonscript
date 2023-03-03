# node-libfive

## WORK IN PROGRESS

libfive bindings for nodejs.

See https://libfive.com/ for more detalis about libfive.

## Features

All of libfive has been bound in `libfive.js`. While this is a nice start,
a lot of useful functionality also lives in `libfive-stdlib.js` but hasn't
been completed yet. **I could use any help adding these. Otherwise I will add
them as needed by myself.**

`index.js` contains a useful but still very early wrapper for idiomatic
JavaScript.

This is all a labor of love. Any help to maintain or grow this to completion
would greatly be appreciated.

## Usage

See `examples/shipping-box.js` for the most complete example right now.

I suggest downloading `nodemon` and use it with your favorite STL viewer so
you can edit JavaScript and on save see the changes instantly.

In the future, I hope to use `node-sdl2` to create a window that renders
shader code each time there's a change, creating a smoother feedback loop. It
should be much faster than meshing and rendering. I welcome anyone who wants to
tackle this also.
