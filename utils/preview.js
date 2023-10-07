const net = require("node:net");

const koffi = require("koffi");
const {
  libfive_mesh_delete,
} = require("../libfive");

const preview = (sdfFn, boundingBox, currentResolution, targetResolution) => {
    const p = new Promise((resolve, reject) => {
      const meshMemory = sdfFn().toMesh(boundingBox, currentResolution);

      const mesh = koffi.decode(meshMemory, "libfive_mesh");
      const verts = koffi.decode(mesh.verts, "libfive_vec3", mesh.vert_count);
      const tris = koffi.decode(mesh.tris, "libfive_tri", mesh.tri_count);

      const client = net.createConnection({ path: "/tmp/libfive_mesh.sock" });

      // Don't bother trying to render anything.
      if (mesh.tri_count < 3) return;

      const START_BYTES = Buffer.from([ 0x01 ]);
      client.write(START_BYTES, () => {});
      client.on('data', (chunk) => {

        switch (chunk[0]) {
          case 1: {
            const buf = Buffer.allocUnsafe(4);
            buf.writeUInt32LE(mesh.tri_count * 3);
            client.write(buf, () => {});
            break;
          }
          case 2: {
            let offset = 0;
            const buf = Buffer.allocUnsafe(tris.length * 3 * 3 * 4);
            for (const tri of tris) {
              buf.writeFloatLE(verts[tri.a].x, offset + 0);
              buf.writeFloatLE(verts[tri.a].y, offset + 4);
              buf.writeFloatLE(verts[tri.a].z, offset + 8);
              offset += 12;
              buf.writeFloatLE(verts[tri.b].x, offset + 0);
              buf.writeFloatLE(verts[tri.b].y, offset + 4);
              buf.writeFloatLE(verts[tri.b].z, offset + 8);
              offset += 12;
              buf.writeFloatLE(verts[tri.c].x, offset + 0);
              buf.writeFloatLE(verts[tri.c].y, offset + 4);
              buf.writeFloatLE(verts[tri.c].z, offset + 8);
              offset += 12;
            }
            client.write(buf, () => {});
            break;
          }
          case 3: {
            const buf = Buffer.allocUnsafe(1);
            buf.writeUInt8(1);
            client.write(buf, () => {});
            break;
          }
          case 4: {
            client.destroy();
            libfive_mesh_delete(meshMemory);
            resolve({ cur: currentResolution, next: targetResolution });
            break;
          }
        }
      });
    });

    return p.then(({ cur, next }) => {
      if (cur >= next) return;
      return preview(sdfFn, boundingBox, cur * 2, next);
    });
};

module.exports = {
  preview,
};
