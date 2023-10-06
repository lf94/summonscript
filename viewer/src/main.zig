const std = @import("std");
pub const raylib = @cImport({
  @cInclude("raylib.h");
  @cInclude("raymath.h");
});
const fcntl = @cImport(@cInclude("fcntl.h"));
const rlights = @import("rlights.zig");

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

fn convert(slice: []f32) []raylib.Vector3 {
  var result: []raylib.Vector3 = &[0]raylib.Vector3{};
  result.ptr = @ptrCast(slice.ptr);
  result.len = slice.len / 3;
  return result;
}

const Mesh = struct {
  isLoaded: bool = false,
  vertexCount: i32,
  triangleCount: i32,
  vertices: ?std.ArrayList(f32),
  normals: ?[]raylib.Vector3,
  indices: ?std.ArrayList(u16),
  raylib: ?raylib.Mesh,

  fn initRaylibMesh(self: *@This(), allocator: std.mem.Allocator) !void {
    self.normals = try computeNormals(
      allocator,
      convert(self.vertices.?.items),
      self.indices.?.items
    );

    self.raylib = .{
      .vertexCount = self.vertexCount,
      .triangleCount = self.triangleCount,
      .vertices = @ptrCast(self.vertices.?.items),
      .texcoords = null,
      .texcoords2 = null,
      .normals = @ptrCast(self.normals.?),
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

  fn deinitRaylibMesh(self: *@This(), allocator: std.mem.Allocator) void {
    self.vertices.?.deinit();
    self.indices.?.deinit();
    allocator.free(self.normals.?);
  }

  fn loadModel(
    self: *@This(),
    allocator: std.mem.Allocator,
    shader: raylib.Shader
  ) !raylib.Model {
    try self.initRaylibMesh(allocator);
    raylib.UploadMesh(&self.raylib.?, true);
    var model = raylib.LoadModelFromMesh(self.raylib.?);

    // Do this so that DrawMesh will send the material's data to  shader.
    model.materials[0].shader = shader;
    return model;
  }

  fn unloadModel(
    self: *@This(),
    //model: raylib.Model,
  ) void {
    raylib.UnloadMesh(self.raylib.?);
  }
};

pub const options_override = .{ .io_mode = .evented };

// Ported from raylib/rcamera.h
fn GetCameraForward(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3Normalize(
    raylib.Vector3Subtract(camera.target, camera.position)
  );
}

fn GetCameraRight(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3CrossProduct(GetCameraForward(camera), camera.up);
}

pub const CAMERA_INITIAL_POSITION = .{ .x = 0.0, .y = -25.0, .z = 5.0 };

pub fn updateCamera(camera: *raylib.Camera3D) void {
  const key_pressed = raylib.GetKeyPressed();
  switch (key_pressed) {
    raylib.KEY_SPACE => camera.position = CAMERA_INITIAL_POSITION,
    raylib.KEY_UP => camera.position = .{ .x = 0.0, .y = 0.0, .z = 25.0 },
    raylib.KEY_DOWN => camera.position = .{ .x = 0.0, .y = 0.0, .z = -25.0 },
    raylib.KEY_LEFT => camera.position = .{ .x = -25.0, .y = 0.0, .z = 0.0 },
    raylib.KEY_RIGHT => camera.position = .{ .x = 25.0, .y = 0.0, .z = 0.0 },
    else => {},
  }

  const mouse_scroll = raylib.GetMouseWheelMove();
  if (mouse_scroll != 0) {
    const s = 1 - (mouse_scroll * 0.1); // 0.1 is just a scroll scaling factor
    camera.position = raylib.Vector3Transform(
      camera.position,
      raylib.MatrixScale(s, s, s)
    );
  }

  if (raylib.IsMouseButtonDown(raylib.MOUSE_BUTTON_LEFT)) {
    var mouse_delta = raylib.GetMouseDelta();
    const deg: f32 = (2.0 * std.math.pi)/360.0;

    mouse_delta.x = 180*deg * (mouse_delta.x / @as(f32, @floatFromInt(raylib.GetScreenWidth())));
    mouse_delta.y = 180*deg * (mouse_delta.y / @as(f32, @floatFromInt(raylib.GetScreenHeight())));

    camera.position = raylib.Vector3Transform(
      camera.position,
      raylib.MatrixRotate(camera.up, -mouse_delta.x)
    );

    camera.position = raylib.Vector3Transform(
      camera.position,
      // This is quite cool. Basically find the axis to the right
      // of the camera! Look at cross product animations to understand.
      raylib.MatrixRotate(GetCameraRight(camera.*), -mouse_delta.y)
    );
  }
}

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
  var camera = raylib.Camera3D {
    .position = CAMERA_INITIAL_POSITION, // Camera position
    .target   = .{ .x = 0.0, .y =   0.0, .z = 0.0 }, // Camera looking at point
    .up       = .{ .x = 0.0, .y =   0.0, .z = 1.0 }, // Camera up vector (rotation towards target)
    .fovy = 45.0, // Camera field-of-view Y
    .projection = raylib.CAMERA_PERSPECTIVE, // Camera mode type
  };

  // Load basic lighting shader.
  var shader = raylib.LoadShader("./src/shaders/lighting.vs",
                                 "./src/shaders/lighting.fs");

  // Get shader location for camera position.
  shader.locs[raylib.SHADER_LOC_VECTOR_VIEW] = raylib.GetShaderLocation(shader, "viewPos");

  // Ambient light level.
  var ambientLoc = raylib.GetShaderLocation(shader, "ambient");
  var v: raylib.Vector4 = .{ .x = 0.75, .y = 0.75, .z = 0.75, .w = 1.0 };
  raylib.SetShaderValue(shader, ambientLoc, &v,
                        raylib.SHADER_UNIFORM_VEC4);

  // Create point light source.
  _ = rlights.CreateLight(rlights.LightType.point, .{ .x = 10, .y = -25.0, .z = 100.0 },
                        @bitCast(raylib.Vector3Zero()), raylib.WHITE, shader).?;

  raylib.SetTargetFPS(60);

  var state = State.watch_start_magic_bytes;

  const XYZ_SIZE = @sizeOf(f32) * 3;
  const ABC_SIZE = @sizeOf(u32) * 3;
  const SOCKET_BUFFER_SIZE = 32768; // Apparently the default on Linux
  const XYZ_COORDS_SIZE_BYTES = XYZ_SIZE * (SOCKET_BUFFER_SIZE / XYZ_SIZE);
  const ABC_INDICES_SIZE_BYTES = ABC_SIZE * (SOCKET_BUFFER_SIZE / ABC_SIZE);

  const RPCBuffers = struct {
    ack: [1]u8,
    magic_bytes: [START_MAGIC_BYTES.len]u8,
    vertex_count: [@sizeOf(u32)]u8,
    triangle_count: [@sizeOf(u32)]u8,
    // Try to saturate internal Linux sockets
    xyz_coords: [XYZ_COORDS_SIZE_BYTES]u8,
    abc_indices: [ABC_INDICES_SIZE_BYTES]u8,
  };

  var buffers = RPCBuffers{
    .ack = [1]u8{0},
    .magic_bytes = [_]u8{0} ** START_MAGIC_BYTES.len,
    .vertex_count = [_]u8{0} ** @sizeOf(u32),
    .triangle_count = [_]u8{0} ** @sizeOf(u32),
    .xyz_coords = [_]u8{0} ** XYZ_COORDS_SIZE_BYTES,
    .abc_indices = [_]u8{0} ** ABC_INDICES_SIZE_BYTES,
  };

  var mesh: Mesh = .{
    .vertexCount = 0,
    .triangleCount = 0,
    .vertices = null,
    .normals = null,
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
    
    // Our custom input handling that affects the camera
    updateCamera(&camera);
    
    // Send camera position to shader.
    raylib.SetShaderValue(shader, shader.locs[raylib.SHADER_LOC_VECTOR_VIEW],
                          &camera.position, raylib.SHADER_UNIFORM_VEC3);

    raylib.BeginDrawing();
    raylib.ClearBackground(raylib.WHITE);
    
    raylib.BeginMode3D(camera);

    if (model_maybe) |model| {
      raylib.DrawModel(model, .{ .x = 0, .y = 0, .z = 0 }, 1, raylib.BLUE);
    }
    
    raylib.EndMode3D();
    raylib.EndDrawing();

    blk: {
      switch (state) {
        .watch_start_magic_bytes => {
          var accepted_addr: std.net.Address = undefined;
          var adr_len: std.os.socklen_t = @sizeOf(std.net.Address);
          const accept_result = std.c.accept(server.sockfd.?, &accepted_addr.any, &adr_len);
          if (connection_maybe != null) { break :blk; }
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
          state = .read_vertices;
          _ = try connection_maybe.?.stream.write(&.{2});
        },
        .read_vertices => {
          var bytes_read = try connection_maybe.?.stream.reader().read(&buffers.xyz_coords);
          var offset: usize = 0;

          while (bytes_read > 0) : (bytes_read -= 4) {
            // Could be an x, y or z coordinate
            const coord = std.mem.bytesToValue(f32, @as(*[4]u8, @ptrCast(buffers.xyz_coords[offset..offset + 4])));
            try mesh.vertices.?.append(coord);
            offset += 4;
          }

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
          state = .read_indices;
          _ = try connection_maybe.?.stream.write(&.{4});
        },
        .read_indices => {
          var bytes_read = try connection_maybe.?.stream.reader().read(&buffers.abc_indices);
          var offset: usize = 0;
          while (bytes_read > 0) : (bytes_read -= 4) {
            // Could be an x, y or z coordinate
            const index = std.mem.bytesToValue(u16, @as(*[2]u8, @ptrCast(buffers.abc_indices[offset..offset + 2])));
            try mesh.indices.?.append(index);
            offset += 4;
          }

          if ((mesh.indices.?.items.len / 3) != mesh.triangleCount) continue;
          
          std.debug.print("read_indices -> load_model transition\n", .{});
          state = .load_model;
          _ = try connection_maybe.?.stream.write(&.{5});
        },
        .load_model => {
          const bytes_read = try connection_maybe.?.stream.reader().read(&buffers.ack);

          // If there's no acknowledge byte, skip this until we get one.
          if (bytes_read != 1 or buffers.ack[0] != 1) continue;

          // Unload previous model from VRAM. This unloads the model's mesh.
          if (model_maybe) |_| { mesh.unloadModel(); }

          // Create the new mesh/model from the streamed data
          model_maybe = try mesh.loadModel(allocator, shader);

          state = .watch_start_magic_bytes;
          std.debug.print("load_model -> watch_start_magic_bytes transition\n", .{});
          _ = try connection_maybe.?.stream.write(&.{6});
          connection_maybe.?.stream.close();
          connection_maybe = null;
        },
      }
    }
  }
}

fn computeNormals(allocator: std.mem.Allocator,
                  vertices: []raylib.Vector3,
                  indices: []u16) ![]raylib.Vector3 {
  // One normal per vertex.
  var normals = try allocator.alloc(raylib.Vector3, vertices.len);
  for (0..normals.len) |i| {
    normals[i] = raylib.Vector3Zero();
  }

  // For each triangle (triplet of indices)
  for (0..indices.len / 3) |j| {
    const v = raylib.Vector3Normalize(raylib.Vector3CrossProduct(
      raylib.Vector3Subtract(vertices[indices[3 * j + 1]], vertices[indices[3 * j]]),
      raylib.Vector3Subtract(vertices[indices[3 * j + 2]], vertices[indices[3 * j]])));
    normals[indices[3 * j]] = raylib.Vector3Add(normals[indices[3 * j]], v);
    normals[indices[3 * j + 1]] = raylib.Vector3Add(normals[indices[3 * j + 1]], v);
    normals[indices[3 * j + 2]] = raylib.Vector3Add(normals[indices[3 * j + 2]], v);
  }

  // This has the effect of averaging the normals.
  for (0..normals.len) |i| {
    normals[i] = raylib.Vector3Normalize(normals[i]);
  }

  return normals;
}
