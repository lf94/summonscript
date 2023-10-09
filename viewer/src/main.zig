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
  render = 1,
  annotate,
  quit,
};

const State = enum {
  wait_command,
  read_mesh_id,
  read_iteration,
  read_vertex_count,
  read_vertices,
  load_model,
  read_annotation_id,
  read_annotation_line_start_end,
  read_annotation_text,
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
  id: u32 = 0,
  iteration: u32 = 0,
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

fn slideCamera(camera: *raylib.Camera3D, slide: raylib.Vector3) void {
  camera.target = Add(camera.target, slide);
  camera.position = Add(camera.position, slide);
}

fn setCameraTarget(camera: *raylib.Camera3D, target: raylib.Vector3) void {
  slideCamera(camera, Sub(target, camera.target));
}

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
  slideCamera(camera, translate);

  // Update camera up vector.
  camera.up = raylib.Vector3Transform(
    camera.up,
    Rotate(GetCameraRight(camera.*), rotateY)
  );
  
  // Apply overall transformation.
  camera.position = raylib.Vector3Transform(
    camera.position,
    Compose(&[_]raylib.Matrix{
      Translate(Neg(camera.target)),
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
    id_bytes: [@sizeOf(u32)]u8,
    iteration_byte: [1]u8,
    vertex_count: [@sizeOf(u32)]u8,
    // Try to saturate internal Linux sockets
    xyz_coords: [XYZ_COORDS_SIZE_BYTES]u8,
    line_start_end: [@sizeOf(f32) * 6]u8,
    text: [1024]u8,
  };

  var buffers = RPCBuffers{
    .command_bytes  = [1]u8{0},
    .id_bytes = [_]u8{0} ** @sizeOf(u32),
    .iteration_byte = [1]u8{0},
    .vertex_count = [_]u8{0} ** @sizeOf(u32),
    .xyz_coords = [_]u8{0} ** XYZ_COORDS_SIZE_BYTES,
    .line_start_end = [_]u8{0} ** (@sizeOf(f32) * 6),
    .text = [_]u8{0} ** 1024,
  };

  var mesh: Mesh = .{
    .vertexCount = 0,
    .triangleCount = 0,
    .vertices = null,
    .normals = null,
    .raylib = null,
  };

  const Annotation = struct {
    id: u32,
    line: struct {
      start: raylib.Vector3,
      end: raylib.Vector3,
    } = .{
      .start = .{ .x = 0, .y = 0, .z = 0 },
      .end = .{ .x = 0, .y = 0, .z = 0 },
    },
    text: []u8 = "",
  };

  var annotations = std.ArrayList(Annotation).init(std.heap.raw_c_allocator);
  var target_annotation_index: u32 = 0;

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

    for (annotations.items) |annotation| {
      raylib.DrawLine3D(annotation.line.start, annotation.line.end, raylib.BLACK);
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
            Command.render => .read_mesh_id,
            Command.annotate => .read_annotation_id,
            Command.quit => .shutdown,
          };

          std.debug.print("Acknowledging command\n", .{});

          _ = try connection_maybe.?.stream.write(&.{1});
        },
        .read_mesh_id => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.id_bytes);
          mesh.id = std.mem.bytesToValue(u32, &buffers.id_bytes);
          std.debug.print("read_id -> read_iteration\n", .{});
          state = .read_iteration;
          _ = try connection_maybe.?.stream.write(&.{1});
        },
        .read_annotation_id => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.id_bytes);
          const id = std.mem.bytesToValue(u32, &buffers.id_bytes);

          var found = false;
          for (annotations.items, 0..) |annotation, index| {
            if (annotation.id != id) continue;
            target_annotation_index = @intCast(index);
            found = true;
            break;
          }

          // 0 means abort the sequence of events that would normally come
          if (found) {
            _ = try connection_maybe.?.stream.write(&.{0});
            state = .wait_command;
          } else {
            std.debug.print("Appending new annotation {}\n", .{ id });
            try annotations.append(Annotation { .id = id });

            target_annotation_index = @intCast(annotations.items.len - 1);
            std.debug.print("index {}\n", .{ target_annotation_index });

            _ = try connection_maybe.?.stream.write(&.{1});
            state = .read_annotation_line_start_end;
          }
        },
        .read_annotation_line_start_end => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.line_start_end);

          const annotation = &annotations.items[target_annotation_index];

          annotation.line = .{
            .start = .{
              .x = std.mem.bytesToValue(f32, buffers.line_start_end[0..4]),
              .y = std.mem.bytesToValue(f32, buffers.line_start_end[4..8]),
              .z = std.mem.bytesToValue(f32, buffers.line_start_end[8..12]),
            },
            .end = .{
              .x = std.mem.bytesToValue(f32, buffers.line_start_end[12..16]),
              .y = std.mem.bytesToValue(f32, buffers.line_start_end[16..20]),
              .z = std.mem.bytesToValue(f32, buffers.line_start_end[20..24]),
            }
          };

          std.debug.print("read_annotation_line_start_end -> read_annotation_text\n", .{});
          state = .read_annotation_text;
          _ = try connection_maybe.?.stream.write(&.{1});
        },
        .read_annotation_text => {
          const bytes_read = try connection_maybe.?.stream.reader().read(&buffers.text);

          const annotation = &annotations.items[target_annotation_index];

          const text = try std.heap.c_allocator.alloc(u8, bytes_read);
          std.mem.copy(u8, text, buffers.text[0..bytes_read]);
          annotation.text = text;

          std.debug.print("read_annotation_text -> wait_command \n", .{});
          state = .wait_command;
          _ = try connection_maybe.?.stream.write(&.{1});
          connection_maybe.?.stream.close();
          connection_maybe = null;
        },
        .read_iteration => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.iteration_byte);
          mesh.iteration = buffers.iteration_byte[0];
          std.debug.print("Iteration: {}\n", .{ mesh.iteration });

          //if (mesh.iteration == 0) {
          //  // This is where you'd start to compare vertices.
          //}
          
          std.debug.print("read_iteration -> read_vertex_count\n", .{});
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
          _ = try connection_maybe.?.stream.write(&.{1});
        },

        // Vertices come in triplets. raylib can only hold 16-bit amount of indices.
        // So we avoid them.
        .read_vertices => {
          var bytes_read = try connection_maybe.?.stream.reader().read(&buffers.xyz_coords);

          try mesh.vertices.?.appendSlice(buffers.xyz_coords[0..bytes_read]);
          if ((mesh.vertices.?.items.len / 4 / 3) != mesh.vertexCount) continue;
          
          std.debug.print("read_vertices -> load_model transition\n", .{});
          state = .load_model;
          _ = try connection_maybe.?.stream.write(&.{1});
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
          _ = try connection_maybe.?.stream.write(&.{1});
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

fn centerPoint(vertices: []raylib.Vector3) raylib.Vector3 {
  const mesh: raylib.Mesh = .{
    .vertexCount = vertices.len(),
    .triangleCount = vertices.len() * 3,
    .vertices = @ptrCast(vertices),
    .texcoords = null,
    .texcoords2 = null,
    .normals = null,
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
  const bb = raylib.GetMeshBoundingBox(mesh);
  return raylib.Vector3Lerp(bb.min, bb.max, 1/2);
}

fn diff(
  allocator: std.mem.Allocator,
  xs: []raylib.Vector3,
  ys: []raylib.Vector3,
) !std.ArrayList(raylib.Vector3) {
  var result = std.ArrayList(raylib.Vector3).init(allocator);
  for (0..xs.len) |i| {
    if (raylib.Vector3Equals(xs[i], ys[i]) != 0) {
      try result.append(ys[i]);
    }
  }
  return result;
}
