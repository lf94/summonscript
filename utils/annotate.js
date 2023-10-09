const net = require("node:net");

const koffi = require("koffi");

const annotate = (id, lineStartEnd, text) => {
  const client = net.createConnection({ path: "/tmp/libfive_mesh.sock" });

  const ANNOTATE_BYTE = Buffer.from([ 0x02 ]);
  client.write(ANNOTATE_BYTE, () => {});

  client.on('data', (chunk) => {
    if (chunk[0] != 1) return;

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
        buf.writeFloatLE(lineStartEnd[0][0]);
        buf.writeFloatLE(lineStartEnd[0][1]);
        buf.writeFloatLE(lineStartEnd[0][2]);
        buf.writeFloatLE(lineStartEnd[1][0]);
        buf.writeFloatLE(lineStartEnd[1][1]);
        buf.writeFloatLE(lineStartEnd[1][2]);
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
        break;
      }
    }
  });
};

module.exports = {
  preview,
}
