const net = require("node:net");

const koffi = require("koffi");
const { toMesh } = require("../index");

const preview = (sdf, boundingBox, currentResolution, targetResolution) => {
  const p = new Promise((resolve, reject) => {
    console.log("Resolution: " + currentResolution);
    const meshMemory = toMesh(sdf(), boundingBox, currentResolution);
    console.log("Meshed");
    const mesh = koffi.decode(meshMemory, "libfive_mesh");
    const verts = koffi.decode(mesh.verts, "libfive_vec3", mesh.vert_count);
    const tris = koffi.decode(mesh.tris, "libfive_tri", mesh.tri_count);

    const START_MAGIC_BYTES = Buffer.from([ 0x00, 0xe3, 0x42, 0x61, 0x85, 0x96, 0x41, 0x46, 0x37, 0xc9, 0xfd, 0xa5, 0x51, 0xf9, 0x60, 0x68 ]);
    const client = net.createConnection({ path: "/tmp/libfive_mesh.sock" });
    console.log("Writing START_MAGIC_BYTES");
    client.write(START_MAGIC_BYTES, () => {});
    client.on('data', (chunk) => {
      switch (chunk[0]) {
        case 0: {
          console.log("Closing pipe");
          client.destroy();
          koffi.free(meshMemory);
          resolve({ cur: currentResolution, next: targetResolution });
          break;
        }
        case 1: {
          console.log("START_MAGIC_BYTES Acknowledged");
          console.log("Writing vertex count");
          const buf = Buffer.allocUnsafe(4);
          buf.writeUInt32LE(mesh.vert_count);
          client.write(buf, () => {});
          break;
        }
        case 2: {
          console.log("Vertex count Acknowledged");
          console.log("Writing vertices");
          let buf;
          let pt;
          for (const vert of verts) {
            buf = Buffer.allocUnsafe(4 * 3);
            buf.writeFloatLE(vert.x, 0);
            buf.writeFloatLE(vert.y, 4);
            buf.writeFloatLE(vert.z, 8);
            client.write(buf, () => {});
          }
          break;
        }
        case 3: {
          console.log("Vertices Acknowledged");
          console.log("Writing triangle count");
          console.log(mesh.tri_count);
          const buf = Buffer.allocUnsafe(4);
          buf.writeUInt32LE(mesh.tri_count);
          client.write(buf, () => {});
          break;
        }
        case 4: {
          console.log("Triangle count Acknowledged");
          console.log("Writing indices");
          let buf;
          let pt;
          for (const tri of tris) {
            buf = Buffer.allocUnsafe(4 * 3);
            buf.writeUInt32LE(tri.a, 0);
            buf.writeUInt32LE(tri.b, 4);
            buf.writeUInt32LE(tri.c, 8);
            client.write(buf, () => {});
          }
          break;
        }
        // the viewer is loading the model now.
        // we can close the connection.
        case 5: {
          console.log("Indices Acknowledged");
          break;
        }
      }
    });
  });

  return p.then(({ cur, next }) => {
    if (cur >= next) return;
    return preview(sdf, boundingBox, cur * 2, next);
  });
};

module.exports = {
  preview
};
