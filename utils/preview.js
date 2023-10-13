const net = require("node:net");

const koffi = require("koffi");
const {
  libfive_mesh_delete,
} = require("../libfive");

const preview = (sdfFn, boundingBox, currentResolution, targetResolution, n = 0) => {
    const p = new Promise((resolve, reject) => {
      console.log("Meshing");
      const meshMemory = sdfFn().toMesh(boundingBox, currentResolution);
      console.log("Meshed");

      const mesh = koffi.decode(meshMemory, "libfive_mesh");
      const verts = koffi.decode(mesh.verts, "libfive_vec3", mesh.vert_count);
      const tris = koffi.decode(mesh.tris, "libfive_tri", mesh.tri_count);

      console.log("Decoded data");

      const client = net.createConnection({ path: "/tmp/libfive_mesh.sock" });
      console.log("Connected to view3d");

      // Don't bother trying to render anything.
      if (mesh.tri_count < 3) {
        console.log("Not enough triangles to render: " + mesh.tri_count);
        return Promise.reject();
      }

      const START_BYTES = Buffer.from([ 0x01 ]);
      client.write(START_BYTES, () => {});

      let step = 1;
      client.on('data', (chunk) => {
        if (chunk[0] != 1) return;
        switch (step) {
          // Write the id for this mesh (for now always 1)
          case 1: {
            console.log("Sending mesh id: " + 0x01);
            const buf = Buffer.from([ 0x01 ]);
            client.write(buf, () => {});
            break;
          }
          // Write the current render iteration
          case 2: {
            console.log("Sending iteration: " + n);
            const buf = Buffer.from([ n ]);
            client.write(buf, () => {});
            break;
          }
          // Write the amount of vertices we're transfering
          case 3: {
            console.log("Sending vert count: " + (mesh.tri_count * 3));
            const buf = Buffer.allocUnsafe(4);
            buf.writeUInt32LE(mesh.tri_count * 3);
            client.write(buf, () => {});
            break;
          }
          // Write the vertices data
          case 4: {
            console.log("Sending vertices");
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
          case 5: {
            const buf = Buffer.allocUnsafe(1);
            buf.writeUInt8(1);
            client.write(buf, () => {});
            break;
          }
          case 6: {
            client.destroy();
            libfive_mesh_delete(meshMemory);
            resolve({ cur: currentResolution, next: targetResolution });
            break;
          }
        }

        step += 1;
      });
    });

    return p.then(({ cur, next }) => {
      if (cur >= next) return;
      return preview(sdfFn, boundingBox, cur * 2, next, n+1);
    });
};

module.exports = {
  preview,
};
