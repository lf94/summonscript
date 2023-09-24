const net = require("node:net");

const koffi = require("koffi");
const { toMesh } = require("../index");

const preview = (sdf, boundingBox, currentResolution, targetResolution) => {
  console.log("Resolution: " + currentResolution);
  const meshMemory = toMesh(sdf, boundingBox, currentResolution);
  const mesh = koffi.decode(meshMemory, "libfive_mesh");
  const verts = koffi.decode(mesh.verts, "libfive_vec3", mesh.vert_count);
  const tris = koffi.decode(mesh.tris, "libfive_tri", mesh.tri_count);

  const START_MAGIC_BYTES = Buffer.from([ 0x00, 0xe3, 0x42, 0x61, 0x85, 0x96, 0x41, 0x46, 0x37, 0xc9, 0xfd, 0xa5, 0x51, 0xf9, 0x60, 0x68 ]);
  const client = net.createConnection({ path: "./viewer/libfive_mesh.sock" });
  console.log("Writing START_MAGIC_BYTES");
  client.write(START_MAGIC_BYTES, () => {});
  client.on('data', (chunk) => {
    switch (chunk[0]) {
      // the viewer has gone back to watching for start magic bytes,
      // we can close the connection.
      case 0: {
        console.log("Closing pipe");
        client.destroy();
        break;
      }
      case 1: {
        console.log("START_MAGIC_BYTES Acknowledged");
        console.log("Writing points count");
        const tri_count_buf = Buffer.allocUnsafe(4);
        tri_count_buf.writeUInt32LE(mesh.tri_count * 3);
        client.write(tri_count_buf, () => {});
        break;
      }
      case 2: {
        console.log("Points count Acknowledged");
        console.log("Writing points data");
        let coord_buf;
        let pt;
        for (const tri of tris) {
          coord_buf = Buffer.allocUnsafe(4 * 3 * 3);
          pt = verts[tri.a];
          coord_buf.writeFloatLE(pt.x, 0);
          coord_buf.writeFloatLE(pt.y, 4);
          coord_buf.writeFloatLE(pt.z, 8);
          pt = verts[tri.b];
          coord_buf.writeFloatLE(pt.x, 12);
          coord_buf.writeFloatLE(pt.y, 16);
          coord_buf.writeFloatLE(pt.z, 20);
          pt = verts[tri.c];
          coord_buf.writeFloatLE(pt.x, 24);
          coord_buf.writeFloatLE(pt.y, 28);
          coord_buf.writeFloatLE(pt.z, 32);
          client.write(coord_buf, () => {});
        }

        koffi.free(meshMemory);
        break;
      }
    }
  });
};

module.exports = {
  preview
};
