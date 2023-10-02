const std = @import("std");
const raylib = @cImport(@cInclude("raylib.h"));
const fcntl = @cImport(@cInclude("fcntl.h"));

// When started, the program watches stdin for magic bytes that are randomly generated.
// When finding this, then read in the number of incoming points so memory can
// be allocated, and then read in tuples of points in x,y,z u32 format.
// When reaching the last one go back into "watching" mode.

const START_MAGIC_BYTES = [_]u8{ 0x00, 0xe3, 0x42, 0x61, 0x85, 0x96, 0x41, 0x46, 0x37, 0xc9, 0xfd, 0xa5, 0x51, 0xf9, 0x60, 0x68 };

const State = enum {
  watch_start_magic_bytes,
  read_vertex_count,
  read_vertices,
  read_triangle_count,
  read_indices,
  load_model,
};

const Mesh = struct {
  isLoaded: bool = false,
  vertexCount: i32,
  triangleCount: i32,
  vertices: ?std.ArrayList(f32),
  indices: ?std.ArrayList(u16),
  raylib: ?raylib.Mesh,

  fn initRaylibMesh(self: *@This()) void {
    self.raylib = .{
      .vertexCount = self.vertexCount,
      .triangleCount = self.triangleCount,
      .vertices = @ptrCast(self.vertices.?.items),
      .texcoords = null,
      .texcoords2 = null,
      .normals = null,
      .tangents = null,
      .colors = null,
      .indices = @ptrCast(self.indices.?.items),
      .animVertices = null,
      .animNormals = null,
      .boneIds = null,
      .boneWeights = null,
      .vaoId = 0,
      .vboId = null,
    };
  }

  fn loadModel(self: *@This()) raylib.Model {
    self.initRaylibMesh();
    raylib.UploadMesh(&self.raylib.?, false);
    return raylib.LoadModelFromMesh(self.raylib.?);
  }
};

pub const options_override = .{ .io_mode = .evented };

pub fn main() !void {
  var gpa = std.heap.GeneralPurposeAllocator(.{}){};
  var allocator = gpa.allocator();

  const screen = .{
    .width = 640,
    .height = 480,
  };

  raylib.SetConfigFlags(raylib.FLAG_MSAA_4X_HINT);
  raylib.InitWindow(screen.width, screen.height, "libfive_mesh viewer");
  defer raylib.CloseWindow();

  // Define the camera to look into our 3d world
  var camera = raylib.Camera3D{
    .position = .{ .x = 0.0, .y = -25.0, .z = 5.0 }, // Camera position
    .target = .{ .x = 0.0, .y = 0.0, .z = 0.0 }, // Camera looking at point
    .up = .{ .x = 0.0, .y = 0.0, .z = 1.0 }, // Camera up vector (rotation towards target)
    .fovy = 45.0, // Camera field-of-view Y
    .projection = raylib.CAMERA_PERSPECTIVE, // Camera mode type
  };

  raylib.SetTargetFPS(60);

  var state = State.watch_start_magic_bytes;

  const RPCBuffers = struct {
    magic_bytes: [START_MAGIC_BYTES.len]u8,
    vertex_count: [@sizeOf(u32)]u8,
    triangle_count: [@sizeOf(u32)]u8,
    xyz_coords: [@sizeOf(f32) * 3]u8,
    abc_indices: [@sizeOf(u32) * 3]u8,
  };

  var buffers = RPCBuffers{
    .magic_bytes = [_]u8{0} ** START_MAGIC_BYTES.len,
    .vertex_count = [_]u8{0} ** @sizeOf(u32),
    .triangle_count = [_]u8{0} ** @sizeOf(u32),
    .xyz_coords = [_]u8{0} ** (@sizeOf(f32) * 3),
    .abc_indices = [_]u8{0} ** (@sizeOf(u32) * 3),
  };

  var mesh: Mesh = .{
    .vertexCount = 0,
    .triangleCount = 0,
    .vertices = null,
    .indices = null,
    .raylib = null,
  };

  var model_maybe: ?raylib.Model = null;

  var server = std.net.StreamServer.init(.{});
  defer server.deinit();

  const SOCKET_PATH = "/tmp/libfive_mesh.sock";
  const socket_address = try std.net.Address.initUnix(SOCKET_PATH);
  defer std.fs.cwd().deleteFile(SOCKET_PATH) catch unreachable;

  try server.listen(socket_address);
  const sockfd = server.sockfd.?;
  const flags = fcntl.fcntl(sockfd, fcntl.F_GETFL);
  _ = fcntl.fcntl(sockfd, fcntl.F_SETFL, flags | fcntl.O_NONBLOCK);
  var connection_maybe: ?std.net.StreamServer.Connection = null;

  while (!raylib.WindowShouldClose()) {
    if (state == .watch_start_magic_bytes) {
      raylib.UpdateCamera(&camera, raylib.CAMERA_FREE);

      raylib.BeginDrawing();
      raylib.ClearBackground(raylib.DARKBLUE);
      raylib.BeginMode3D(camera);

      if (model_maybe) |model| {
        raylib.DrawModel(model, .{ .x = 0, .y = 0, .z = 0 }, 1, raylib.GRAY);
      }

      raylib.EndMode3D();
      raylib.EndDrawing();
    }

    blk: {
      switch (state) {
        .watch_start_magic_bytes => {
          var accepted_addr: std.net.Address = undefined;
          var adr_len: std.os.socklen_t = @sizeOf(std.net.Address);
          const accept_result = std.c.accept(server.sockfd.?, &accepted_addr.any, &adr_len);
          if (accept_result >= 0) {
            connection_maybe = std.net.StreamServer.Connection{
              .stream = std.net.Stream{ .handle = @intCast(accept_result) },
              .address = accepted_addr,
            };
          } else {
            break :blk;
          }
          _ = try connection_maybe.?.stream.reader().read(&buffers.magic_bytes);
          if (std.mem.eql(u8, &buffers.magic_bytes, &START_MAGIC_BYTES) == false) continue;
          std.debug.print("watch_start_magic_bytes -> read_vertex_count transition\n", .{});
          state = .read_vertex_count;
          _ = try connection_maybe.?.stream.write(&.{1});
        },
        .read_vertex_count => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.vertex_count);
          mesh.vertexCount = std.mem.bytesToValue(i32, &buffers.vertex_count);
          std.debug.print("Vertex count: {}\n", .{mesh.vertexCount});
          std.debug.print("read_vertex_count -> read_vertices transition\n", .{});
          mesh.vertices = std.ArrayList(f32).init(allocator);
          std.debug.print("Allocated space for vertices\n", .{});
          state = .read_vertices;
          _ = try connection_maybe.?.stream.write(&.{2});
        },
        .read_vertices => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.xyz_coords);
          const x = std.mem.bytesToValue(f32, buffers.xyz_coords[0..4]);
          const y = std.mem.bytesToValue(f32, buffers.xyz_coords[4..8]);
          const z = std.mem.bytesToValue(f32, buffers.xyz_coords[8..12]);
          try mesh.vertices.?.append(x);
          try mesh.vertices.?.append(y);
          try mesh.vertices.?.append(z);

          if ((mesh.vertices.?.items.len / 3) != mesh.vertexCount) continue;
          
          std.debug.print("read_vertices -> read_triangle_count transition\n", .{});
          state = .read_triangle_count;
          _ = try connection_maybe.?.stream.write(&.{3});
        },
        .read_triangle_count => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.triangle_count);
          mesh.triangleCount = std.mem.bytesToValue(i32, &buffers.triangle_count);
          std.debug.print("Triangle count: {}\n", .{mesh.triangleCount});
          std.debug.print("read_triangle_count -> read_indices transition\n", .{});
          mesh.indices = std.ArrayList(u16).init(allocator);
          std.debug.print("Allocated space for indices\n", .{});
          state = .read_indices;
          _ = try connection_maybe.?.stream.write(&.{4});
        },
        .read_indices => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.abc_indices);
          try mesh.indices.?.append(std.mem.bytesToValue(u16, buffers.abc_indices[2..4]));
          try mesh.indices.?.append(std.mem.bytesToValue(u16, buffers.abc_indices[6..8]));
          try mesh.indices.?.append(std.mem.bytesToValue(u16, buffers.abc_indices[10..12]));

          if ((mesh.indices.?.items.len / 3) != mesh.triangleCount) continue;
          
          std.debug.print("read_indices -> load_model transition\n", .{});
          state = .load_model;
          _ = try connection_maybe.?.stream.write(&.{5});
        },
        .load_model => {
          // Unload previous model from VRAM. This unloads the model's mesh.
          // if (model_maybe) |model| { raylib.UnloadModel(model); }

          // Create the new mesh/model from the streamed data
          model_maybe = mesh.loadModel();

          state = .watch_start_magic_bytes;
          std.debug.print("load_model  -> watch_start_magic_bytes transition\n", .{});
          _ = try connection_maybe.?.stream.write(&.{0});
          connection_maybe.?.stream.close();
        },
      }
    }
  }
}
