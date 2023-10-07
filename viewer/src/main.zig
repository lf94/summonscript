const std = @import("std");
pub const raylib = @cImport({
  @cInclude("raylib.h");
  @cInclude("raymath.h");
});
const fcntl = @cImport(@cInclude("fcntl.h"));
const rlights = @import("rlights.zig");

// When started, the program watches stdin for commands.
// When finding this, then read in the number of incoming points so memory can
// be allocated, and then read in tuples of points in x,y,z u32 format.
// When reaching the last one go back into "watching" mode.

const Command = enum(u8) {
  start = 1,
  quit,
};

const State = enum {
  wait_command,
  read_vertex_count,
  read_vertices,
  load_model,
  shutdown,
};

fn u8sToVector3s(slice: []u8) []raylib.Vector3 {
  var result: []raylib.Vector3 = &[0]raylib.Vector3{};
  result.ptr = @alignCast(@ptrCast(slice.ptr));
  result.len = slice.len / 4 / 3;
  return result;
}

const Mesh = struct {
  isLoaded: bool = false,
  vertexCount: i32,
  triangleCount: i32,
  vertices: ?std.ArrayList(u8),
  normals: ?[]raylib.Vector3,
  raylib: ?raylib.Mesh,

  fn initRaylibMesh(self: *@This(), allocator: std.mem.Allocator) !void {
    const vertices = u8sToVector3s(self.vertices.?.items);
    self.normals = try computeNormals(allocator, vertices);

    self.raylib = .{
      .vertexCount = self.vertexCount,
      .triangleCount = @divFloor(self.vertexCount, 3),
      .vertices = @ptrCast(vertices),
      .texcoords = null,
      .texcoords2 = null,
      .normals = @ptrCast(self.normals.?),
      .indices = null,
      .tangents = null,
      .colors = null,
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
};

pub const options_override = .{ .io_mode = .evented };

inline fn Translate(v: raylib.Vector3) raylib.Matrix {
  return raylib.MatrixTranslate(v.x, v.y, v.z);
}

inline fn Rotate(axis: raylib.Vector3, angle: f32) raylib.Matrix {
  return raylib.MatrixRotate(axis, angle);
}

inline fn Scale(x: f32, y: f32, z: f32) raylib.Matrix {
  return raylib.MatrixScale(x, y, z);
}

inline fn Add(a: raylib.Vector3, b: raylib.Vector3) raylib.Vector3 {
  return raylib.Vector3Add(a, b);
}

inline fn Sub(a: raylib.Vector3, b: raylib.Vector3) raylib.Vector3 {
  return raylib.Vector3Subtract(a, b);
}

inline fn Mul(a: raylib.Matrix, b: raylib.Matrix) raylib.Matrix {
  return raylib.MatrixMultiply(a, b);
}

inline fn Neg(v: raylib.Vector3) raylib.Vector3 {
  return raylib.Vector3Negate(v);
}

// Compose a sequence of transforms to a single one.
fn Compose(mats: []const raylib.Matrix) raylib.Matrix {
  var result = raylib.MatrixIdentity();
  for (mats) |m| {
    result = Mul(result, m);
  }
  return result;
}

// Ported from raylib/rcamera.h
fn GetCameraForward(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3Normalize(
    raylib.Vector3Subtract(camera.target, camera.position)
  );
}

fn GetCameraRight(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3CrossProduct(GetCameraForward(camera), camera.up);
}

fn GetCameraDown(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3Negate(camera.up);
}

fn GetCameraLeft(camera: raylib.Camera3D) raylib.Vector3 {
  return raylib.Vector3CrossProduct(camera.up, GetCameraForward(camera));
}

pub const CAMERA_INITIAL_POSITION = .{ .x = 0.0, .y = -25.0, .z = 5.0 };

pub fn updateCamera(camera: *raylib.Camera3D) void {
  const key_pressed = raylib.GetKeyPressed();
  switch (key_pressed) {
    raylib.KEY_SPACE => camera.position = CAMERA_INITIAL_POSITION,
    raylib.KEY_ONE => camera.position = .{ .x = 0.0, .y = 0.0, .z = 25.0 },
    raylib.KEY_TWO => camera.position = .{ .x = 0.0, .y = 0.0, .z = -25.0 },
    raylib.KEY_THREE => camera.position = .{ .x = -25.0, .y = 0.0, .z = 0.0 },
    raylib.KEY_FOUR => camera.position = .{ .x = 25.0, .y = 0.0, .z = 0.0 },
    else => {},
  }

  // Zoom
  const scale = 1 - raylib.GetMouseWheelMove() * 0.1; // 0.1 is just a scroll scaling factor

  // Rotation
  var rotateX: f32 = 0;
  var rotateY: f32 = 0;
  if (raylib.IsMouseButtonDown(raylib.MOUSE_BUTTON_LEFT)) {
    const mouse_delta = raylib.GetMouseDelta();
    const deg: f32 = (2.0 * std.math.pi)/360.0;
    rotateX = -180*deg * (mouse_delta.x / @as(f32, @floatFromInt(raylib.GetScreenWidth())));
    rotateY = -180*deg * (mouse_delta.y / @as(f32, @floatFromInt(raylib.GetScreenHeight())));
  }

  // Translation
  var translate = raylib.Vector3Zero();
  if (raylib.IsKeyDown(raylib.KEY_UP)) { translate = Add(translate, camera.up) ; }
  if (raylib.IsKeyDown(raylib.KEY_DOWN)) { translate = Add(translate, GetCameraDown(camera.*)); }
  if (raylib.IsKeyDown(raylib.KEY_LEFT)) { translate = Add(translate, GetCameraLeft(camera.*)) ; }
  if (raylib.IsKeyDown(raylib.KEY_RIGHT)) { translate = Add(translate, GetCameraRight(camera.*)) ; }
  translate = raylib.Vector3Scale(translate, 3 * raylib.GetFrameTime());
  camera.target = raylib.Vector3Add(camera.target, translate);

  // Apply overall transformation.
  camera.position = raylib.Vector3Transform(
    camera.position,
    Compose(&[_]raylib.Matrix{
      Translate(Sub(translate, camera.target)),
      Rotate(GetCameraRight(camera.*), rotateY),
      Rotate(camera.up, rotateX),
      Scale(scale, scale, scale),
      Translate(camera.target),
  }));
}

pub fn main() !void {
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
  var shader = raylib.LoadShaderFromMemory(
    @embedFile("shaders/lighting.vs"),
    @embedFile("shaders/lighting.fs"),
  );

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

  var state = State.wait_command;

  const XYZ_SIZE = @sizeOf(f32) * 3;
  const SOCKET_BUFFER_SIZE = 32768 * 8; // Apparently the default on Linux
  const XYZ_COORDS_SIZE_BYTES = XYZ_SIZE * (SOCKET_BUFFER_SIZE / XYZ_SIZE);

  const RPCBuffers = struct {
    command_bytes: [1]u8,
    vertex_count: [@sizeOf(u32)]u8,
    // Try to saturate internal Linux sockets
    xyz_coords: [XYZ_COORDS_SIZE_BYTES]u8,
  };

  var buffers = RPCBuffers{
    .command_bytes  = [1]u8{0},
    .vertex_count = [_]u8{0} ** @sizeOf(u32),
    .xyz_coords = [_]u8{0} ** XYZ_COORDS_SIZE_BYTES,
  };

  var mesh: Mesh = .{
    .vertexCount = 0,
    .triangleCount = 0,
    .vertices = null,
    .normals = null,
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

  while (!raylib.WindowShouldClose() and state != .shutdown) {
    
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
        .wait_command => {
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

          const bytes_read = try connection_maybe.?.stream.reader().read(&buffers.command_bytes);
          if (bytes_read == 0) continue;

          const command: Command = @enumFromInt(buffers.command_bytes[0]);
          state = switch (command) {
            Command.start => .read_vertex_count,
            Command.quit => .shutdown,
          };

          std.debug.print("wait_command -> read_vertex_count transition\n", .{});
          state = .read_vertex_count;
          _ = try connection_maybe.?.stream.write(&.{1});
        },
        .read_vertex_count => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.vertex_count);
          mesh.vertexCount = std.mem.bytesToValue(i32, &buffers.vertex_count);
          std.debug.print("Vertex count: {}\n", .{mesh.vertexCount});
          std.debug.print("read_vertex_count -> read_vertices transition\n", .{});
          mesh.vertices = std.ArrayList(u8).init(std.heap.raw_c_allocator);
          state = .read_vertices;
          _ = try connection_maybe.?.stream.write(&.{2});
        },

        // Vertices come in triplets. raylib can only hold 16-bit amount of indices.
        // So we avoid them.
        .read_vertices => {
          var bytes_read = try connection_maybe.?.stream.reader().read(&buffers.xyz_coords);

          try mesh.vertices.?.appendSlice(buffers.xyz_coords[0..bytes_read]);
          if ((mesh.vertices.?.items.len / 4 / 3) != mesh.vertexCount) continue;
          
          std.debug.print("read_vertices -> load_model transition\n", .{});
          state = .load_model;
          _ = try connection_maybe.?.stream.write(&.{3});
        },
        .load_model => {
          const bytes_read = try connection_maybe.?.stream.reader().read(&buffers.command_bytes);

          // If there's no acknowledge byte, skip this until we get one.
          if (bytes_read != 1 or buffers.command_bytes[0] != 1) continue;

          // Unload previous model from VRAM. This unloads the model's mesh.
          if (model_maybe) |model| { raylib.UnloadModel(model); }

          // Create the new mesh/model from the streamed data
          model_maybe = try mesh.loadModel(std.heap.raw_c_allocator, shader);

          state = .wait_command;
          std.debug.print("load_model -> wait_command transition\n", .{});
          _ = try connection_maybe.?.stream.write(&.{4});
          connection_maybe.?.stream.close();
          connection_maybe = null;
        },
        .shutdown => {
          std.debug.print("Shutting down\n", .{});
        },
      }
    }
  }
}

fn computeNormals(
  allocator: std.mem.Allocator,
  vertices: []raylib.Vector3,
) ![]raylib.Vector3 {
  // One normal per vertex.
  var normals = try allocator.alloc(raylib.Vector3, vertices.len);
  
  // For each triangle
  for (0..vertices.len / 3) |j| {
    const v = raylib.Vector3Normalize(raylib.Vector3CrossProduct(
      raylib.Vector3Subtract(vertices[3 * j + 1], vertices[3 * j]),
      raylib.Vector3Subtract(vertices[3 * j + 2], vertices[3 * j])));
    normals[3 * j] = v;
    normals[3 * j + 1] = v;
    normals[3 * j + 2] = v;
  }

  return normals;
}
