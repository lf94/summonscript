const net = require("node:net");

const koffi = require("koffi");
const { cylinder, mm, toMesh } = require("../index");

const client = net.createConnection({ path: "./viewer/libfive_mesh.sock" });
const mesh = toMesh(cylinder(10*mm, 20*mm), [[-20*mm, -20*mm, -20*mm], [20*mm, 20*mm, 20*mm]], 1.0);
const verts = koffi.decode(mesh.verts, "libfive_vec3", mesh.vert_count);
const tris = koffi.decode(mesh.tris, "libfive_tri", mesh.tri_count);

const START_MAGIC_BYTES = Buffer.from([ 0x00, 0xe3, 0x42, 0x61, 0x85, 0x96, 0x41, 0x46, 0x37, 0xc9, 0xfd, 0xa5, 0x51, 0xf9, 0x60, 0x68 ]);

client.write(START_MAGIC_BYTES, () => { });

client.on('data', (chunk) => {
  switch (chunk[0]) {
    // the viewer has gone back to watching for start magic bytes,
    // we can close the connection.
    case 0: {
      console.log("closing");
      client.destroy();
      break;
    }
    case 1: {
      console.log("writing points count");
      const tri_count_buf = Buffer.allocUnsafe(4);
      tri_count_buf.writeUInt32LE(mesh.tri_count * 3);
      client.write(tri_count_buf, () => {
        console.log("ok");
      });
      break;
    }
    case 2: {
      console.log("writing points");
      // write every point
      break;
    }
  }
});

