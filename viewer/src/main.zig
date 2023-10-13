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
  unknown = 0, // Just to make it clear, even though enums start at 0.
  render,
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
    self.normals = try Mesh.computeNormals(allocator, vertices);

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

  // rask was the genius behind this too.
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
};

//
// A lot of camera code helpers below.
// Thank you to rask for figuring out camera stuff :D.
//

// This position is based on the fact most 3D printers have a 10cmx10cm bed.
// So we want to be a little out from there.
// Due to auto-focusing the initial position doesn't matter much at all.
pub const CAMERA_INITIAL_POSITION = .{ .x = 0.0, .y = -25.0, .z = 5.0 };

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
  camera.target = raylib.Vector3Add(camera.target, translate);
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
    })
  );
}

fn boundingBoxOfVertices(vertices: []raylib.Vector3) raylib.BoundingBox {
  const mesh: raylib.Mesh = .{
    .vertexCount = @intCast(vertices.len),
    .triangleCount = @intCast(vertices.len * 3),
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
  return raylib.GetMeshBoundingBox(mesh);
}

fn diffVector3Slices(
  allocator: std.mem.Allocator,
  old: []raylib.Vector3,
  new: []raylib.Vector3,
) ![]raylib.Vector3 {
  var result = std.ArrayList(raylib.Vector3).init(allocator);
  for (0..new.len) |i| {
    var found = false;
    out: for (0..old.len) |j| {
      if (raylib.Vector3Equals(old[j], new[i]) == 1) {
        found = true;
        break :out;
      }
    }
    if (!found) {
      try result.append(new[i]);
    }
  }
  return result.items;
}

// Those lines and text you see on blueprints showing the length or radius
// of an edge. For now we just support length annotations.
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

const XYZ_SIZE = @sizeOf(f32) * 3;
// We try to saturate the socket using a large size. On Linux apparently
// 32768 is the largest size but looking around further it seems it can be
// much higher. The higher it is the faster large models are transfered.
const SOCKET_BUFFER_SIZE = 32768 * 8;
const XYZ_COORDS_SIZE_BYTES = XYZ_SIZE * (SOCKET_BUFFER_SIZE / XYZ_SIZE);

// We could probably use a single large buffer, but it's easier to reason
// about memory usage this way.
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

pub fn main() !void {
  const screen = .{ .width = 640, .height = 480, };

  raylib.SetConfigFlags(raylib.FLAG_MSAA_4X_HINT);
  raylib.InitWindow(screen.width, screen.height, "libfive_mesh viewer");
  defer raylib.CloseWindow();

  // Define the camera to look into our 3d world
  var camera = raylib.Camera3D {
    .position   = CAMERA_INITIAL_POSITION,           // Camera position
    .target     = .{ .x = 0.0, .y = 0.0, .z = 0.0 }, // Camera looking at point
    .up         = .{ .x = 0.0, .y = 0.0, .z = 1.0 }, // Camera up vector (rotation towards target)
    .fovy       = 45.0,                              // Camera field-of-view Y
    .projection = raylib.CAMERA_PERSPECTIVE,         // Camera mode type
  };

  var shader = raylib.LoadShaderFromMemory(
    @embedFile("shaders/lighting.vs"),
    @embedFile("shaders/lighting.fs"),
  );

  // "Location" is essentially a "pointer reference".
  // Allows for communication between our program and the shader.
  shader.locs[raylib.SHADER_LOC_VECTOR_VIEW] =
    raylib.GetShaderLocation(shader, "viewPos");

  // equiv. to RGBA
  var ambient_value = .{ .x = 0.75, .y = 0.75, .z = 0.75, .w = 1.0 };

  var ambient_loc = raylib.GetShaderLocation(shader, "ambient");
  raylib.SetShaderValue(shader, ambient_loc, &ambient_value, raylib.SHADER_UNIFORM_VEC4);

  // Assigning the return value would be used for say, rendering a sphere that
  // represents the source of light. We just care about showing a light though.
  _ = rlights.CreateLight(
    rlights.LightType.point,
    .{ .x = 10, .y = -25.0, .z = 100.0 }, // an arbitrary point way up in the sky.
    raylib.Vector3Zero(),
    raylib.WHITE, shader
  ).?;

  // 60 is arbitrary. To be honest this could probably be even lower to save
  // on GPU computation.
  raylib.SetTargetFPS(60);

  var state = State.wait_command;

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

  var model_maybe: ?raylib.Model = null;

  // The vertices that we track between first iteration renders. We use these
  // vertices to figure out what part of the model to focus on. In other words,
  // we focus on the part of the model that is changing.
  var vertices_delta_first_render: ?[]raylib.Vector3 = null;
  var focused = false;

  var annotations = std.ArrayList(Annotation).init(std.heap.raw_c_allocator);
  var target_annotation_index: u32 = 0;

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
    
    // If it's the first render, focus on the changes
    out: {
      if (mesh.iteration != 0 or focused == true) break :out;
      if (vertices_delta_first_render) |vertices| {
        if (vertices.len < 3) break :out; // Nothing to really focus on.

        const bb = boundingBoxOfVertices(vertices);
        const center = raylib.Vector3Lerp(bb.min, bb.max, 0.5);
        const dist = raylib.Vector3Distance(center, bb.max);
        camera.position = raylib.Vector3Add(
          raylib.Vector3Scale(
            Neg(GetCameraForward(camera)),
            dist * 1.33 // 1.33 is an arbitrary scale. It just looks nice.
          ),
          center
        );
        camera.target = center;
        focused = true;
      }
    }

    // Look here for input handling also.
    updateCamera(&camera);
    
    raylib.SetShaderValue(
      shader,
      shader.locs[raylib.SHADER_LOC_VECTOR_VIEW],
      &camera.position,
      raylib.SHADER_UNIFORM_VEC3
    );

    raylib.BeginDrawing();
    raylib.ClearBackground(raylib.WHITE);
    
    raylib.BeginMode3D(camera);

    if (model_maybe) |model| {
      raylib.DrawModel(model, .{ .x = 0, .y = 0, .z = 0 }, 1, raylib.BLUE);
    }

    // For now we only draw annotation lines. Drawing the text will involve
    // adding a lot of raylib code.
    for (annotations.items) |annotation| {
      raylib.DrawLine3D(annotation.line.start, annotation.line.end, raylib.BLACK);
    }
    
    raylib.EndMode3D();
    raylib.EndDrawing();

    out: {
      switch (state) {
        .wait_command => {
          var accepted_addr: std.net.Address = undefined;
          var adr_len: std.os.socklen_t = @sizeOf(std.net.Address);
          const accept_result = std.c.accept(server.sockfd.?, &accepted_addr.any, &adr_len);
          if (connection_maybe != null) { break :out; }
          if (accept_result >= 0) {
            connection_maybe = std.net.StreamServer.Connection{
              .stream = std.net.Stream{ .handle = @intCast(accept_result) },
              .address = accepted_addr,
            };
          } else {
            break :out;
          }

          const bytes_read = try connection_maybe.?.stream.reader().read(&buffers.command_bytes);
          if (bytes_read == 0) continue;

          const command: Command = @enumFromInt(buffers.command_bytes[0]);
          state = switch (command) {
            Command.unknown => continue,
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
        .read_iteration => {
          _ = try connection_maybe.?.stream.reader().read(&buffers.iteration_byte);
          mesh.iteration = buffers.iteration_byte[0];
          std.debug.print("Iteration: {}\n", .{ mesh.iteration });

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

          // Wait for "acknowledge byte".
          if (bytes_read != 1 or buffers.command_bytes[0] != 1) continue;

          // Unload previous model from VRAM. This unloads the model's mesh.
          if (model_maybe) |model| { raylib.UnloadModel(model); }

          // Create the new mesh/model from the streamed data
          model_maybe = try mesh.loadModel(std.heap.raw_c_allocator, shader);

          // If we're on the first iteration, calculate and focus on changes
          if (mesh.iteration == 0) {
            focused = false;
            if (vertices_delta_first_render) |vertices| {
              const different_vertices = try diffVector3Slices(
                std.heap.c_allocator,
                vertices,
                u8sToVector3s(mesh.vertices.?.items)
              );

              if (different_vertices.len > 0) {
                vertices_delta_first_render = different_vertices;
              }

            // This will only occur on the absolutely first render, like when
            // the program starts.
            } else {
              vertices_delta_first_render = u8sToVector3s(mesh.vertices.?.items);
            }
          }

          state = .wait_command;
          std.debug.print("load_model -> wait_command transition\n", .{});
          _ = try connection_maybe.?.stream.write(&.{1});
          connection_maybe.?.stream.close();
          connection_maybe = null;
        },

        // Tracks annotations so they aren't duplicated when re-rendering.
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

          if (found) {
            // 0 means abort the sequence of events that would normally happen.
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
        .shutdown => {
          std.debug.print("Shutting down\n", .{});
        },
      }
    }
  }
}

