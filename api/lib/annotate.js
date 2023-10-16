const net = require("node:net");

const koffi = require("koffi");

const annotate = (id, lineStartEnd, text) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ path: "/tmp/libfive_mesh.sock" });

    const ANNOTATE_BYTE = Buffer.from([ 0x02 ]);
    client.write(ANNOTATE_BYTE, () => {});

    let step = 1;
    client.on('data', (chunk) => {
      if (chunk[0] == 0) {
        client.destroy();
        resolve();
        return;
      }

      switch (step) {
        // Write the id for this annotation
        case 1: {
          const buf = Buffer.from([ id ]);
          client.write(buf, () => {});
          break;
        }
        // Write the line start and end point
        case 2: {
          const buf = Buffer.allocUnsafe(4 * (3 + 3));
          buf.writeFloatLE(lineStartEnd[0][0], 0);
          buf.writeFloatLE(lineStartEnd[0][1], 4);
          buf.writeFloatLE(lineStartEnd[0][2], 8);
          buf.writeFloatLE(lineStartEnd[1][0], 12);
          buf.writeFloatLE(lineStartEnd[1][1], 16);
          buf.writeFloatLE(lineStartEnd[1][2], 20);
          client.write(buf, () => {});
          break;
        }
        // Write the text
        case 3: {
          const buf = Buffer.from(text);
          client.write(buf, () => {});
          break;
        }
        case 4: {
          client.destroy();
          resolve();
          break;
        }
      }
      step += 1;
    });
  });
};

module.exports = { annotate }
